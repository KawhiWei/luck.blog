+ # ClickHouse创建分布式数据库和表
在上一篇文章讲了如何配置CLickHouse集群，但是遇到了一些问题，在创建分布式分布式数据库和表时需要使用Zookeeper所以就先结束了，本篇文章我们将讲解如何在K8S中运行Zookeeper集群和使用nfs网络存储进行持久化，然后再使用ClickHouse连接到Zookeeper集群创建分布式数据库和表。
  + ## 1、安装nfs服务器
    安装完成后,NFS 服务将自动启动
    
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

    + 在这里,除了 no_root_squash 之外,对两个目录使用相同的配置选项.看看每个选项的含义:
    + 完成更改后,保存并关闭文件. 然后,要使您配置的客户端可以使用共享,请使用以下命令重新启动 NFS 服务器:
      ``` shell
      sudo systemctl restart nfs-kernel-server
      ```
    + 由于 NFS 会将 客户端 上的任何 root 操作转换为 nobody:nogroup 凭据作为安全措施.因此,需要更改目录所有权以匹配这些凭据.
      ``` shell
      sudo chown nobody:nogroup /data/nfs
      sudo chown nobody:nogroup /data
      ```
    + 同时为了保险起见,我们直接给/data 目录及其子目录搞一个读写权限(偷懒直接开个 777)
      ```shell
      sudo chmod 777 -R /data
      ```
    + 最后我们再开启防火墙的放行.若是没开启防火墙就无需关注了
      ```shell
      # 开启防火墙
      sudo ufw allow from '192.168.2.0/24' to any port nfs
      # 最后为了保险我们再重启一下服务.
      sudo systemctl restart nfs-kernel-server
      # 开启开机自启.
      sudo systemctl enable nfs-kernel-server
      ```
  + ## 2、创建Zookeeper所需要的文件夹，
    因为我的Zookeeper不仅仅是CliCkHouse使用，后面还要安装kafka集群；所以我将文件夹进行了拆分，在/data/nfs/zookeeper的文件夹内创建了clickhouse专用的文件夹分别是node1、node2、node3因为我的Zookeeper集群准备使用一拖二的策略，所以创建了三个文件夹。一拖二就是一个主节点外带两个flower节点。
    ``` shell
    # 执行创建文件夹命令加入-p是因为如果其中一个文件夹不存在那么它会自动创建文件夹
    sudo mkdir -p  /data/nfs/zookeeper/clickhouse/node1
    sudo mkdir -p  /data/nfs/zookeeper/clickhouse/node2
    sudo mkdir -p  /data/nfs/zookeeper/clickhouse/node3
    ```
  + ## 在K8S中创建PV和PVC连接到nfs服务器
    + 创建zookeeper-node1的pv-yaml文件
    ``` yaml

    ```
