const OpenAIService = require('./openaiService');
const GitHubService = require('./githubService');
const codeReviewPrompt = require('../prompts/codeReview');

class ReviewService {
  constructor(config) {
    this.config = config;
  }

  async reviewPullRequest(context, pullRequest, repo) {
    console.log('Starting PR review process...');

    // 检查审查是否启用
    if (!this.config.review.enabled) {
      return `## 🔍 代码审查提示\n\n代码审查功能已禁用，请在配置中启用。`;
    }

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
        system: codeReviewPrompt.system,
        user: codeReviewPrompt.user(pullRequest, files, diff)
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
    
    const stats = `### 📊 变更统计\n\n- 文件数: ${files.length}\n- 变更行数: ${totalChanges}\n- 模型: ${this.config.openai.model}\n\n`;
    
    const footer = `\n---\n\n*此报告由AI PR Review Bot自动生成，仅供参考。*\n\n**配置信息**：\n- 最大文件数: ${this.config.review.maxFiles}\n- 最大变更行数: ${this.config.review.maxLines}\n- OpenAI BaseURL: ${this.config.openai.baseURL}`;
    
    return header + stats + review + footer;
  }
}

module.exports = ReviewService;
