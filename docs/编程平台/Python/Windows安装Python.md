+ # Windows安装Python
  最近因为个人原因，所以需要学习以下Python，个人看了一下Python，作用还是很大的，尤其是写一些脚本或者操作Excel之类的，最近在学习物联网开发和帮朋友做一些财务上的东西，所以打算学一下Python，我们先从安装开始。
  + # 1、在Windows环境下安装Python
    + ## 下载Python安装包
      我们直接去[Python官网下载](https://www.python.org/downloads/)相应操作系统的安装包,我的系统Window所以下载的是Windows版本的，点击直接下载即可![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412131539.png)，下载完成之后我们开始安装

    + ## 安装
      我这里选择添加环境变量和自定义安装，我装在了D盘。
      ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412131722.png)，
    ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412131813.png)，
    + ## 查看环境变量
      点击环境变量，
      ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412131948.png)，
      ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412132107.png),
      ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412132132.png)，
      点击编辑可以看到环境变量内看到设置的环境变量，
      如下图：![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412132243.png)，这就证明我们装好了，
    + ## 使用命令查看Python版本
      我们可以在终端窗口使用python --version命令查看我们的版本，如下图：
      ![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412132352.png)。
    + ## 忘记添加到环境变量
      如果你忘记了勾选添加到环境变量的话，也是可以手动选择添加环境变量的，具体操作步骤就是以上查看环境变量开始，找到我们对应的Path环境变量设置，然后找到你的安装目录，例如我的：D:\Program Files (x86)\Python\Python311 和 D:\Program Files (x86)\Python\Python311\Scripts  
      **在这里选择新建环境变量，将上面的两个路径粘贴进去即可，这里填的路径是你自己的Python安装位置。**![](https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20230412133139.png)。