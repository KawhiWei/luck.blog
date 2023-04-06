[CQ:reply,id=1952884617] 好的，以下是基本的步骤和注意事项：

1. 创建一个 NFS 存储类（StorageClass）

在 Kubernetes 中，我们可以通过 StorageClass 进行动态存储卷的管理和分配，而 NFS 是典型的动态存储之一。在创建 StorageClass 之前，确保已经有一个 NFS 服务器可用。

参照下面的 YAML 配置文件创建存储类：

```
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: nfs-storage
provisioner: kubernetes.io/nfs
parameters:
  archiveOnDelete: "false"
  nfs.server: 192.168.0.1 # Replace with your server IP
  nfs.path: /mnt/nfs # Replace with your NFS mount path
```

其中，provisioner 指定了使用 kubernetes.io/nfs 这个插件进行存储卷的分配，并通过 parameters 参数指定了 NFS 服务器的 IP 和挂载的路径。

2. 创建一个 PVC

在创建 PVC 时，需要使用上一步中创建的 StorageClass，并指定要申请的存储大小和访问模式（ReadWriteOnce、ReadWriteMany 或者 ReadOnlyMany）。例如：

```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: zookeeper-pv-claim
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Gi
  storageClassName: nfs-storage
```

这里创建了一个名为 zookeeper-pv-claim 的 PVC，访问模式为 ReadWriteMany，存储空间大小为 1Gi，并且使用上一步中创建的 nfs-storage 存储类。

3. 部署 Zookeeper

在部署 Zookeeper 时，需要指定使用上一步中创建的 PVC，以便数据可以持久化存储。以下是一个 Zookeeper 的部署示例 YAML：

```
apiVersion: v1
kind: Service
metadata:
  name: zookeeper
  labels:
    app: zookeeper
spec:
  ports:
    - name: client
      port: 2181
      protocol: TCP
    - name: quorum
      port: 2888
      protocol: TCP
    - name: leader-election
      port: 3888
      protocol: TCP
  selector:
    app: zookeeper
  type: ClusterIP
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: zookeeper
spec:
  serviceName: zookeeper
  replicas: 3
  selector:
    matchLabels:
      app: zookeeper
  template:
    metadata:
      labels:
        app: zookeeper
    spec:
      containers:
        - name: zookeeper
          image: zookeeper:3.6.2
          ports:
            - name: client
              containerPort: 2181
            - name: quorum
              containerPort: 2888
            - name: leader-election
              containerPort: 3888
          volumeMounts:
            - name: zookeeper-data
              mountPath: /data
      volumes:
        - name: zookeeper-data
          persistentVolumeClaim:
            claimName: zookeeper-pv-claim
  volumeClaimTemplates:
    - metadata:
        name: zookeeper-data
      spec:
        accessModes: ["ReadWriteMany"]
        resources:
          requests:
            storage: 1Gi
        storageClassName: nfs-storage
```

在这个示例中，我们使用了 StatefulSet 部署了 Zookeeper，同时在 volumeClaimTemplates 中定义了使用的 PVC。

4. 验证部署是否成功

可以使用以下命令验证 Zookeeper 是否成功部署，并且数据是否持久化存储：

```
kubectl exec -it zookeeper-0 -- zkCli.sh create /test test
kubectl delete pod zookeeper-0 # 删除 pod，重新调度到其他节点
kubectl exec -it zookeeper-1 -- zkCli.sh get /test
```

这里首先通过 kubectl exec 命令进入一个 Zookeeper 的 pod 中，创建一个 /test 节点，并写入 test 数据，然后删除当前的 pod，让其重新调度到另一个节点上，在新的节点上通过 kubectl exec 进入 pod 中，验证 /test 节点是否存在。

注意事项：
- 持久化存储需要使用 PV 和 PVC，确保 NFS 服务器和 PVC 具有足够的容量。
- 访问模式需根据实际情况选择。
- 不同版本的 Zookeeper 对存储卷的要求不一样，需要根据实际情况进行调整。