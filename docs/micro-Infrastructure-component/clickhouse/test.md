[CQ:reply,id=1011545431] 这是一个基于Helm chart的Kubernetes部署Zookeeper并使用pv、pvc持久化的示例。

1. 安装Helm

首先需要安装Helm，可以在[官网](https://helm.sh/docs/intro/install/)上找到相关安装指南。

2. 添加Helm chart仓库

```
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm repo update
```

3. 创建pv、pvc

创建`my-zk-0`和`my-zk-1`两个pv和pvc，用于持久化Zookeeper数据。

pv.yaml

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-zk-0
spec:
  storageClassName: manual
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /data/zookeeper-0
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-zk-1
spec:
  storageClassName: manual
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /data/zookeeper-1
```

pvc.yaml

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-zk-0-claim
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-zk-1-claim
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

创建pv和pvc：

```
kubectl apply -f pv.yaml
kubectl apply -f pvc.yaml
```

4. 部署Zookeeper

使用Helm chart部署Zookeeper：

```
helm install my-zk stable/zookeeper \
  --set persistence.enabled=true \
  --set persistence.existingClaim=my-zk-0-claim,my-zk-1-claim \
  --set replicaCount=2
```

这里使用了`--set`参数来设置一些Zookeeper的配置，包括：

- `persistence.enabled=true`：启用持久化存储。
- `persistence.existingClaim=my-zk-0-claim,my-zk-1-claim`：使用之前创建的pv和pvc。
- `replicaCount=2`：使用两个Zookeeper节点。

5. 验证Zookeeper部署

验证Zookeeper是否成功部署：

```
kubectl exec my-zk-0 zkCli.sh create /test test
kubectl exec my-zk-1 zkCli.sh get /test
```

如果输出`test`，则说明Zookeeper已经成功部署。

参考文档：[kubernetes-zookeeper](https://github.com/helm/charts/tree/master/stable/zookeeper)