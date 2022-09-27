##  Ubuntu 20.04 安装ClickHouse作为日志平台数据库
ClickHouse能做什么？它的优势是什么？为什么选择它？



  + ### 安装ClickHouse
    官网安装clickhouse命令：https://clickhouse.com/docs/zh/getting-started/install
    ``` shell
    sudo apt-get install -y apt-transport-https ca-certificates dirmngr
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 8919F6BD2B48D754

    echo "deb https://packages.clickhouse.com/deb stable main" | sudo tee \
    /etc/apt/sources.list.d/clickhouse.list
    sudo apt-get update

    sudo apt-get install -y clickhouse-server clickhouse-client

    sudo service clickhouse-server start
    clickhouse-client # or "clickhouse-client --password" if you've set up a password.
    ```
  + ### 修改默认数据存储目录
    ```
    sudo chown clickhouse:clickhouse -R 你的目录  
    ```    
  + ### 使用dbeaver链接clickhouse
    ``` shell
    # 启动clickhouse
    sudo systemctl start clickhouse-server
    
    # 检查clickhouse-server的状态：
    systemctl status clickhouse-server

    ```
    + #### 修改clickhouse配置文件可以使用远程连接
      红框内的那段代码默认是被注释掉的，将其取消注释。
      ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20220730153942.png)
      ``` shell
      # 重启clickhouse
      sudo systemctl restart clickhouse-server
      ```
  + ### 创建自己的用户
    ``` shell
    clickhouse-client --password
    create user kawhi identified with sha256_password by 'abcdefg' host any;


    GRANT ALL ON *.* TO kawhi WITH GRANT OPTION;


    show grants for kawhi
    ```
  + 