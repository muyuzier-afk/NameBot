require('dotenv').config();
const { Probot } = require('probot');
const codeReviewer = require('./src/codeReviewer');

module.exports = (app) => {
  app.log.info('AI PR Review Bot started!');

  app.on(['pull_request.opened', 'pull_request.synchronize'], async (context) => {
    const pullRequest = context.payload.pull_request;
    const repo = context.payload.repository;

    app.log.info(`Processing PR #${pullRequest.number} in ${repo.full_name}`);

    try {
      const review = await codeReviewer.reviewPullRequest(context, pullRequest, repo);
      
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
