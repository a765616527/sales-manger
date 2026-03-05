# 销售管理系统（Next.js）

基于 `Next.js + shadcn/ui + Tailwind CSS + sonner + MySQL + Prisma` 的多角色销售管理中台示例。

## 约定（已执行）

- 数据库中**不使用枚举类型（ENUM）**。
- 用户角色字段 `User.role` 使用字符串字段（`VARCHAR`），并在代码中通过常量 `APP_ROLES` 约束可选值。
- 该约定已落地到 Prisma 模型、接口校验、种子数据、前端角色逻辑。

## 当前已完成功能

### 栏目一：销售账号添加
- 创建日期（默认当天，不可修改）
- 发展人
- 销售微信号昵称
- 销售微信号（唯一）
- 备注

### 栏目二：销售账号管理
- 列表字段：创建日期、发展人、销售微信号昵称、销售微信号、备注、状态
- 支持按发展人筛选
- 支持按微信昵称/微信号关键词搜索
- 支持编辑备注
- 支持停用/启用

### 栏目三：营销数据添加
- 日期（默认当天）
- 销售微信选择（支持搜索昵称或微信号）
- 添加好友数量
- 转化人数
- 兼职人员

### 栏目四：营销数据看板
- 筛选：发展人、销售微信昵称/微信号关键词、兼职人员、时间范围
- 折线图：
  - 每日添加好友数量趋势（按销售账号）
  - 每日转化人数趋势（按销售账号）
- 汇总统计：
  - 总添加好友数、总转化人数、总平均转化率
  - 日添加好友数（结束日期）、日转化人数（结束日期）、日平均转化率（结束日期）

### 栏目五：用户管理
- 用户类型：管理员、发展人、兼职
- 支持按角色/状态/关键词筛选
- 支持新增用户
- 支持编辑用户（姓名、角色、重置密码）
- 支持启用/停用

## 发展人端（已完成）

- 仅管理与查看“自己名下”的数据（后端查询层做了归属限制）
- 我的销售账号：
  - 仅显示本人名下销售账号
  - 支持微信昵称/微信号搜索
  - 支持备注编辑
  - 支持启用/停用
- 我的营销看板：
  - 支持筛选销售微信昵称或微信号
  - 支持筛选时间范围
  - 折线图支持查看：
    - 各销售账号每天添加好友数量
    - 所有销售账号总新增每天添加好友数量

## 角色与登录

统一登录入口：`/login`

生产环境请使用部署时初始化的管理员账号，并在后台按需创建其他角色账号。

## 技术栈

- Next.js（App Router）
- Tailwind CSS
- shadcn/ui
- sonner
- Prisma + MySQL

## 本地启动

### 1. 环境要求
- Node.js 20+
- MySQL 8+

### 2. 配置 `.env`

```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/sales_manager"
SESSION_SECRET="please-change-this-session-secret"
ADMIN_INIT_USERNAME="admin"
ADMIN_INIT_PASSWORD="admin123456"
```

### 3. 安装依赖

```bash
npm install
```

### 4. 同步数据库并初始化数据（本地开发）

```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

### 5. 启动项目

```bash
npm run dev
```

访问：`http://localhost:3000`

## Docker Compose 一键部署（生产）

### 部署文件说明

- `docker-compose.yml`
  - 应用镜像固定为：`arxuan123/sales-manger:latest`
  - 包含 3 个服务：`app`、`mysql`、`watchtower`
  - MySQL 数据目录绑定到：`./mysql-data`（相对于 Compose 文件所在目录，不使用 Docker volume）
  - Watchtower 仅检查带 `com.centurylinklabs.watchtower.enable=true` 的容器
  - `mysql` 已显式设置为 `watchtower.enable=false`，不会被自动更新
