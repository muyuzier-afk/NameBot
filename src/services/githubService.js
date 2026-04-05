class GitHubService {
  constructor(context) {
    this.context = context;
    this.octokit = context.octokit;
  }

  async getPullRequestDiff(pullRequest) {
    const { data: diff } = await this.octokit.repos.compareCommits({
      owner: this.context.payload.repository.owner.login,
      repo: this.context.payload.repository.name,
      base: pullRequest.base.sha,
      head: pullRequest.head.sha,
      headers: {
        accept: 'application/vnd.github.v3.diff'
      }
    });
    return diff;
  }

  async getPullRequestFiles(pullRequest, maxFiles = 20) {
    const { data: files } = await this.octokit.pulls.listFiles({
      owner: this.context.payload.repository.owner.login,
      repo: this.context.payload.repository.name,
      pull_number: pullRequest.number
    });
    
    if (files.length > maxFiles) {
      return files.slice(0, maxFiles);
    }
    return files;
  }

  async createComment(issue, body) {
    return this.octokit.issues.createComment({
      owner: this.context.payload.repository.owner.login,
      repo: this.context.payload.repository.name,
      issue_number: issue.number,
      body
    });
  }

  async getPullRequestDetails(pullRequest) {
    const { data } = await this.octokit.pulls.get({
      owner: this.context.payload.repository.owner.login,
      repo: this.context.payload.repository.name,
      pull_number: pullRequest.number
    });
    return data;
  }
}

module.exports = GitHubService;
