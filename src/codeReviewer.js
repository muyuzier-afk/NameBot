const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getPullRequestDiff(context, pullRequest) {
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

async function getPullRequestFiles(context, pullRequest) {
  const { data: files } = await context.octokit.pulls.listFiles({
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    pull_number: pullRequest.number
  });
  
  return files;
}

async function reviewCodeWithAI(diff, files, pullRequest) {
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

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });

  return response.choices[0].message.content;
}

async function reviewPullRequest(context, pullRequest, repo) {
  console.log('Fetching PR diff...');
  const diff = await getPullRequestDiff(context, pullRequest);
  
  console.log('Fetching PR files...');
  const files = await getPullRequestFiles(context, pullRequest);
  
  console.log('Reviewing code with AI...');
  const review = await reviewCodeWithAI(diff, files, pullRequest);
  
  const header = `## 🤖 AI 代码审查报告\n\n> 由AI自动生成的代码审查意见\n\n---\n\n`;
  const footer = `\n---\n\n*此报告由AI PR Review Bot自动生成，仅供参考。*`;
  
  return header + review + footer;
}

module.exports = {
  reviewPullRequest
};