- `deploy.sh`
  - 一键部署脚本
  - 交互式输入：项目端口、初始管理员账号、初始管理员密码
  - 镜像名不允许交互修改，始终以 `docker-compose.yml` 中配置为准
  - 脚本会自动创建 `sales-manger-deploy` 目录，并下载 `docker-compose.yml` 到该目录中再部署
  - 部署前会检查 `sales-manger-deploy` 目录
    - 若目录已存在，判定为已安装并直接退出
    - 需要先移动或删除该目录，再重新执行安装

### 部署前准备

1. 安装 Docker 和 Docker Compose 插件
2. 确认 DockerHub 可拉取镜像 `arxuan123/sales-manger:latest`
3. 选择一个空目录作为部署目录

### 一键部署命令

```bash
# 1) 下载部署脚本
curl -fsSL "https://raw.githubusercontent.com/a765616527/sales-manger/refs/heads/main/deploy.sh" -o deploy.sh

# 2) 赋予脚本执行权限
chmod +x deploy.sh

# 3) 执行一键部署
./deploy.sh
```

脚本执行时会自动下载 Compose 文件：

```text
https://raw.githubusercontent.com/a765616527/sales-manger/refs/heads/main/docker-compose.yml
```

### 脚本执行流程

1. 检查 `sales-manger-deploy` 目录是否已存在（存在则判定已安装并退出）
2. 创建 `sales-manger-deploy` 目录并下载 `docker-compose.yml` 到该目录
3. 读取并回写 Compose 中的部署参数（端口、管理员账号密码）
4. 创建 MySQL 数据目录 `sales-manger-deploy/mysql-data`
5. 拉取应用镜像（`docker compose pull app`）
6. 启动 MySQL 并等待健康检查通过
7. 启动应用与 watchtower

### 生产初始化行为

- 容器启动时仅执行：
  - `prisma db push`（同步数据库结构）
  - 管理员账号初始化/更新（基于 `ADMIN_INIT_USERNAME`、`ADMIN_INIT_PASSWORD`）
- 不执行种子数据初始化（不写入示例账号、示例业务数据）

## 主要路由

- 登录页：`/login`
- 仪表盘入口：`/dashboard`
- 管理员 - 销售账号管理：`/dashboard/admin/sales-accounts`
- 管理员 - 销售账号添加：`/dashboard/admin/sales-accounts/new`
- 管理员 - 营销数据添加：`/dashboard/admin/marketing-data/new`
- 管理员 - 营销数据看板：`/dashboard/admin/marketing-dashboard`
- 管理员 - 用户管理：`/dashboard/admin/users`
- 发展人占位页：`/dashboard/promoter`
- 发展人 - 我的销售账号：`/dashboard/promoter/sales-accounts`
- 发展人 - 我的营销看板：`/dashboard/promoter/marketing-dashboard`
- 兼职 - 我的营销看板：`/dashboard/part-time`

## GitHub 推送规范（必须遵守）

- 每次推送到 GitHub 前，必须创建并推送一个版本 Tag。
- 版本号建议使用语义化格式：`v主版本.次版本.修订号`，例如：`v1.3.0`。
- 每次更新内容说明必须使用中文（包括提交说明、发布说明或变更记录）。
- 不允许“仅推送代码不打 Tag”的发布方式。

推荐流程示例：

```bash
git add .
git commit -m "中文：本次更新内容说明"
git tag -a v1.0.0 -m "中文：v1.0.0 更新内容说明"
git push origin <分支名>
git push origin v1.0.0
```

## DockerHub 镜像发布规范（必须遵守）

- Compose 统一拉取镜像：`arxuan123/sales-manger:latest`。
- 每次发布镜像必须同时推送 2 个 Tag：
  - 日期备份 Tag：`YYYYMMDD`（例如：`20260305`）
  - 最新 Tag：`latest`
- 不允许只推送单个 Tag。

推荐流程示例：

```bash
docker build -t arxuan123/sales-manger:20260305 -t arxuan123/sales-manger:latest .
docker push arxuan123/sales-manger:20260305
docker push arxuan123/sales-manger:latest
```
