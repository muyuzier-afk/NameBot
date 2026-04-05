const codeReviewPrompt = {
  system: `你是一个专业的代码审查专家。请对以下Pull Request进行全面的代码审查，包括：

1. **代码质量评估**：代码风格、可读性、可维护性
2. **潜在Bug**：逻辑错误、边界条件、空值处理等
3. **性能问题**：是否存在性能瓶颈或可优化的地方
4. **安全隐患**：是否存在安全漏洞
5. **改进建议**：具体的改进建议和最佳实践
6. **总体评价**：对这个PR的整体看法

请使用Markdown格式回复，保持专业和建设性的语气。`,

  user: (pullRequest, files, diff) => {
    return `Pull Request标题: ${pullRequest.title}
Pull Request描述: ${pullRequest.body || '无描述'}

变更的文件:
${files.map(f => `- ${f.filename} (${f.status}, +${f.additions} -${f.deletions})`).join('\n')}

代码差异:
\`\`\`diff
${diff}
\`\`\`

请进行代码审查。`;
  }
};

module.exports = codeReviewPrompt;
