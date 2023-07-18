要在 Kubernetes 上部署 Kafka 集群并使用 bitnami/kafka:3.5.0 镜像，同时使用 PVC（Persistent Volume Claim）和 StorageClass 进行持久化存储，请参照以下步骤：

首先，创建一个名为storage-class.yaml的文件。在这个文件中，我们将定义一个名为kafka-storage的 StorageClass，它可以与云提供商或其他存储解决方案集成：
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: kafka-storage
provisioner: kubernetes.io/aws-ebs # 替换为你的存储提供器 如: kubernetes.io/gce-pd 或 kubernetes.io/aws-ebs 等
parameters:
  type: gp2 
reclaimPolicy: Retain
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-kafka-claim
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: kafka-storage
  resources:
    requests:
      storage: 8Gi
更改provisioner字段以使用您的存储提供器。将type参数字段更改为适应您的存储类型。

在本例中，创建了一个名为kafka-storage的 StorageClass 和名为data-kafka-claim的 PersistentVolumeClaim。

使用kubectl apply创建 StorageClass 和 PersistentVolumeClaim：
kubectl apply -f storage-class.yaml
创建一个名为kafka-with-storage-class.yaml的文件，然后将以下内容复制到其中：
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  selector:
    matchLabels:
      app: kafka
  serviceName: kafka-headless
  replicas: 3
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
      - name: kafka
        image: bitnami/kafka:3.5.0
        env:
        - name: KAFKA_CFG_ZOOKEEPER_CONNECT
          value: "zookeeper:2181"
        - name: ALLOW_PLAINTEXT_LISTENER
          value: "yes"
        - name: KAFKA_CFG_LISTENERS
          value: "PLAINTEXT://:9092"
        - name: KAFKA_CFG_ADVERTISED_LISTENERS
          value: "PLAINTEXT://"
        ports:
        - containerPort: 9092
          name: kafka
        volumeMounts:
        - name: data
          mountPath: /bitnami/kafka/data
  volumeClaimTemplates:
    - metadata:
        name: data
    spec:
      accessModes:
        - ReadWriteOnce
      storageClassName: kafka-storage
      resources:
        requests:
          storage: 8Gi
  updateStrategy:
    type: RollingUpdate
---
apiVersion: v1
kind: Service
metadata:
  name: kafka-headless
spec:
  clusterIP: None
  selector:
    app: kafka
  ports:
    - port: 9092
      targetPort: 9092
      name: kafka
---
apiVersion: v1
kind: Service
metadata:
  name: zookeeper
spec:
  selector:
    app: zookeeper
  ports:
    - port: 2181
      targetPort: 2181
      name: zookeeper
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zookeeper
spec:
  selector:
    matchLabels:
      app: zookeeper
  replicas: 1
  template:
    metadata:
      labels:
        app: zookeeper
    spec:
      containers:
      - name: zookeeper
        image: bitnami/zookeeper:latest
        env:
        - name: ALLOW_ANONYMOUS_LOGIN
          value: "yes"
        ports:
        - containerPort: 2181
          name: zookeeper
  strategy:
    type: RollingUpdate
这个kafka-with-storage-class.yaml文件包含：

一个 Kafka StatefulSet，部署 3 个 Kafka 副本，配置为使用 bitnami/kafka:3.5.0 镜像
一个 Kafka 副本的 VolumeMounts，用于挂载 PVC 中的存储
一个使用kafka-storage StorageClassName 创建的 PVC 的volumeClaimTemplates
一个 headless 服务，以便 Kafka 副本能找到彼此
一个 Zookeeper 服务，配置为使用 bitnami/zookeeper 镜像
一个用于 Kafka 访问的 Zookeeper 部署
使用kubectl apply部署 Kafka 集群：
kubectl apply -f kafka-with-storage-class.yaml
检查 Kubernetes 部署的状态：
kubectl get pods
kubectl get services
kubectl get pvc
kubectl get pv
至此，你已经在 Kubernetes 上部署了一个使用 bitnami/kafka:3.5.0 镜像、PVC 和 StorageClass 的 Kafka 集群。现在，Kafka 将数据存储在由 StorageClass 管理的持久化存储中，允许在不丢失数据的情况下更新和扩展集群。同样，请注意，这是一个最小功能的集群配置，实际生产环境可能会涉及到额外的配置参数、资源限制、持久卷、安全性设置等等。

要更好地适应实际生产环境，建议参考官方 Kafka Docker 仓库和 Kubernetes 部署文档。