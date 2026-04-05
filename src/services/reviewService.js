const OpenAIService = require('./openaiService');
const GitHubService = require('./githubService');
const { loadPrompts } = require('../config');

class ReviewService {
  constructor(config) {
    this.config = config;
    this.lastPromptLoadTime = 0;
    this.prompts = null;
    this.loadPromptsIfNeeded();
  }

  loadPromptsIfNeeded() {
    const now = Date.now();
    const refreshInterval = 5000; // 5秒刷新一次
    
    if (!this.prompts || now - this.lastPromptLoadTime > refreshInterval) {
      try {
        this.prompts = loadPrompts(this.config.review.promptFile);
        this.lastPromptLoadTime = now;
        console.log('Prompts loaded/updated from', this.config.review.promptFile);
      } catch (error) {
        console.error('Failed to load prompts:', error);
      }
    }
  }

  formatUserPrompt(template, pullRequest, files, diff) {
    const fileList = files.map(f => `- ${f.filename} (${f.status}, +${f.additions} -${f.deletions})`).join('\n');
    
    return template
      .replace('{title}', pullRequest.title || '')
      .replace('{description}', pullRequest.body || '无描述')
      .replace('{fileList}', fileList)
      .replace('{diff}', diff);
  }

  async reviewPullRequest(context, pullRequest, repo) {
    console.log('Starting PR review process...');

    // 检查审查是否启用
    if (!this.config.review.enabled) {
      return `## 🔍 代码审查提示\n\n代码审查功能已禁用，请在配置中启用。`;
    }

    // 热加载提示词
    this.loadPromptsIfNeeded();

    // 初始化服务
    const githubService = new GitHubService(context);
    const openaiService = new OpenAIService(this.config);

    try {
      // 1. 获取PR文件
      console.log('Fetching PR files...');
      const files = await githubService.getPullRequestFiles(pullRequest, this.config.review.maxFiles);
      
      // 2. 获取PR差异
      console.log('Fetching PR diff...');
      const diff = await githubService.getPullRequestDiff(pullRequest);

      // 3. 检查变更大小
      const totalChanges = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
      if (totalChanges > this.config.review.maxLines) {
        return this.generateLargeChangeMessage(totalChanges);
      }

      // 4. 生成AI审查
      console.log('Generating AI review...');
      const prompt = {
        system: this.prompts.system,
        user: this.formatUserPrompt(this.prompts.userTemplate, pullRequest, files, diff)
      };

      const review = await openaiService.generateReview(prompt);

      // 5. 生成完整报告
      return this.generateReviewReport(review, files, totalChanges);
    } catch (error) {
      console.error('Error during review:', error);
      return this.generateErrorMessage(error);
    }
  }

  generateLargeChangeMessage(totalChanges) {
    return `## 🔍 代码审查提示\n\n变更行数过多（${totalChanges}行），超过了配置的最大限制（${this.config.review.maxLines}行）。\n\n建议：\n- 拆分PR为多个小PR\n- 增加配置中的maxLines值`;
  }

  generateErrorMessage(error) {
    return `## ⚠️ 审查错误\n\n代码审查过程中出现错误：\n\`\`\`\n${error.message}\n\`\`\`\n\n请检查配置和网络连接。`;
  }

  generateReviewReport(review, files, totalChanges) {
    const header = `## ${this.config.review.commentTitle}\n\n> 由AI自动生成的代码审查意见\n\n---\n\n`;
    
    const stats = `### 📊 变更统计\n\n- 文件数: ${files.length}\n- 变更行数: ${totalChanges}\n- 模型: ${this.config.openai.model}\n- 提示词文件: ${this.config.review.promptFile}\n\n`;
    
    const footer = `\n---\n\n*此报告由AI PR Review Bot自动生成，仅供参考。*\n\n**配置信息**：\n- 最大文件数: ${this.config.review.maxFiles}\n- 最大变更行数: ${this.config.review.maxLines}\n- OpenAI BaseURL: ${this.config.openai.baseURL}`;
    
    return header + stats + review + footer;
  }
}

module.exports = ReviewService;
