const { Probot } = require('probot');
const codeReviewer = require('./src/codeReviewer');
const fs = require('fs');
const path = require('path');

// 配置管理
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  // 从环境变量加载
  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4'
    },
    github: {
      appId: process.env.APP_ID || '',
      privateKey: process.env.PRIVATE_KEY || '',
      webhookSecret: process.env.WEBHOOK_SECRET || ''
    },
    review: {
      enabled: true,
      maxFiles: 20,
      maxLines: 10000,
      commentTitle: '🤖 AI 代码审查报告'
    }
  };
}

const config = loadConfig();

module.exports = (app) => {
  app.log.info('AI PR Review Bot started!');
  app.log.info('Configuration loaded:', {
    openaiModel: config.openai.model,
    reviewEnabled: config.review.enabled,
    maxFiles: config.review.maxFiles
  });

  app.on(['pull_request.opened', 'pull_request.synchronize'], async (context) => {
    const pullRequest = context.payload.pull_request;
    const repo = context.payload.repository;

    app.log.info(`Processing PR #${pullRequest.number} in ${repo.full_name}`);

    try {
      const review = await codeReviewer.reviewPullRequest(context, pullRequest, repo, config);
      
      const comment = context.issue({
        body: review
      });

      await context.octokit.issues.createComment(comment);
      app.log.info(`Review posted for PR #${pullRequest.number}`);
    } catch (error) {
      app.log.error('Error reviewing PR:', error);
      const errorComment = context.issue({
        body: `抱歉，代码审查过程中出现错误：\n\`\`\`\n${error.message}\n\`\`\``
      });
      await context.octokit.issues.createComment(errorComment);
    }
  });
};

if (require.main === module) {
  Probot.run(module.exports);
}
