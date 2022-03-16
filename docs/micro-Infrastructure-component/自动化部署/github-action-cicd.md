---
title: github-action-cicd
date: 2022-02-16 21:16:51
permalink: /pages/221116/
categories:
  - micro-Infrastructure-component
  - 自动化部署
tags:
  - 
---
# 两种github action 打包.Net Core 项目docker镜像推送到阿里云镜像仓库
  ## 1、GitHub Actions 是什么？
  大家知道，持续集成由很多操作组成，比如抓取代码、运行测试、登录远程服务器，发布到第三方服务等等。GitHub 把这些操作就称为 actions。
  很多操作在不同项目里面是类似的，完全可以共享。GitHub 注意到了这一点，想出了一个很妙的点子，允许开发者把每个操作写成独立的脚本文件，存放到代码仓库，使得其他开发者可以引用。如果你需要某个 action，不必自己写复杂的脚本，直接引用他人写好的 action 即可，整个持续集成过程，就变成了一个 actions 的组合。这就是 GitHub Actions 最特别的地方。
  ## 2、基本概念
  GitHub Actions 有一些自己的术语。

  （1）workflow （工作流程）：持续集成一次运行的过程，就是一个 workflow。

  （2）job （任务）：一个 workflow 由一个或多个 jobs 构成，含义是一次持续集成的运行，可以完成多个任务。

  （3）step（步骤）：每个 job 由多个 step 构成，一步步完成。

  （4）action （动作）：每个 step 可以依次执行一个或多个命令（action）。
  ## 3、workflow 文件
  GitHub Actions 的配置文件叫做 workflow 文件，存放在代码仓库的.github/workflows目录。workflow 文件采用 YAML 格式，文件名可以任意取，但是后缀名统一为.yml，比如foo.yml。一个库可以有多个 workflow 文件。GitHub 只要发现.github/workflows目录里面有.yml文件，就会自动运行该文件。
  
  ## 4、Github Action打包
  ### 第一种是在github action 中将项目publish完成然后在进行打包
  #### 对应的yml
```
    name: Sukt.Core.API
    on:
    push:
        branches: [dev/main]
    pull_request:
        branches: [dev/main]
    env:
    IMAGE_NAME: registry.cn-hangzhou.aliyuncs.com/suktcore/sukt-core-admin-api #
    IMAGE_TAG: dev
    jobs:
    build:
        runs-on: ubuntu-latest
        steps:
        - uses: actions/checkout@v2
        - name: Setup .NET Core
        uses: actions/setup-dotnet@v1
        with:
            dotnet-version: 5.0.x
        - name: dotnet restore #还原包
        run: dotnet restore src/Sukt.Core.API
        - name: dotnet publish #发布项目
        run: dotnet publish src/Sukt.Core.API --configuration -c Release --no-restore -o app  

        # 拷贝dockerfile
        - name: Run Crrpath
        run: ls 
        - name: Copy Dockerfile  # 拷贝Dockerfile到发布目录 ##生成随机数 echo "$RANDOM"|md5sum|cut -c 5-15
        run: cp Dockerfile /home/runner/work/Sukt.Core/Sukt.Core/app
        - name: Login To Docker #登录到镜像仓库
        uses: docker/login-action@v1
        with:
            username: ${{ secrets.ALIYUN_DOCKER_IMAGESTORE_USERNAME }} 
            password: ${{ secrets.ALIYUN_DOCKER_IMAGESTORE_PASSWORD }}
            registry: registry.cn-hangzhou.aliyuncs.com/suktcore/sukt-core-admin-api #镜像仓库地址
        - name: Build Docker Image # Build Docker镜像并推送到镜像仓库
        uses: docker/build-push-action@v2
        with:
            tags: ${{env.IMAGE_NAME}}:${{env.IMAGE_TAG}}.${{ github.run_id }}.${{ github.run_number }} #动态变量镜像TAG 使用github运行job和jobid设置tag
            context: /home/runner/work/Sukt.Core/Sukt.Core/app
            file: /home/runner/work/Sukt.Core/Sukt.Core/app/Dockerfile # 指定Dockerfile
            push: true
```

