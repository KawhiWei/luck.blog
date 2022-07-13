# RocketMQ的架构设计和实现
## RocketMQ的架构和组成
RocketMQ由以下部分组成，分别是Broker、NameServer、消息生产者和消费者集群，Broker作为队列服务器存在，NameServer作为轻量级的服务注册、发现存在，消息生产者集群和消费者集群并不是和其他MQ一样直接连接MQ集群，RocketMQ的消费者和生产者是通过NameServer来进行获取Broker信息，并进行消息发送和消费。
![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20220710211854.png)
 + ### 