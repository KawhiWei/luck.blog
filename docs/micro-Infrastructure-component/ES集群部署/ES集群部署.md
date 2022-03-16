---
title: Ubuntu20.04配置 ES7.17.0集群
date: 2022-02-28 20:14:25
permalink: /pages/3275ed/
categories:
  - micro-Infrastructure-component
  - Ubuntu20.04配置 ES7.17.0集群
tags:
  - 
---
# Ubuntu20.04配置 ES7.17.0集群
## ES能做什么？
elasticsearch简写es，es是一个高扩展、开源的全文检索和分析引擎，它可以准实时地快速存储、搜索、分析海量的数据。
[Ubuntu部署ES官网教程](https://www.elastic.co/guide/en/elasticsearch/reference/8.0/deb.html)
## 什么是全文检索
全文检索是指计算机索引程序通过扫描文章中的每一个词，对每一个词建立一个索引，指明该词在文章中出现的次数和位置，当用户查询时，检索程序就根据事先建立的索引进行查找，并将查找的结果反馈给用户的检索方式。这个过程类似于通过字典中的检索字表查字的过程。全文搜索搜索引擎数据库中的数据。
## es的应用场景
- 一个线上商城系统，用户需要搜索商城上的商品。
在这里你可以用es存储所有的商品信息和库存信息，用户只需要输入”空调”就可以搜索到他需要搜索到的商品。
- 一个运行的系统需要收集日志，用这些日志来分析、挖掘从而获取系统业务未来的趋势。
你可以用logstash、filebeat等收集、转换你的日志，并将他们存储到es中。一旦数据到达es中，就你可以在里面搜索、运行聚合函数等操作来挖掘任何你感兴趣的信息。
- 如果你有想基于大量数据（数百万甚至数十亿的数据）快速调查、分析并且要将分析结果可视化的需求。
你可以用es来存储你的数据，用kibana构建自定义的可视化图形、报表，为业务决策提供科学的数据依据。

- **直白点讲，es是一个企业级海量数据的搜索引擎，可以理解为是一个企业级的百度搜索，除了搜索之外，es还可以快速的实现聚合运算。**
## 更新系统和更新软件包索引
``` shell
# 全量更新软件
sudo apt full-upgrade -y
# 清理更新完成不需要依赖的旧引用
sudo apt autoremove & sudo apt autoclean
# 更新软件包索引并安装通过HTTPS访问存储库所需的apt-transport-https软件包
sudo apt install apt-transport-https
```
## ES部署的一些问题
ES不能使用root账号来装，而且个人也建议所有这种软件不要使用root来安装。
在三台Ubuntu服务器中安装 jdk 和 ES
## 安装ES的前置 
- **安装openjdk-17-jdk**
  ``` shell
  # 在esnode1和esnode2上安装jdk
  sudo apt install openjdk-17-jdk
  # Java安装好之后查看Java版本
  java -version
  ```

## 安装ES
- ### 使用以下 wget 命令导入存储库的GPG
  ``` shell
  wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
  # 上面的命令应该输出OK，这意味着密钥已成功导入，并且来自此存储库的软件包将被视为受信任的。
  ```
  - **发出以下命令将Elasticsearch存储库添加到系统中**
  ``` shell
  # 写入软件源到本地地址
  echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-7.x.list
  # 更新软件源
  sudo apt update
  ```
- ### 执行安装ES命令
  ``` shell
  # 更新并安装ES
  sudo apt-get update && sudo apt-get install elasticsearch

  # 启动ES
  sudo systemctl start elasticsearch

  # 设置开机自启
  sudo systemctl daemon-reload  && sudo systemctl enable elasticsearch
  ```
- ### 修改ES的yml配置文件
  - **node1**
  
    我部署的ES是三台机器yml都是共用的，除了修改【node.name】其他不变，所以其他两个节点的yml就不贴了。而且我的ES机器暂时没有开启账号密码，因为对证书那块还不太了解，所以后续研究一下在看看，【后补】
      ``` shell
      # ======================== Elasticsearch Configuration =========================
      # 官方文档
      # https://www.elastic.co/guide/en/elasticsearch/reference/index.html
      #
      # ---------------------------------- Cluster -----------------------------------
      #
      # Use a descriptive name for your cluster:
      # 集群名称
      cluster.name: sukt-platform
      #
      # ------------------------------------ Node ------------------------------------
      #
      # Use a descriptive name for the node:
      # 节点名称
      node.name: node-1
      # 是否可以做master节点
      node.master: true
      # 是否是数据节点
      node.data: true
      #
      # Add custom attributes to the node:
      #
      #node.attr.rack: r1
      #
      # ----------------------------------- Paths ------------------------------------
      #
      # Path to directory where to store the data (separate multiple locations by comma):
      #
      path.data: /home/elasticsearch/data
      #
      # Path to log files:
      #
      path.logs: /home/elasticsearch/logs
      #
      # ----------------------------------- Memory -----------------------------------
      # 确保将堆大小设置为可用内存的一半左右在系统上，并且允许进程的所有者使用极限。
      bootstrap.memory_lock: false
      #
      # Make sure that the heap size is set to about half the memory available
      # on the system and that the owner of the process is allowed to use this
      # limit.
      #
      # Elasticsearch performs poorly when the system is swapping the memory.
      #
      # ---------------------------------- Network -----------------------------------
      #
      # By default Elasticsearch is only accessible on localhost. Set a different
      # address here to expose this node on the network:
      # 主机地址
      network.host: 0.0.0.0
      # 端口
      http.port: 9200
      #
      # For more information, consult the network module documentation.
      #
      # --------------------------------- Discovery ----------------------------------
      #
      # Pass an initial list of hosts to perform discovery when this node is started:
      # The default list of hosts is ["127.0.0.1", "[::1]"]
      # 组件集群时比较重要的配置，用于启动当前节点时，发现其他节点的初始列表，有多少个节点配置多少个地址
      discovery.seed_hosts: ["192.168.31.120:9300", "192.168.31.121:9300", "192.168.31.122:9300"]

      # Elasticsearch节点间通信基础--Transport 
      # https://www.jianshu.com/p/073b9b394c40
      transport.port: 9300
      # 集群列表
      cluster.initial_master_nodes: ["node-1", "node-2", "node-3"]
      # ---------------------------------- Various -----------------------------------
      #
      # Require explicit names when deleting indices:
      #
      #action.destructive_requires_name: true
      #
      # ---------------------------------- Security ----------------------------------
      #
      #                                 *** WARNING ***
      #
      # Elasticsearch security features are not enabled by default.
      # These features are free, but require configuration changes to enable them.
      # This means that users don’t have to provide credentials and can get full access
      # to the cluster. Network connections are also not encrypted.
      #
      # To protect your data, we strongly encourage you to enable the Elasticsearch security features. 
      # Refer to the following documentation for instructions.
      #
      # https://www.elastic.co/guide/en/elasticsearch/reference/7.16/configuring-stack-security.html

      ```

## 结语 
在部署ES的时候本想使用ES8.0的但是因为8.0的证书一直找不到，所以暂时先都未开启账号密码验证，我在部署的时候遇到的最大的问题就是证书问题，如果有大佬部署过，求指点一下。下篇将怎么使用filebeat收集K8s中的日志。

[ES配置文件详解](https://www.cnblogs.com/sunxucool/p/3799190.html)

[自定义index.template](https://iminto.github.io/post/filebeat%E4%BF%AE%E6%94%B9index%E7%9A%84%E4%B8%80%E4%B8%AA%E5%9D%91/)




