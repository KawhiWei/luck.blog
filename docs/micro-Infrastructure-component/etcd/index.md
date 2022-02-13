---
title: Ubuntu 安装etcd
date: 2022-02-10 21:46:44
permalink: /pages/d588a7/
categories:
  - micro-Infrastructure-component
  - etcd
tags:
  - 
---
[apisix](../apisix/)
+ Ubuntu 安装etcd 
  ``` shell
  zip安装： http://blog.wafcloud.cn/application/etcd-install.html
  #将三个二进制文件拷贝到 目录下
  /usr/local/bin

  #新建一个etcd.service
  [Unit]
  Description=ETCD Server
  Documentation=https://github.com/coreos/etcd
  After=network-online.target
  Wants=network-online.target

  [Service]
  User=root
  Group=root
  ExecStart= etcd --config-file /home/etcd/etcd.conf.yml

  [Install]
  WantedBy=multi-user.target

  sudo systemctl enable etcd.service
  sudo systemctl start etcd.service

  # 设置版本为V3
  export ETCDCTL_API=3

  # 添加用户
  etcdctl user add root
  # 开启认证
  etcdctl auth enable

  # 查看角色列表
  etcdctl --endpoints http://127.0.0.1:2379 role list

  #带有用户名密码的链接
  etcdctl --endpoints http://127.0.0.1:2379 --user=root:P@ssW0rd user get root

  ```