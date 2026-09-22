import { fetchWithTimeout } from './aiProviders.mjs';

const GITHUB_REPO = 'LisyanDEWS/LinkerLauncher';
const CACHE_TTL = 30 * 1000; // 30 seconds

let cachedCommits = null;
let cachedBuildInfo = null;
let cacheTime = 0;

export async function fetchGitHubCommits() {
  if (cachedCommits && Date.now() - cacheTime < CACHE_TTL) return cachedCommits;

  const res = await fetchWithTimeout(
    `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=30`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'LinkerRu-Server',
      },
    },
    10000
  );
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

  const commits = await res.json();
  cachedCommits = commits;
  cacheTime = Date.now();
  return commits;
}

function formatBuildDate(dateStr) {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function getBuildInfo() {
  if (cachedBuildInfo && Date.now() - cacheTime < CACHE_TTL) return cachedBuildInfo;

  const commits = await fetchGitHubCommits();
  const latest = commits[0];
  const dateStr = latest?.commit?.author?.date || latest?.commit?.committer?.date || new Date().toISOString();
  cachedBuildInfo = {
    buildVersion: `v${formatBuildDate(dateStr)}`,
    buildDate: formatBuildDate(dateStr),
    sha: latest?.sha?.slice(0, 7) || 'unknown',
  };
  cacheTime = Date.now();
  return cachedBuildInfo;
}

export async function fetchCommitDetail(sha) {
  const res = await fetchWithTimeout(
    `https://api.github.com/repos/${GITHUB_REPO}/commits/${sha}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'LinkerRu-Server',
      },
    },
    10000
  );
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  return await res.json();
}
