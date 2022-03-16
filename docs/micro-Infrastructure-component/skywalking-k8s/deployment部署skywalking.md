---
title: 在K8S中使用Deployment的方式部署Skywalking对接Apisix网关和.Net6
date: 2022-02-16 21:50:41
permalink: /pages/e6f3a1/
categories:
  - micro-Infrastructure-component
  - skywalking-k8s
tags:
  - 
---

# 在K8S中使用Deployment的方式部署Skywalking对接Apisix网关和.Net6

  ## Skywalking简介
  >Skywalking是一个分布式系统的应用程序性能监视工具，专为微服务、云原生架构和基于容器（Docker、K8s、Mesos）架构而设计。SkyWalking 是观察性分析平台和应用性能管理系统。提供分布式追踪、服务网格遥测分析、度量聚合和可视化一体化解决方案。支持Java, .Net Core, PHP, NodeJS, Golang, LUA语言探针，支持Envoy + Istio构建的Service Mesh。Skywalking分为两个镜像，分别是UI和Service服务端，所以我们在部署的时候需要部署两个Deployment。Skywalking的数据持久化也分很多种，我再使用Skywalking的时候是使用的ES存储的，所以下面部署Skywalking的yaml脚本也是使用ES的方式。
  - ## skywalking四个模块
    - ### skywalking agent和业务系统绑定在一起，负责收集各种监控数据
    - skywalking oapservice是负责处理监控数据的，比如接受skywalking agent的监控数据，并存储在数据库中（本案例使用elasticsearch）;接受skywalking webapp的前端请求，从数据库查询数据，并返回数据给前端。Skywalking oapservice通常以集群的形式存在。
    - skywalking webapp，前端界面，用于展示数据。
    - 用于存储监控数据的持久化，Skywwalking分为MySql、ElasticSearch等。
  ## K8S Deployment部署Skywalking
  我在部署Skywalking的时候使用的是ES的持久化方式，使用的Skywalking版本是8.9.1，我使用的是自己编写yaml的方式，如果你不想使用这种方式也可以使用helm的方式（[skywalking-kubernetes](https://github.com/apache/skywalking-kubernetes)），所以在部署的时候遇到过以下问题。
    
  - 不能手动删除ES内包含的Skywalking索引，因为Skywalking在启动的时候会去检查索引，一旦删除了就会引发索引找不到，这个时候需要改一下你在Deployment中配置的索引名字。
  + **部署Skywalking服务端yaml脚本**
    ``` shell
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: skywalking-service
      namespace: sukt-platform
    spec:
      selector:
        matchLabels:
          app: skywalking-service
      template:
        metadata:
          labels:
            app: skywalking-service
        spec:
          nodeName: microk8sslave1 # 部署到指定的node节点
          containers:
          - name: skywalking-service
            image: apache/skywalking-oap-server:8.9.1
            resources:
              limits:
                memory: "4Gi"
                cpu: "500m"
            ports:
            - containerPort: 11800
              name: grpc
            - containerPort: 12800
              name: restful
            env:
              - name: JAVA_OPTS
                value: "-Xmx2g -Xms2g"
              - name: SW_CLUSTER
                value: standalone #单节点部署如果是k8s集群的话换成(kubernetes),我这里使用单节点的方式
              - name: SW_STORAGE #存储方式
                value: elasticsearch
              - name: SW_STORAGE_ES_CLUSTER_NODES # ES集群地址
                value: 192.168.31.175:9200
              - name: SW_NAMESPACE #Skywalking索引的名称
                value: skywalking_dev # 如果索引删除了，deployment的索引名字也要改，不然会直接启动不起来
              - name: SW_ES_USER # ES用户
                value: elastic
              - name: SW_ES_PASSWORD # 密码
                value: P@ssW0rd
              - name: TZ
                value: Asia/Shanghai

    ---
    apiVersion: v1
    kind: Service
    metadata:
      name: skywalking-service
      namespace: sukt-platform
    spec:
      type: NodePort
      selector:
        app: skywalking-service
      ports:
      - port: 11800
        name: grpc
        targetPort: 11800
        nodePort: 30102
      - port: 12800
        name: restful
        targetPort: 12800
        nodePort: 30101

    ```












  + **部署SkywalkingUI yaml脚本**
    ``` shell
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: skywalking-ui
      namespace: sukt-platform
    spec:
      selector:
        matchLabels:
          app: skywalking-ui
      template:
        metadata:
          labels:
            app: skywalking-ui
        spec:
          nodeName: microk8sslave1 # 部署到指定的node节点
          containers:
          - name: skywalking-ui
            image: apache/skywalking-ui:8.9.1
            resources:
              limits:
                memory: "2Gi"
                cpu: "500m"
            ports:
            - containerPort: 8080
              name: page
            env:
              - name: SW_OAP_ADDRESS #Skywalking服务端的地址，我这里是直接写了Skywalking服务的Service地址端口是resetful的
                value: http://skywalking-service:12800
              - name: TZ
                value: Asia/Shanghai
    ---
    apiVersion: v1
    kind: Service
    metadata:
      name: skywalking-ui
      namespace: sukt-platform
    spec:
      type: NodePort
      selector:
        app: skywalking-ui
      ports:
      - port: 8080
        name: page
        targetPort: 8080
        nodePort: 30103

    ```
进入容器查看env：env | grep ASPNETCORE_