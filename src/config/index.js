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
      commentTitle: process.env.REVIEW_COMMENT_TITLE || '🤖 AI 代码审查报告',
      promptFile: process.env.PROMPT_FILE || 'prompt.md'
    },
    server: {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0'
    }
  };
}

function loadPrompts(promptFile = 'prompt.md') {
  const promptPath = path.join(__dirname, '../../', promptFile);
  
  if (!fs.existsSync(promptPath)) {
    console.warn(`Prompt file ${promptFile} not found, using default prompts`);
    return {
      system: getDefaultSystemPrompt(),
      userTemplate: getDefaultUserTemplate()
    };
  }
  
  try {
    const content = fs.readFileSync(promptPath, 'utf8');
    return parsePromptFile(content);
  } catch (error) {
    console.error(`Error loading prompt file: ${error.message}`);
    return {
      system: getDefaultSystemPrompt(),
      userTemplate: getDefaultUserTemplate()
    };
  }
}

function parsePromptFile(content) {
  const lines = content.split('\n');
  let systemPrompt = '';
  let userTemplate = '';
  let currentSection = null;
  
  for (let line of lines) {
    if (line.trim() === '## 系统提示词') {
      currentSection = 'system';
      continue;
    }
    if (line.trim() === '## 用户提示词模板') {
      currentSection = 'user';
      continue;
    }
    if (line.startsWith('#') && currentSection) {
      continue;
    }
    
    if (currentSection === 'system') {
      systemPrompt += line + '\n';
    } else if (currentSection === 'user') {
      userTemplate += line + '\n';
    }
  }
  
  return {
    system: systemPrompt.trim(),
    userTemplate: userTemplate.trim()
  };
}

function getDefaultSystemPrompt() {
  return `你是一个专业的代码审查专家。请对以下Pull Request进行全面的代码审查，包括：

1. **代码质量评估**：代码风格、可读性、可维护性
2. **潜在Bug**：逻辑错误、边界条件、空值处理等
3. **性能问题**：是否存在性能瓶颈或可优化的地方
4. **安全隐患**：是否存在安全漏洞
5. **改进建议**：具体的改进建议和最佳实践
6. **总体评价**：对这个PR的整体看法

请使用Markdown格式回复，保持专业和建设性的语气。`;
}

function getDefaultUserTemplate() {
  return `Pull Request标题: {title}
Pull Request描述: {description}

变更的文件:
{fileList}

代码差异:
\`\`\`diff
{diff}
\`\`\`

请进行代码审查。`;
}

const config = loadConfig();
const prompts = loadPrompts(config.review.promptFile);

module.exports = {
  config,
  prompts,
  loadConfig,
  loadPrompts
};
