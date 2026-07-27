export async function triggerFrontendRebuild(reason: string) {
  const token = process.env.GITHUB_REBUILD_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const workflow = process.env.GITHUB_WORKFLOW_FILE ?? "deploy.yml";

  if (!token || !repository) {
    return { triggered: false, reason: "GitHub rebuild integration is not configured" };
  }

  const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "master", inputs: { reason } }),
  });

  if (!response.ok) {
    const message = await response.text();
    return { triggered: false, reason: `GitHub API ${response.status}: ${message.slice(0, 300)}` };
  }

  return { triggered: true };
}
