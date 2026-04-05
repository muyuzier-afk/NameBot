# AI PR Review Bot

一个基于AI大模型的GitHub Pull Request自动审查机器人。

## 功能特性

- 自动监听PR创建和更新事件
- 获取PR代码变更
- 使用OpenAI GPT模型进行智能代码审查
- 提供代码质量评估、Bug检测、性能建议和安全检查
- 自动在PR中发表审查评论

## 技术栈

- **Node.js** - 运行环境
- **Probot** - GitHub Apps开发框架
- **OpenAI API** - AI大模型支持
- **Octokit** - GitHub API客户端

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制`.env.example`为`.env`并填入你的配置：

```bash
cp .env.example .env
```

编辑`.env`文件，填入以下信息：

- `APP_ID`: GitHub App ID
- `PRIVATE_KEY`: GitHub App私钥
- `WEBHOOK_SECRET`: Webhook密钥
- `OPENAI_API_KEY`: OpenAI API密钥
- `OPENAI_MODEL`: 使用的模型（默认gpt-4）

### 3. 创建GitHub App

1. 访问 [GitHub Settings > Developer settings > GitHub Apps](https://github.com/settings/apps)
2. 点击 "New GitHub App"
3. 填写基本信息
4. 设置Webhook URL（本地开发可使用smee.io）
5. 配置权限：
   - Pull requests: Read & write
   - Issues: Read & write
   - Repository contents: Read-only
6. 订阅事件：
   - Pull request
   - Issue comment

### 4. 运行Bot

```bash
npm run dev
```

## 项目结构

```
.
├── index.js              # 主入口文件
├── package.json          # 项目配置
├── .env.example          # 环境变量示例
├── .gitignore           # Git忽略文件
├── src/
│   └── codeReviewer.js  # 代码审查核心逻辑
└── README.md            # 项目文档
```

## 使用说明

1. 将GitHub App安装到你的仓库
2. 创建新的Pull Request或更新现有PR
3. Bot会自动进行代码审查并发表评论

## 自定义

你可以修改`src/codeReviewer.js`中的提示词来调整AI的审查风格和重点。

## 许可证

ISC
