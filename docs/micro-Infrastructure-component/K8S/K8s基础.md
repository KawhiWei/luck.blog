# K8s的起源
  + Kubernetes 个软件系统，它允许你在其上很容易地部署 管理容器化的应用。它依赖于 Linux 容器 的特性来运行异 应用， 无须知道这些应用的内部详情也不需要手动将这些应用部署到每台机器。
  + 为了解决大集群(Cluster)中容器部署、伸缩和管理的各种问题，出现了 Kubernetes、Docker Swarm 等软件，称为 容器编排引擎。
  + Kubernetes 是 Google 基于十多年的生产环境运维经验，开发出的一个生产级别的容器编排系统。在 Kunernetes 文档中，这样描述 Kubernetes："an open-source system for automating deployment, scaling, and management of containerized applications".
  + Google 的基础设施在虚拟机(Virtual machines)技术普及之前就已经达到了很大的规模，高效地使用集群和管理分布式应用成为 Google 挑战的核心，而容器技术提供了一种高效打包集群的解决方案。
  + 多年来，Google 一直使用 Borg 来管理集群中的容器，积累了大量的集群管理经验和运维软件开发能力，Google 参考 Borg ，开发出了 Kubernetes，即 Borg 是 Kubernetes 的前身。（但是 Google 目前还是主要使用 Borg）。
  + Kubernetes 从一开始就通过一组基元(primitives)、强大的和可拓展的 API 应对这些挑战，添加新对象和控制器地能力可以很容易地地址各种各样的产品需求(production needs)。
  + 编排管理是通过一系列的监控循环控制或操作的；每个控制器都向询问对象状态，然后修改它，直至达到条件为止。容器编排是管理容器的最主要的技术。Dockers 也有其官方开发的 swarm 这个编排工具，但是在 2017 年的容器编排大战中，swarm 败于 Kubernetes。
# Kubernetes 集群的组成
  + 在 Kubernets 中，运行应用程序的环境处于虚拟化当中，因此我们一般不谈论硬件。我们谈起 Kubernetes 和应用部署时，往往会涉及到容器、节点、Pods 等概念，它们共同工作来管理容器化(containerized)应用的部署和执行，但是各种各样的术语，令人眼花缭乱。为了更好地摸清 Kubernetes，下面我们将列举这些有边界的对象。
  + ## 基础组件
  
    | 英文描述 | 中文描述 |
    |----|------|
    |Cluster|集群|
    |Node|节点|
    |Pod|未知|




    ### Response

    | 字段名称 | 类型  |
    |----|------|
    |ErrCode|int|
    |ErrMsg|string|
    |Order|OrderInfoDto|

  
    ### OrderInfoDto
    
    | 字段名称 | 类型  | 字段描述 |
    |----|------|------|
    |AirlineType|int| 航段类型 |
    |SerialNo|string| 订单号 |
    |WechatAppScene|string| 微信小程序场景 |
    |ProductIndex|int| 产品索引 |
    |Tags|string[]| 订单标签 |
    |FinanceOrderTags|string[]| 财务标签 |
    |TiedProducts|TiedProductsItem[]|  |
    |ExternalOrderInfos|ExternalOrderInfosClass[]|  |
    |Activities|AcitityInfo[]| 微信小程序场景 |

    ### TiedProductsItem

    | 字段名称 | 类型  |
    |----|------|
    |ProductType|int|
    |ProductSubType|int|
    |BalanceOrderNo|string|


    ### ExternalOrderInfosClass

    | 字段名称 | 类型  |
    |----|------|
    |Type|string|
    |OrderNo|string|

    ### AcitityInfo

    | 字段名称 | 类型  |
    |----|------|
    |orderSerialNo|string|
    |activityId|string|
    |memberId|string|
    |activitySource|string|
    |activityType|string|
    |externalActivityId|string|
    |activityName|string|
    |externalActivityNo|string|
    |purchaseProject|string|
    |purchaseCompany|string|
    |activityPrice|string|
    |createTime|string|