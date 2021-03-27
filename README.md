# 2084team OA系统的部署

这里主要讲怎么部署项目，分布式部署，具体细节全在我们团队的仓库代码中

[原项目地址](https://github.com/lenve/vhr)

[团队git仓库]()

界面精美，代码优美，系统并不复杂，适合初学者

可以前后端分离，也可以不分离

## 技术栈

前置知识：Spring Boot,Spring Security,MySQL,MyBatis,Redis

进阶知识：RabbitMQ,Spring Cache,WebSocket

前端：Vue,ElementUI,Axios,Vue-Router,WebSocket,Vue-Cli4

## 环境

这里是在单个机器上：Windows本地或者一台服务器上体验效果

- 打开MySQL,创建空数据库`vhr`


- 打开Redis


- 打开Nginx


- 安装rabbitmq，全部都用最新版本

  - [安装erlang](https://www.erlang-solutions.com/downloads/) 配置环境变量`cmd> erl -v `出现则成功

  -  [安装RabbitMQ](https://www.rabbitmq.com/download.html) 配置环境变量 `cmd>rabbitmqctl status`出现则成功，打开浏览器，http://localhost:15672

- 保证所有环境配置好，IDEA打开后端工程/vhr，WebStorm打开前端工程/vuehr


- 注意：不要前后端目录一起打开，IDEA会识别不出springboot项目


## 代码

第一步：修改`application.properties/application.yml`中的MySQL,Redis,RabbitMQ配置

第二步：大体浏览代码，可见代码非常工整，是分布式分模块开发

第三步：启动mailserver模块，然后启动webserver模块

[作者对于这个项目的总结与展望](https://mp.weixin.qq.com/s/Eo2RRB6zKQuPDMWlnCHDrw)

我对于这个项目的态度：

代码清楚，易于集成，适合技术点的学习，可以融合其他的api

## 部署

### 用Docker部署

用docker部署，这样能便捷一些，省去很多不必要的麻烦

不会使用Docker命令的同学可以用Kitematic客户端或者Rancher客户端来管理容器

六个服务：前端，mailserver，vhr-web，MySQL，Redis，RabbitMQ

- 前端：vuehr-8180

- 后端：mailserver-8181
- 后端：webserver-8182

- 数据库：MySQL-3306 33060
- 缓存：Redis-6379
- 消息队列：RabbitMQ-5672 15672 25672 1883 61613

### 部署事项

- 服务器要打开所有的服务端口

- 因为都是容器内部的，所以要外网IP+外部端口号

- 安装MySQL

  ```bash
  docker run --name sql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=2084team -dit --network host mysql:latest --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
  ```

  数据库建空库`vhr`即可，注意数据库可以本地挂载数据

  通过一种MySQL客户端连接mysql，直接使用IDEA自带的插件就可以，注意调整时区`Asia/Shanghai`，连接通畅才能在代码中连接

- 安装RabbitMQ，rabbitmq客户端：Docker方式

  ```bash
  docker run -dit --hostname vhr-rabbitmq --name vhr-rabbitmq -e RABBITMQ_DEFAULT_USER=2084team -e RABBITMQ_DEFAULT_PASS=2084team -p 5672:5672 -p 15672:15672 -p 25672:25672 -p 1883:1883 -p 61613:61613 --network host rabbitmq:3-management
  ```

  通过web访问客户端（ip:15672），连接通畅才能在代码中连接，否则调试

- 安装Redis：Docker方式

  ```bash
  docker run --name vhr-redis -dit -p 6379:6379 --network host redis
  ```

  通过一种Redis客户端连接Redis，[推荐使用这个](https://github.com/qishibo/AnotherRedisDesktopManager)，连接通畅才能在代码中连接

### 后端服务

**本地构建包，将镜像推送到远程的服务器**

#### IDEA连接Linux主机的Docker

- [IDEA远程连接Docker](https://mp.weixin.qq.com/s?__biz=MzI1NDY0MTkzNQ==&mid=2247486342&idx=1&sn=b8adcef8237f3d222816c985ff58b654&scene=21#wechat_redirect)，推送镜像，用此方式来推送后端服务镜像，比较便捷

  ```bash
  vim /usr/lib/systemd/system/docker.service
  ```

  修改配置

  - 原配置： -H fd:// --containerd=/run/containerd/containerd.sock

  - 现配置： -H tcp://0.0.0.0:2375  -H unix:///var/run/docker.sock

  配置文件修改好，保证后端一定可以连接上MySQL，Redis，RabbitMQ，就像我刚才说的，客户端或者web端连接成功才能在代码中连接，否则别说项目跑不起来，打包都不一定成功！

- 编写Dockfile文件，放在能打包成为jar包的位置，本项目放置在`mailserver`和`vhr-web`各一个

#### 打包方法

  **化重点，本人踩了很多坑，在某个论坛上发现某大佬的经验**

>注意：多模块项目仅仅需要在启动类所在的模块添加打包插件即可，不要在父类添加打包插件，因为那样会导致全部子模块都使用spring-boot-maven-plugin的方式来打包（例如BOOT-INF/com/hehe/xx），而mm-web模块引入mm-xx 的jar 需要的是裸露的类文件，即目录格式为（/com/hehe/xx）。

-   Docker也是应该如此，首先：不应该有两个端口出现在同一个jar包内，第二：pom的打包方式不能获得我们要的程序，父工程只是分模块开发而已，我们最后要的是jar包->交付的是Linux内的Docker镜像

- 对于本项目，mailserver和vhrserver是两个不同的项目，只是用RabbitMQ通信而已，pom.xml中的层级关系要理清

- 回顾maven基础：maven中唯一确定一个包的三个因素是：

```xml
  <dependency>
      <groupId></groupId>
      <artifactId></artifactId>
      <version></version>
  </dependency>
```

- 所以，我们只需要在有jar包的位置放置我们的docker打包插件，最后打包时，直接打包整个后端工程/vhr即可，因为模块有依赖关系，我们不必关心先打包哪一个，打包以及构建镜像需要5min多，耐心等待，打包完成之后可看到远程服务器多了镜像

-  本地重启idea可以看到右下角多了个提示，提示我们可以发布容器，我们连接远程服务器，发布我们的容器，Create Docker Configuration，拼凑我们的命令将容器运行起来

    关于idea的docker图标在哪里找：在Run/Debug Configurations里面，就是MVC阶段我们配置tomcat的地方

- jdk版本要对应 都用11，docker在构建镜像时的jdk版本也要对应，否则项目启动失败，我重构了3次，推荐镜像构建用`adoptopenjdk/openjdk11:latest`

- 最后，运行容器即可

  ```bash
  docker run -dit -p 8182:8182 --name vhr-web --network host 2084team/vhr-web
  ```

- 公网访问

- 这些所有的细节，错一点你的项目都不能成功！

### 前端服务

- 可以用docker构建前端工程或可以用第三方平台来放置前端服务，减少服务器压力


- 这里nginx配置转发策略，所以用直接主机，而不是容器内

  [远程服务器配置前端工程](https://mp.weixin.qq.com/s/C7PIck3SIPPTcA3NX3ELoQ)

- 本地构建前端工程，静态资源直接放到服务器即可

  ```bash
  npm run build 
  ```

- 因为nginx做内网转发，所以后端不用做https证书配置


- 服务器太小导致卡顿，这里可以选择第三方平台放置服务或者大的服务器

- Docker 打包部署前端工程，如果是这样那么需要停止掉主机上的原来的nginx `systemctl stop nginx `

  WebStorm连接os1机器的Docker

  编写Dockerfile文件暴露端口80，注意vue.config.js配置中的端口也要暴露这个端口，因为前端镜像基于nginx,nginx监听不允许其他端口否则运行不了，`default.conf`中转发的路径要写真实ip和真实端口号，当然了，可以部署3个后端，然后进行分权重转发

  点击Edit Configuration开始写配置打包，编译并上传镜像

  启动

  ```bash
  docker run -dit  --name vuehr --network host  vuehr
  ```

### 分机器部署策略

最后虽然部署成功，但是消息队列，数据库，后端服务，前端服务，缓存服务都在一台主机上，本人的1核2G的阿里云学生机太小，导致瞬间卡顿，自己的博客都挂了，所以不得不使用别的方法，因为我们实验室有机器，这种分配策略适合三台机器配置一样的情况

我们实验室有三台机器，互相来讲都是内网，可以考虑分配策略

服务器密码忘了，可以上网搜索（WinSCP密码忘了怎么办），别问我为什么搜索😂

| 服务\平台 | 第三方平台托管 | os1                                 | c1                                 | web1              |
| --------- | -------------- | ----------------------------------- | ---------------------------------- | ----------------- |
| 前端服务  | 暂不考虑       | 静态直接放在本地80端口或者Docker 80 |                                    |                   |
| 后端服务  |                | Docker 8181 8182                    |                                    |                   |
| 消息队列  |                |                                     | Docker 5672 15672 25672 1883 61613 |                   |
| 缓存      |                |                                     | Docker 6379                        |                   |
| 数据库    |                |                                     |                                    | Docker 3306 33060 |

注意我刚才写的**用Docker部署***的命令，都加了`--network host`，就是使用和本机一样的端口，而不创建虚拟端口，这样做是不让docker创建新的网卡，后面有说为什么这样做

#### 三台服务器安装配置Docker

安装看官方文档

配置docker的国内镜像

```bash
# 进入文件
vim /etc/docker/daemon.json

# 修改镜像源
{"registry-mirrors": ["https://registry.cn-hangzhou.aliyuncs.com"]}

# 重启docker
systemctl daemon-reload
systemctl restart docker

# 查看镜像源
docker info|grep Mirrors -A 1
```

#### 服务器配置

查看服务器内存，可看到服务器内存相当大

```bash
# ubuntu
watch free -h
# centos
free -m 
```

##### 打开centos端口

```bash
# 查询端口是否打开
firewall-cmd --query-port=[port]/tcp

# 查看防火墙状态 
systemctl status firewalld
# 开启防火墙 
systemctl start firewalld  
# 关闭防火墙 
systemctl stop firewalld
# 开启防火墙 
service firewalld start 
# 若遇到无法开启
# 先用：
systemctl unmask firewalld.service 
# 然后：
systemctl start firewalld.service

# 添加指定需要开放的端口：
firewall-cmd --add-port=123/tcp --permanent
# 重载入添加的端口：
firewall-cmd --reload
# 查询指定端口是否开启成功：
firewall-cmd --query-port=123/tcp
# 移除指定端口：
firewall-cmd --permanent --remove-port=123/tcp

# 安装iptables-services ：
yum install iptables-services 
# 进入下面目录进行修改：
/etc/sysconfig/iptables
```

##### 打开ubuntu端口

```bash
sudo apt-get install iptables
sudo apt-get install iptables-persistent
```

##### 锐捷上网

搞了半天，发现服务器上网断断续续，查看日志发现多网卡配置，锐捷会禁用多网卡上网，所以才会出现只能上网一分钟然后退出的问题，Windows也是如此，最终一台机器上允许存在：docker0，ens*，lo三个网卡，不能出现其他的网卡

```bash
ifconfig 
sudo ifconfig [网卡] down
```

上网了，但是删除网卡导致了容器网络消失，我将网卡停掉，发现web1和c1两台机器（MySQL，Redis和RabbitMQ）客户端都连不上了

这是因为锐捷认证上网，除了本地的网卡不能有其他虚拟网卡，但是Docker在运行容器时会创建新的网卡（docker0本身没事），所以docker和ruijie上网冲突，不得不选择`--netowrk host`的容器启动方式

这里要说：锐捷上网和Docker容器并存的解决方案是我摸索出来的（幸亏学了Docker网络原理），关于Docker可以上B站找[狂神说](https://www.bilibili.com/video/BV1og4y1q7M4)

[原文链接](https://www.jianshu.com/p/22a7032bb7bd)

>host模式
>如果启动容器的时候使用host模式，那么这个容器将不会获得一个独立的Network Namespace，而是和宿主机共用一个Network Namespace。容器将不会虚拟出自己的网卡，配置自己的IP等，而是使用宿主机的IP和端口。但是，容器的其他方面，如文件系统、进程列表等还是和宿主机隔离的。
>
>使用host模式的容器可以直接使用宿主机的IP地址与外界通信，容器内部的服务端口也可以使用宿主机的端口，不需要进行NAT，host最大的优势就是网络性能比较好，但是docker host上已经使用的端口就不能再用了，网络的隔离性不好。

这样既能保证网络通畅，又能保证docker容器服务，也就是说-p没有用了，你在运行MySQL,Redis,RabbitMQ和两个后端服务时加不加-p都没事，直接使用主机端口，而不是虚拟端口的映射

#### os1主机反向代理,分发请求

- os1安装nginx


```bash
apt-get install nginx 
```

配置文件位置：/etc/nginx/nginx.conf

证书位置：/home/tls_certificate/*

- 我们将域名证书和前端打包好的服务上传到服务器

用scp将Windows本地的文件传给服务器

```bash
# 关闭ubuntu防火墙要
ufw disable
# 开放端口
sudo ufw allow 21
ufw default allow 21
# 传文件
scp -P 21 -r /dist/ os1@172.16.75.200:/etc/nginx/sites-available
ufw enable
```

将Windows本地生成的公钥粘贴至/root/.ssh下的authorized_keys即可，否则提示密码输入错误

[这篇文章讲述了两个主机建立信任的过程](https://www.pianshen.com/article/2436461320/)

或者用root改文件操作权限，直接拖拽文件即可

```bash
chmod 777 
```

### 小结

域名要解析到os1主机上，这样静态资源（ * .html,字体图标，* .js ，*.css）等会直接读取服务器磁盘，nginx会转发请求给后端，对于三台机器来讲都是内网，这样前后端分离，数据库，缓存，消息队列都分开访问速度肯定快，如果不需要外网访问，那么到这里就可以了，但是我们为了外网访问，需要frp内网穿透

### 内网穿透

#### 简介

[frp官方文档](https://gofrp.org/docs/)

那么现在已经可以通过内网（校园网）访问我们的系统 https://oa.2084team.com ，但是想要通过外网还要配置frp内网穿透

[Windows本地下载](https://github.com/fatedier/frp/releases/download/v0.36.2/frp_0.36.2_linux_amd64.tar.gz)，正常解压上传止服务器即可

文件目录

frps公网服务器root /home/frps

frpc内网服务器os1 /home/frpc

#### SSH 外网连接内网服务器

用SSH命令行方式连接内网服务器

- 确保对应端口打开：内网外网端口都打开
- 确保内网服务器能上网，连接外网

按照文档的配置文件编写，然后我们使用一个不连接内网的机器，比如iPad连接内网服务器试试能否成功

```bash
# 连接
ssh -oPort=6000 [内网用户名]:[外网ip]
# 密码是内网服务器密码
```

确实是成功了，这里会看起来有些奇怪：用的是内网用户名，外网ip，内网服务器密码，这里只是frp的转发作用将外网的流量通过6000端口转发到了内网22端口上，通信协议为tcp

#### 域名访问内网web服务

这里我们不用这种方式，而是直接采用https的方式

那么我们的域名也要解析到外网服务器上了

外网服器的端口开放一个，用来设置web服务的转发端口，需要说明：外网的服务器80和443端口不能占用

域名证书：/home/tls_certificate/oa.2084team.com.pem

这部分可以自己摸索，[没弄明白就看这篇播客](https://www.nbmao.com/archives/4452)

如果frpc不能转发80或者443端口，那么可以将前端服务打包在Docker中运行，端口为非80端口

#### 启动服务

配置文件编写好以后

先启动公网服务器的服务端

```bash
./frps -c ./frps.ini
```

然后启动内网服务器的客户端

```bash
./frpc -c ./frpc.ini
```

长期运行frp需要编写shell脚本放在客户端和服务端的`/etc/systemd/system`目录下

编写shell脚本，后台长期启动frps,frpc

#### 公网服务端frps

```shell
vim /etc/systemd/system/frps.service

# shell脚本
[Unit]
Description=frp-server daemon
Wants=NetworkManager-wait-online.service network-online.target
After=NetworkManager-wait-online.service network.target network-online.target
#After=network.target
[Service]
Type=simple
#User=root
Restart=on-failure
RestartSec=5s
WorkingDirectory=/home/frps
ExecStart=/home/frps/frps -c /home/frps/frps.ini
[Install]
WantedBy=multi-user.target
```

然后就可以指挥脚本了

```shell
sudo systemctl daemon-reload
sudo systemctl enable frps.service
sudo systemctl disable frps.service
sudo systemctl start frps.service
sudo systemctl stop frps.service
sudo systemctl restart frps.service
sudo systemctl status frps.service
```

#### 内网客户端frpc

这个类似于frps的

```shell
vim /etc/systemd/system/frpc.service

# shell脚本
[Unit]
Description=frp-client daemon
Wants=NetworkManager-wait-online.service network-online.target
After=NetworkManager-wait-online.service network.target network-online.target
#After=network.target
[Service]
Type=simple
#User=root
Restart=on-failure
RestartSec=5s
WorkingDirectory=/home/frpc
ExecStart=/home/frpc/frpc -c /home/frpc/frpc.ini
ExecReload=/home/frpc/frpc reload -c /home/frpc/frpc.ini
[Install]
WantedBy=multi-user.target
```

指挥脚本

```shell
sudo systemctl daemon-reload
sudo systemctl enable frpc.service
sudo systemctl disable frpc.service
sudo systemctl start frpc.service
sudo systemctl stop frpc.service
sudo systemctl restart frpc.service
sudo systemctl status frpc.service
```

至此已经可以通过外网访问了，结束！！！
