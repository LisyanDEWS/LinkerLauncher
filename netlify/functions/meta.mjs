import { jsonResponse, preflightResponse } from '../lib/aiProviders.mjs';
import { fetchCommitDetail, fetchGitHubCommits, getBuildInfo } from '../lib/github.mjs';

export const config = {
  path: ['/api/build-info', '/api/changelog', '/api/changelog/commit/:sha'],
  method: ['GET', 'OPTIONS'],
};

export default async (req, context) => {
  if (req.method === 'OPTIONS') return preflightResponse();

  const pathname = new URL(req.url).pathname;

  if (pathname === '/api/build-info') {
    try {
      return jsonResponse(200, await getBuildInfo());
    } catch {
      return jsonResponse(200, { buildVersion: 'v--', buildDate: '--', sha: 'unknown' });
    }
  }

  const sha = context?.params?.sha;
  if (sha) {
    try {
      return jsonResponse(200, await fetchCommitDetail(sha));
    } catch {
      return jsonResponse(500, { error: 'Failed to fetch commit detail' });
    }
  }

  try {
    return jsonResponse(200, await fetchGitHubCommits());
  } catch {
    return jsonResponse(500, { error: 'Failed to fetch commits' });
  }
};