#### 对应的Dockerfile
```
FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS base
WORKDIR /app
ENV TZ=Asia/Shanghai
EXPOSE 80
COPY . .
ENTRYPOINT ["dotnet", "Sukt.Core.API.dll"]
```



### 第二种是在Dockerfile发布项目并打包
对应的yml
```
name: Sukt.Core.API.Dockerfile.Compile
on:
  push:
    branches: [dev/suktauthserver]
  pull_request:
    branches: [dev/suktauthserver]

env:
   IMAGE_NAME: registry.cn-hangzhou.aliyuncs.com/suktcore/sukt-core-admin-api #
   IMAGE_TAG: dockerfilebuild

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup .NET Core
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: 5.0.x
    - name: Login To Docker #登录到镜像仓库
      uses: docker/login-action@v1
      with:
        username: ${{ secrets.ALIYUN_DOCKER_IMAGESTORE_USERNAME }}
        password: ${{ secrets.ALIYUN_DOCKER_IMAGESTORE_PASSWORD }}
        registry: registry.cn-hangzhou.aliyuncs.com/suktcore/sukt-core-admin-api #镜像仓库地址
    - name: Build Docker Image # Build Docker镜像并推送到镜像仓库
      uses: docker/build-push-action@v2
      with:
        tags: ${{env.IMAGE_NAME}}:${{env.IMAGE_TAG}}.${{ github.run_id }}.${{ github.run_number }} #动态变量镜像TAG 使用github运行job和jobid设置tag
        context: /home/runner/work/Sukt.Core/Sukt.Core
        file: /home/runner/work/Sukt.Core/Sukt.Core/Dockerfilepublish # 指定Dockerfile
        push: true
    - name: Docker Images Lst # 列出所有镜像
      run: docker images
```

#### 对应的Dockerfile
```
FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS base
WORKDIR /app
EXPOSE 80
ENV TZ=Asia/Shanghai
FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build
WORKDIR /src
RUN ls
COPY ["src/Sukt.Core.API/Sukt.Core.API.csproj", "src/Sukt.Core.API/"]
COPY ["src/Sukt.Core.Dtos/Sukt.Core.Dtos.csproj", "src/Sukt.Core.Dtos/"]
COPY ["src/Sukt.Core.Domain.Models/Sukt.Core.Domain.Models.csproj", "src/Sukt.Core.Domain.Models/"]
COPY ["src/Sukt.Core.Identity/Sukt.Core.Identity.csproj", "src/Sukt.Core.Identity/"]
COPY ["src/Sukt.Core.Shared/Sukt.Core.Shared.csproj", "src/Sukt.Core.Shared/"]
COPY ["src/Sukt.Core.Application/Sukt.Core.Application.csproj", "src/Sukt.Core.Application/"]
COPY ["src/Sukt.Core.Domain.Services/Sukt.Core.Domain.Services.csproj", "src/Sukt.Core.Domain.Services/"]
COPY ["src/Sukt.Core.EntityFrameworkCore/Sukt.Core.EntityFrameworkCore.csproj", "src/Sukt.Core.EntityFrameworkCore/"]
RUN dotnet restore "src/Sukt.Core.API/Sukt.Core.API.csproj"
RUN ls
COPY . .
WORKDIR "/src/src/Sukt.Core.API"
RUN dotnet build "Sukt.Core.API.csproj" -c Release -o /app/build
FROM build AS publish
RUN dotnet publish "Sukt.Core.API.csproj" -c Release -o /app/publish
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Sukt.Core.API.dll"]
```

