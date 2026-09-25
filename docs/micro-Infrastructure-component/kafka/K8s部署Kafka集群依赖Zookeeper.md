对于Kafka 2.8.0及更高版本，可以免除ZooKeeper，但是，请注意，Kafka 3.5.0目前并不存在。我们可以继续使用像KRaft模式（KRaft是Kafka的ZooKeeper-less）模式进行部署。

在安全性方面，我们可以启用SSL/TLS和SASL。首先，我们需要创建SSL/TLS所需的证书和私钥。然后，创建Kubernetes密钥并将证书和私钥存储在其中。再然后，我们需要配置Kafka brokers来使用这些证书和私钥。

下面是一个示例，如何部署一个无需ZooKeeper的、启用SSL/TLS的Kafka集群：

假设你已经创建了TLS证书文件ca.crt以及broker的keystore.jks和truststore.jks。接下来，将它们存入Kubernetes的secret中。
kubectl create secret tls kafka-tls --cert=ca.crt --key=ca.key
kubectl create secret generic kafka-certs --from-file=broker.keystore.jks --from-file=broker.truststore.jks
创建Kafka集群用的Headless Service和StatefulSet：
apiVersion: v1
kind: Service
metadata:
  name: kafka-service
spec:
  clusterIP: None
  ports:
    - name: client
      port: 9092
      protocol: TCP
  selector:
    application: kafka

---

apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  replicas: 3
  serviceName: kafka-service
  selector:
    matchLabels:
      application: kafka
  template:
    metadata:
      labels:
        application: kafka
    spec:
      containers:
        - name: kafka-broker
          image: confluentinc/cp-kafka:6.2.0
          env:
            - name: KAFKA_KRAFT_BROKER_ID
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: KAFKA_KRAFT_MODE
              value: "true"
            - name: KAFKA_LOG_DIRS
              value: "/var/lib/kafka/data"
            - name: KAFKA_AUTO_CREATE_TOPICS_ENABLE
              value: "false"
            - name: KAFKA_LISTENER_SECURITY_PROTOCOL_MAP
              value: "SSL://:9092,INTERNAL_SSL://:9093"
            - name: KAFKA_SSL_KEYSTORE_LOCATION
              value: "/etc/kafka/secrets/broker.keystore.jks"
            - name: KAFKA_SSL_KEYSTORE_PASSWORD
              value: "your-keystore-password"
            - name: KAFKA_SSL_TRUSTSTORE_LOCATION
              value: "/etc/kafka/secrets/broker.truststore.jks"
            - name: KAFKA_SSL_TRUSTSTORE_PASSWORD
              value: "your-truststore-password"
          ports:
            - containerPort: 9092
              name: client
            - containerPort: 9093
              name: replication
          volumeMounts:
            - name: data
              mountPath: /var/lib/kafka
            - name: kafka-tls
              mountPath: /etc/kafka/certs
              readOnly: true
            - name: kafka-certs
              mountPath: /etc/kafka/secrets
              readOnly: true
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
注意，在这个配置中SSL监听器被启用，所有的broker之间的通信将用SSL进行，我们还将SSL证书存储在一个Kubernetes Secret中，并通过volumeMounts挂载到Pod中。请确保你的keystore和truststore中的key和证书已经被正确的生成，并且密码也改为你的实际密码。对于Kubernetes所需的StorageClass，需要根据你的Kubernetes环境来进行对应的配置。