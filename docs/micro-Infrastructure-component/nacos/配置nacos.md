# 不使用官方pvc的方式持久化Nacos部署到k8s
``` shell
#建议将这种devops的所有基础组件放到一个namespance里面
# 先去github官网执行sql脚本，其次再执行deployment.yaml
# 本人的deployment使用环境变量方式注入不建议使用文件替换的方式
# 然后在执行nacos-service.yaml
```