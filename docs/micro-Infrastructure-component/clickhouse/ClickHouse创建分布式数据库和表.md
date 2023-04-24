+ # ClickHouse创建分布式数据库和表
在上一篇文章讲了如何配置CLickHouse集群，但是遇到了一些问题，在创建分布式分布式数据库和表时需要使用Zookeeper所以就先结束了，因为ClickHouse想要使用分布式的数据库或者表需要配置Zookeeper，那么本篇文章我们将讲解如何在K8S中运行Zookeeper集群和使用nfs网络存储进行持久化，最后再使用ClickHouse连接到Zookeeper集群创建分布式数据库和表。在 Kubernetes 中，我们可以通过 StorageClass 进行动态存储卷的管理和分配，而 NFS 是典型的动态存储之一。在创建 StorageClass 之前，确保已经有一个 NFS 服务器可用。
  + ## 1、安装nfs服务器
    + ### 安装完成后,NFS 服务将自动启动
      ``` shell
        # 安装命令
        sudo apt install nfs-kernel-server
        # 在 Ubuntu 20.04+上,NFS V2 被禁用.V3 和 V4 已启用.可以通过运行以下命令来验证:
        sudo cat /proc/fs/nfsd/versions

        # NFSv4 是将文件存储到/opt/nfsv4/data 中的,而我们希望将这个文件挂载到/data/nfs 中,所以我们需要创建挂载.打开/etc/fstab 添加如下内容
        sudo mkdir -p /data/nfs

        # 添加映射文件夹配置，这样我们就不需要每次重启系统后再手动挂载了.
        /data/nfs /opt/nfsv4/data none bind 0 0

        # 执行命令
        sudo nano /etc/exports

        # 添加如下内容,需要根据自己的实际情况调整文件夹目录和IP以及读写权限
        /data/nfs 192.168.31.0/24(rw,sync,no_root_squash,no_subtree_check,crossmnt,fsid=0)
      ```
    + ### 在这里,除了 no_root_squash 之外,对两个目录使用相同的配置选项.看看每个选项的含义:
      完成更改后,保存并关闭文件. 然后,要使您配置的客户端可以使用共享,请使用以下命令重新启动 NFS 服务器:
      ``` shell
        sudo systemctl restart nfs-kernel-server
      ```
    + ### 由于 NFS 会将 客户端 上的任何 root 操作转换为 nobody:nogroup 凭据作为安全措施.因此,需要更改目录所有权以匹配这些凭据.
      ``` shell
        sudo chown nobody:nogroup /data/nfs
        sudo chown nobody:nogroup /data
      ```
    + ### 同时为了保险起见,我们直接给/data 目录及其子目录搞一个读写权限(偷懒直接开个 777)
      ```shell
        sudo chmod 777 -R /data
      ```
    + ### 最后我们再开启防火墙的放行.若是没开启防火墙就无需关注了
      ```shell
        # 开启防火墙
        sudo ufw allow from '192.168.2.0/24' to any port nfs
        # 最后为了保险我们再重启一下服务.
        sudo systemctl restart nfs-kernel-server
        # 开启开机自启.
        sudo systemctl enable nfs-kernel-server
      ```
    + ### 创建zookeeper所需要的文件夹，
      因为我的Zookeeper不仅仅是CliCkHouse使用，后面还要安装kafka集群；所以我将文件夹进行了拆分，在/data/nfs/zookeeper的文件夹内创建了ClickHouse专用的文件夹分别是node1、node2、node3因为我的Zookeeper集群准备使用一拖二的策略，所以创建了三个文件夹。一拖二就是一个主节点外带两个flower节点。
      ``` shell
        # 执行创建文件夹命令加入-p是因为如果其中一个文件夹不存在那么它会自动创建文件夹
        sudo mkdir -p  /data/nfs/zookeeper
      ```
  + ## 2、在K8S中安装csi-driver-nfs使用此驱动连接nfs服务器
    其中，provisioner 指定了使用 kubernetes.io/nfs 这个插件进行存储卷的分配，并通过 parameters 参数指定了 NFS 服务器的 IP 和挂载的路径。
      ``` shell 
        # 开启helm3
        sudo microk8s enable helm3
        # 添加csi-driver-nfs 包管理器仓库
        sudo microk8s helm3 repo add csi-driver-nfs https://raw.githubusercontent.com/kubernetes-csi/csi-driver-nfs/master/charts

        # 更新helm3仓库地址
        sudo microk8s helm3 repo update

        # 在kube-system命名空间下安装csi-driver-nfs 
        sudo microk8s helm3 install csi-driver-nfs csi-driver-nfs/csi-driver-nfs \
        --namespace kube-system \
        --set kubeletDir=/var/snap/microk8s/common/var/lib/kubelet

        # 查看安装结果 一旦成功,就会输出类似如下图
        sudo microk8s kubectl wait pod --selector app.kubernetes.io/name=csi-driver-nfs --for condition=ready --namespace kube-system
      ```
      ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412100932.png)
  + ## 3、在K8s中部署zookeeper集群并使用nfs进行持久化
      [参考K8s官网yaml文件地址](https://raw.githubusercontent.com/kubernetes/website/main/content/en/examples/application/zookeeper/zookeeper.yaml)
    + ### **3.1、在K8S中创建Storage Classes和Persistent Volume Claims使用nfs网络存储作为数据存储**
      创建一个zookeeper使用Storage Classes远程连接到nfs的数据存储可以看zookeeper-sc-nfs.yaml，建议一个相同的应用指定一个文件夹目录，并且创建Storage Classes；provisioner字段固定使用的是nfs.csi.k8s.io
        ``` yaml
          apiVersion: storage.k8s.io/v1
          kind: StorageClass
          metadata:
            name: luck-zookeeper-nfs-csi # 替换你自己的
          provisioner: nfs.csi.k8s.io
          parameters:
            server: 192.168.31.70
            share: /data/nfs/zookeeper
          reclaimPolicy: Delete
          volumeBindingMode: Immediate  
        ```
    + ### **3.2、k8s部署zookeeper使用PodDisruptionBudget的作用**
      K8s PodDisruptionBudget 是一个用于设置 Pod 级别的容量限制的工具。它可以帮助您确保您的应用程序在受到 Pod 故障影响时仍然能够正常运行。Pod 故障可能会导致应用程序无法访问数据或无法响应用户请求。
      Pod 级别的容量限制可以帮助您确保您的应用程序在受到 Pod 故障影响时仍然能够正常运行。Pod 故障可能会导致应用程序无法访问数据或无法响应用户请求。您可以使用 PodDisruptionBudget 来设置 Pod 级别的容量限制。Pod 级别的容量限制可以帮助您确保您的应用程序在受到 Pod 故障影响时仍然能够正常运行。Pod 故障可能会导致应用程序无法访问数据或无法响应用户请求。
      您可以使用 PodDisruptionBudget 来设置 Pod 级别的容量限制。Pod 级别的容量限制可以帮助您确保您的应用程序在受到 Pod 故障影响时仍然能够正常运行。Pod 故障可能会导致应用程序无法访问数据或无法响应用户请求。
        ``` yaml 
          apiVersion: policy/v1
          kind: PodDisruptionBudget
          metadata:
            name: zookeeper-pdb
            namespace: luck-infrastructure
          spec:
            selector:
              matchLabels:
                app: zookeeper
            maxUnavailable: 1
        ```
    + ### **3.3、k8s部署zookeeper使用Service的作用**
        ``` yaml 
          # 集群内访问的Service用于选举leader节点使用
          apiVersion: v1
          kind: Service
          metadata:
            name: zookeeper-hs #Service 名称
            namespace: luck-infrastructure
            labels:
              app: zookeeper #StatefulSet 的label标签名称
          spec:
            ports:
            - port: 2888
              name: server
            - port: 3888
              name: leader-election
            clusterIP: None
            selector:
              app: zookeeper
          ---
          # 对外访问的Service，用于ClickHouse或者其他客户端连接，
          apiVersion: v1
          kind: Service
          metadata:
            name: zookeeper-cs
            namespace: luck-infrastructure
            labels:
              app: zookeeper #StatefulSet 的label标签名称
          spec:
            ports:
            - port: 2181
              name: client
              nodePort: 30110
            selector:
              app: zookeeper
            type: NodePort
        ```      
    + ### **3.4、k8s StatefulSet中volumeClaimTemplates的作用**
      StatefulSet 的 volumeClaimTemplates 是用来描述 PVC 的模板字段。PVC 是一种用来描述资源请求的 API，它定义了资源的访问模式和保留期限。StatefulSet 是一种基于 Deployment 的容器，它用来自动扩展和缩容。StatefulSet 中的每个 Pod 都需要有一个 PVC，它会被分配一个与 Pod 完全一致的编号。PVC 的名字会被分配一个与 Pod 完全一致的编号。其中这个自动创建的 PVC，与 PV 绑定成功后，就会进入 Bound 状态，这就意味着这个 Pod 可以挂载并使用这个 PV 了。使用volumeClaimTemplates的目的是因为我们需要给每一个pod提供专用存储，则StatefulSet必须使用volumeClaimTemplates。基于该模板，为每个pod创建PersistentVolumeClaim，并配置要绑定到该声明的卷。生成的PersistentVolumeClaims名称由volumeClaimTemplate名称+ pod-name +序号组成。通过使用volumeClaimTemplates，不需要自己创建单独的PVC，因此，目标是让集合中的每个pod都有专用存储，而不使用volumeClaimTemplates，这会导致许多问题，并使管理和扩展它变得更加复杂。
        ``` yaml 
        apiVersion: apps/v1
        kind: StatefulSet
        metadata:
          name: zookeeper
          namespace: luck-infrastructure
        spec:
          selector:
            matchLabels:
              app: zookeeper
          serviceName: zookeeper-hs
          replicas: 3
          updateStrategy:
            type: RollingUpdate
          podManagementPolicy: OrderedReady
          template:
            metadata:
              labels:
                app: zookeeper
            spec:
              affinity:
                podAntiAffinity:
                  requiredDuringSchedulingIgnoredDuringExecution:
                    - labelSelector:
                        matchExpressions:
                          - key: "app"
                            operator: In
                            values:
                            - zookeeper
                      topologyKey: "kubernetes.io/hostname"
              containers:
              - name: kubernetes-zookeeper
                imagePullPolicy: Always
                image: "registry.k8s.io/kubernetes-zookeeper:1.0-3.4.10"
                resources:
                  requests:
                    memory: "1Gi"
                    cpu: "0.5"
                ports:
                - containerPort: 2181
                  name: client
                - containerPort: 2888
                  name: server
                - containerPort: 3888
                  name: leader-election
                command:
                - sh
                - -c
                - "start-zookeeper \
                  --servers=3 \
                  --data_dir=/var/lib/zookeeper/data \
                  --data_log_dir=/var/lib/zookeeper/data/log \
                  --conf_dir=/opt/zookeeper/conf \
                  --client_port=2181 \
                  --election_port=3888 \
                  --server_port=2888 \
                  --tick_time=2000 \
                  --init_limit=10 \
                  --sync_limit=5 \
                  --heap=512M \
                  --max_client_cnxns=60 \
                  --snap_retain_count=3 \
                  --purge_interval=12 \
                  --max_session_timeout=40000 \
                  --min_session_timeout=4000 \
                  --log_level=INFO"
                readinessProbe:
                  exec:
                    command:
                    - sh
                    - -c
                    - "zookeeper-ready 2181"
                  initialDelaySeconds: 10
                  timeoutSeconds: 5
                livenessProbe:
                  exec:
                    command:
                    - sh
                    - -c
                    - "zookeeper-ready 2181"
                  initialDelaySeconds: 10
                  timeoutSeconds: 5
                volumeMounts:
                - name: zookeeper-volume
                  mountPath: /var/lib/zookeeper
              securityContext:
                runAsUser: 1000
                fsGroup: 1000
          volumeClaimTemplates: 
          - metadata:
              name: zookeeper-volume
            spec:
              accessModes: [ "ReadWriteOnce" ]
              storageClassName: luck-zookeeper-nfs-csi # 换成上面设置Storage Classes的名字
              resources:
                requests:
                  storage: 10Gi
        ```
        执行完yaml之后我们可以在lens中看到zookeeper启动完成，任意进入一个zookeeper的pod，通过/usr/bin/zkServer.sh 查看当前节点状态，如下图
        ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412094034.png)
        也可以通过prettyZoo这个zookeeper的GUI工具来进行连接，这里使用的IP和端口对外访问的Service【zookeeper-cs】。
        ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412100556.png)
      
  + ## 4、ClickHouse配置zookeeper
    + ### 添加Zookeeper集群配置
      ClickHouse配置zookeeper也很简单其实就是在上次的config.xml配置文件中换成你自己的zookeeperIP和端口就可以，将下图的xml注释的配置修改![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412103625.png)
      这是我的配置以后重启ClickHouse集群的服务，
      ```xml
        <zookeeper>
          <node>
              <host>192.168.31.11</host>
              <port>30110</port>
          </node>
          <node>
              <host>192.168.31.12</host>
              <port>30110</port>
          </node>
          <node>
              <host>192.168.31.13</host>
              <port>30110</port>
          </node>
        </zookeeper>
      ```
      添加完成上面的配置以后重启ClickHouse集群
      ``` shell
        # 重新启动服务端
        sudo systemctl restart  clickhouse-server
        # 查看状态
        sudo systemctl status  clickhouse-server 
      ```
      集群重启完成之后我们可以在Zookeeper的Gui工具内看到ClickHouse的配置已经写入了进来，如下图：
      ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412112247.png)      
      + 
  + ## ClickHouse在集群内创建数据库和集群表
    在创建集群数据库时遇到一个问题，这个问题是在上一篇文章导致的，当时我们在配置集群时一个shard的replica标签配置了两个相同IP端口的名称，这时候如果你创建集群表就会报错【There are two exactly the same ClickHouse instances 192.168.31.21:9000 in cluster luck_click_house_cluster】，所以在这里我修改了以下集群的配置，在一个shard下面只配置一个replica，因为replica如果配置多个的话，我还没有搞清楚怎么配置，所以这个地方先暂时留下一个坑，后续研究一下在做处理
      + ### 在集群内创建分布式数据库
        其实也就是在集群中建库，让所有节点都同步创建，以下是我创建数据库的语句。
        ```sql
          -- 
          create database luck_asa on cluster luck_click_house_cluster --替换成你的集群名称
        ```
      + ### 在集群内创建普通数据表
        这一步其实并不是分布式的表，只是在这个集群内的数据库下，创建了相同的表，所以想当不同机器上的数据表结构都是一样的，分布式表的创建语句和当前语句还是有所区别的，因为他需要使用Distributed关键字还需要设置分片等等。
        ```sql
          CREATE TABLE luck_asa.test_local on cluster luck_click_house_cluster
          (
          `Type` String COMMENT '数据类型',
          `Subtype` String COMMENT '子类',
          `Successflag` String COMMENT '0-失败；2-成功',
          `Client` String COMMENT 'andriod/IOS',
          `Version` String COMMENT '版本信息',
          )
          ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-{shard}/test_local', '{replica}')
          PARTITION BY Subtype
          ORDER BY (Type, Subtype, Successflag)
        ```
      + ### 创建分布式表
        **分布式表说明：**
        分布式表在写入的时候，是谁写入谁负责将分片发送给其他分片服务器，此实操设计中，当数据插入进某台服务器上时，该服务器负责将数据分发到其他分片服务器，如下图：
        ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412145452.png)
        通过上图我们了解到，ClickHouse 分布式表和本地表的写入性能问题，一般而言，分布式表的写入性能比本地表要慢，但是由于分布式表的数据分散在多个节点上，因此可以更好地支持大规模数据存储和查询。如果需要关注写入性能，可以考虑使用ClickHouse的本地表。如果直接insert into分布式表会造成某台节点的压力过大的问题，故官方建议直接写入到本地表中，分摊压力。分布式表只做数据查询
        ```sql 
          CREATE TABLE luck_asa.test_distributed on cluster luck_click_house_cluster
          (
          `Type` String COMMENT '数据类型',
          `Subtype` String COMMENT '子类',
          `Successflag` String COMMENT '0-失败；2-成功',
          `Client` String COMMENT 'andriod/IOS',
          `Version` String COMMENT '版本信息',
          )
          ENGINE = Distributed(luck_click_house_cluster,luck_asa_test,order_local,rand())
        ```
      + ### 删除集群内的数据集和分布式表
        ```sql
          --  删除集群数据库与其他单机版数据库没啥区别只是添加了一个on cluster 你的集群名称，删除表也同理
          drop DATABASE  luck_asa_test on cluster 你的集群名称
          -- 删除集群内的所有表
          drop table  luck_asa_test.你的表明 on cluster 你的集群名称
        ```
      + 
  + 