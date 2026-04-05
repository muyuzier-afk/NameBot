const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '../../config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  // 从环境变量加载
  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    },
    github: {
      appId: process.env.APP_ID || '',
      privateKey: process.env.PRIVATE_KEY || '',
      webhookSecret: process.env.WEBHOOK_SECRET || ''
    },
    review: {
      enabled: process.env.REVIEW_ENABLED === 'false' ? false : true,
      maxFiles: parseInt(process.env.REVIEW_MAX_FILES) || 20,
      maxLines: parseInt(process.env.REVIEW_MAX_LINES) || 10000,
      commentTitle: process.env.REVIEW_COMMENT_TITLE || '🤖 AI 代码审查报告'
    },
    server: {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0'
    }
  };
}

const config = loadConfig();

module.exports = {
  config,
  loadConfig
};