## 5、Github Action实现CD
因为是个人开源的项目，所以在部署项目的时候不想在做CI/CD服务器，就想使用github Action来做持续集成和发布了，最近这两天研究了一下使用github Action 实现K8s的持续交付，大概的实现方式分为两部。
 - **第一步编写K8sdeployment**
 我们项目在部署到K8s的时候需要一个deployment的yaml，但是这个yaml里面的镜像tag是随着github action的自动创建的ID生成的，所以第一步就是要解决这个问题，这里我使用了一个这个仓库 datamonsters/replace-action 来做的替换，下面看我K8s的deployment里面具体怎么写的。设置指定标签【$IMAGE_TAG】
 ``` shell
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    labels:
      app: sukt-platform-admin
    name: sukt-platform-admin
    namespace: sukt-platform
  spec:
    replicas: 3
    selector:
      matchLabels:
        app: sukt-platform-admin
    strategy:
      rollingUpdate:
        maxSurge: 1
        maxUnavailable: 1
      type: RollingUpdate
    template:
      metadata:
        labels:
          app: sukt-platform-admin
      spec:
        containers:
        - name: sukt-platform-admin
          image: registry.cn-hangzhou.aliyuncs.com/sukt-platform/sukt-admin-api:$IMAGE_TAG 
          imagePullPolicy: IfNotPresent
          livenessProbe:
              httpGet:
                path: /api/healthchecks/liveness
                port: 80
                scheme: HTTP
              initialDelaySeconds: 120
              periodSeconds: 30 
                # timeoutSeconds: 60
          readinessProbe:
            httpGet: 
              path: /api/healthchecks/readiness
              port: 80
              scheme: HTTP
            initialDelaySeconds: 30
            periodSeconds: 60 
              # timeoutSeconds: 60
          resources:
            limits:
              memory: "2Gi"
              cpu: "1000m"
          ports:
          - containerPort: 80
            protocol: TCP
          volumeMounts:
              - mountPath: /app/appsettings.json # 这个对应的是容器内的地址
                name: appsettings
                readOnly: true
                subPath: appsettings.json # #这个位置对应的是comfigmap中的名字，不是 /usr/local/apisix-dashboard/conf/conf.yaml的
              - mountPath: /app/skyapm.json # 这个对应的是容器内的地址
                name: skyapm
                readOnly: true
                subPath: skyapm.json # #这个位置对应的是comfigmap中的名字，不是 /usr/local/apisix-dashboard/conf/conf.yaml的
          env:
            - name: ASPNETCORE_HOSTINGSTARTUPASSEMBLIES # 需要通过映射的方式传入，不能通过Dockerfile的方式默认
              value: SkyAPM.Agent.AspNetCore
        restartPolicy: Always
        imagePullSecrets:
          - name: aliyun-iamge-secret
        volumes:
          - configMap:
              defaultMode: 420
              name:  sukt-admin-appsettings
            name: appsettings
          - configMap:
              defaultMode: 420
              name:  skyapm
            name: skyapm
 ```
 - **第二步替换指定标签**
 我们需要在github action运行时替换【$IMAGE_TAG】这个标签，需要在github action 执行的时候替换成github action 自动生成的Id。下面我们看具体的替换实现。
 ```
 uses: datamonsters/replace-action@v2
      with:
        files: 'K8sdeploy/sukt-platform-admin-deployment-and-service.yaml'
        replacements: '$IMAGE_TAG=${{env.IMAGE_TAG}}.${{ github.run_number }}'
 ```
 - **第三步部署到K8s**
 在部署到K8s之前我们需要先创建一个secrets用来存储K8sconfig，我使用的是【actions-hub/kubectl】这个库需要将K8s的config转换成base64,剩下的操作就是在github action里面引用这个库，并使用配置好的secret。具体代码如下：
 ``` shell
 - uses: actions-hub/kubectl@master
      name: deploy to k8s
      env:
        KUBE_CONFIG: ${{ secrets.KUBE_CONFIG }}
      with:
        args: apply -f K8sdeploy/sukt-platform-admin-deployment-and-service.yaml
 ```
## 6、Github Action部署心得
在使用github action第二种方式部署的时候遇到过一个问题，因为我项目的解决方案和项目目录还有一层src相隔，在执行dockerfile的时候会报错无法找到Sukt.Core.API/Sukt.Core.API.csproj项目路径，所以在这里我把dockerfile手动移动到了和解决方案一层的目录中解决了这个问题，所以使用的时候要先确定路径。暂时先做到持续集成，因为我的k8s集群在内网，在cd的时候使用的是frp+阿里云的一台服务器穿透出来的，感觉这种方式还是挺好的避免了云服务器的花费。
![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20210903173147.png)
secrets.ALIYUN_DOCKER_IMAGESTORE_USERNAME、secrets.ALIYUN_DOCKER_IMAGESTORE_PASSWORD这两个是变量配置的是阿里云 镜像仓库的账号密码，需要参考下图自行添加
![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20210903173356.png)