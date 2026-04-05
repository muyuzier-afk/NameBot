# AI PR Review Bot

一个基于AI大模型的GitHub Pull Request自动审查机器人，采用模块化微服务架构设计。

## 功能特性

- 自动监听PR创建和更新事件
- 获取PR代码变更
- 使用OpenAI GPT模型进行智能代码审查
- 提供代码质量评估、Bug检测、性能建议和安全检查
- 自动在PR中发表审查评论
- 支持配置文件和环境变量双重配置方式
- 可限制审查文件数量和变更行数
- 详细的审查报告格式
- 支持自定义OpenAI BaseURL
- 模块化微服务架构设计
- 可扩展的提示词配置

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

### 2. 配置方式（二选一）

#### 方式A：使用配置文件（推荐）

复制`config.json.example`为`config.json`并填入你的配置：

```bash
cp config.json.example config.json
```

编辑`config.json`文件，填入以下信息：

- `openai.apiKey`: OpenAI API密钥
- `openai.model`: 使用的模型（默认gpt-4）
- `openai.baseURL`: OpenAI API基础URL（默认https://api.openai.com/v1）
- `github.appId`: GitHub App ID
- `github.privateKey`: GitHub App私钥
- `github.webhookSecret`: Webhook密钥
- `review.maxFiles`: 最大审查文件数（默认20）
- `review.maxLines`: 最大变更行数（默认10000）

#### 方式B：使用环境变量

复制`.env.example`为`.env`并填入你的配置：

```bash
cp .env.example .env
```

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
├── prompt.md            # 提示词配置文件（可自定义）
├── config.json.example   # 配置文件示例
├── .env.example          # 环境变量示例
├── .gitignore           # Git忽略文件
├── src/
│   ├── config/           # 配置管理模块
│   │   └── index.js      # 配置和提示词加载管理
│   ├── services/         # 服务模块
│   │   ├── openaiService.js    # OpenAI服务
│   │   ├── githubService.js    # GitHub服务
│   │   └── reviewService.js    # 审查服务
│   ├── utils/            # 工具函数（预留）
│   └── models/           # 数据模型（预留）
└── README.md            # 项目文档
```

## 使用说明

1. 将GitHub App安装到你的仓库
2. 创建新的Pull Request或更新现有PR
3. Bot会自动进行代码审查并发表评论

## 配置选项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `openai.apiKey` | OpenAI API密钥 | - |
| `openai.model` | 使用的模型 | gpt-4 |
| `openai.baseURL` | OpenAI API基础URL | https://api.openai.com/v1 |
| `review.enabled` | 是否启用审查 | true |
| `review.maxFiles` | 最大审查文件数 | 20 |
| `review.maxLines` | 最大变更行数 | 10000 |
| `review.commentTitle` | 评论标题 | 🤖 AI 代码审查报告 |
| `server.port` | 服务器端口 | 3000 |
| `server.host` | 服务器主机 | 0.0.0.0 |

## 自定义

- **配置文件**：修改`config.json`来调整审查行为
- **提示词**：修改`prompt.md`文件来自定义AI的审查风格（支持热加载，5秒自动刷新）
- **服务扩展**：在`src/services`目录下添加新的服务模块
- **工具函数**：在`src/utils`目录下添加工具函数

## 提示词自定义

项目使用 `prompt.md` 文件管理提示词，支持热加载：

### 提示词文件结构

```markdown
# AI 代码审查提示词

## 系统提示词
[你的系统提示词内容]

## 用户提示词模板
[你的用户提示词模板，支持变量替换：{title}, {description}, {fileList}, {diff}]
```

### 可用变量

- `{title}` - PR标题
- `{description}` - PR描述
- `{fileList}` - 变更文件列表
- `{diff}` - 代码差异内容

### 热加载特性

- 每5秒自动检查并刷新提示词
- 修改 `prompt.md` 后无需重启Bot
- 如果提示词文件不存在或解析失败，会自动使用默认提示词

## 模块化架构

项目采用模块化微服务架构：

1. **配置模块**：统一的配置管理
2. **服务模块**：
   - OpenAI服务：处理AI模型调用
   - GitHub服务：处理GitHub API交互
   - 审查服务：协调审查流程
3. **提示词模块**：可自定义的AI提示词
4. **工具模块**：通用工具函数
5. **模型模块**：数据模型定义

## 许可证

MIT
