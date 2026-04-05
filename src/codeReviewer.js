const OpenAI = require('openai');

class CodeReviewer {
  constructor(config) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }

  async getPullRequestDiff(context, pullRequest) {
    const { data: diff } = await context.octokit.repos.compareCommits({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      base: pullRequest.base.sha,
      head: pullRequest.head.sha,
      headers: {
        accept: 'application/vnd.github.v3.diff'
      }
    });
    return diff;
  }

  async getPullRequestFiles(context, pullRequest) {
    const { data: files } = await context.octokit.pulls.listFiles({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      pull_number: pullRequest.number
    });
    
    // 限制文件数量
    if (files.length > this.config.review.maxFiles) {
      return files.slice(0, this.config.review.maxFiles);
    }
    return files;
  }

  async reviewCodeWithAI(diff, files, pullRequest) {
    // 计算变更行数
    const totalChanges = files.reduce((sum, file) => sum + file.additions + file.deletions, 0);
    if (totalChanges > this.config.review.maxLines) {
      return `## 🔍 代码审查提示\n\n变更行数过多（${totalChanges}行），超过了配置的最大限制（${this.config.review.maxLines}行）。\n\n建议：\n- 拆分PR为多个小PR\n- 增加配置中的maxLines值`;
    }

    const systemPrompt = `你是一个专业的代码审查专家。请对以下Pull Request进行全面的代码审查，包括：

1. **代码质量评估**：代码风格、可读性、可维护性
2. **潜在Bug**：逻辑错误、边界条件、空值处理等
3. **性能问题**：是否存在性能瓶颈或可优化的地方
4. **安全隐患**：是否存在安全漏洞
5. **改进建议**：具体的改进建议和最佳实践
6. **总体评价**：对这个PR的整体看法

请使用Markdown格式回复，保持专业和建设性的语气。`;

    const userPrompt = `Pull Request标题: ${pullRequest.title}
Pull Request描述: ${pullRequest.body || '无描述'}

变更的文件:
${files.map(f => `- ${f.filename} (${f.status}, +${f.additions} -${f.deletions})`).join('\n')}

代码差异:
\`\`\`diff
${diff}
\`\`\`

请进行代码审查。`;

    const response = await this.openai.chat.completions.create({
      model: this.config.openai.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  }

  async reviewPullRequest(context, pullRequest, repo, config) {
    console.log('Fetching PR diff...');
    const diff = await this.getPullRequestDiff(context, pullRequest);
    
    console.log('Fetching PR files...');
    const files = await this.getPullRequestFiles(context, pullRequest);
    
    console.log('Reviewing code with AI...');
    const review = await this.reviewCodeWithAI(diff, files, pullRequest);
    
    const header = `## ${this.config.review.commentTitle}\n\n> 由AI自动生成的代码审查意见\n\n---\n\n`;
    const footer = `\n---\n\n*此报告由AI PR Review Bot自动生成，仅供参考。*\n\n**配置信息**：\n- 模型: ${this.config.openai.model}\n- 最大文件数: ${this.config.review.maxFiles}\n- 最大变更行数: ${this.config.review.maxLines}`;
    
    return header + review + footer;
  }
}

async function reviewPullRequest(context, pullRequest, repo, config) {
  const reviewer = new CodeReviewer(config);
  return reviewer.reviewPullRequest(context, pullRequest, repo, config);
}

module.exports = {
  reviewPullRequest,
  CodeReviewer
};
