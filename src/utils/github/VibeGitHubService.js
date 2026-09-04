/**
 * VibeGitHubService.js
 * Octokit Integration for GitHub Repository
 * Enables repo cloning, branching, commits, PRs
 */

import { useState, useCallback, useRef } from 'react';

// ─── GitHub Client ────────────────────────────────────────────────────────────

export class GitHubClient {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  // ─── Repos ───────────────────────────────────────────────────────────────

  async listRepos() {
    return this.request('/user/repos?per_page=100&sort=updated');
  }

  async getRepo(owner, repo) {
    return this.request(`/repos/${owner}/${repo}`);
  }

  async createRepo(name, description = '', isPrivate = true) {
    return this.request('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true
      })
    });
  }

  async deleteRepo(owner, repo) {
    return this.request(`/repos/${owner}/${repo}`, { method: 'DELETE' });
  }

  // ─── Branches ────────────────────────────────────────────────────────────

  async listBranches(owner, repo) {
    return this.request(`/repos/${owner}/${repo}/branches`);
  }

  async getBranch(owner, repo, branch) {
    return this.request(`/repos/${owner}/${repo}/branches/${branch}`);
  }

  async createBranch(owner, repo, branch, sha) {
    return this.request(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha
      })
    });
  }

  async deleteBranch(owner, repo, branch) {
    return this.request(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'DELETE'
    });
  }

  // ─── Files & Contents ───────────────────────────────────────────────────

  async listContents(owner, repo, path = '') {
    return this.request(`/repos/${owner}/${repo}/contents/${path}`);
  }

  async getFile(owner, repo, path, ref = 'main') {
    const content = await this.request(
      `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
    );
    // Decode base64 content
    if (content.content) {
      content.decodedContent = atob(content.content.replace(/\n/g, ''));
    }
    return content;
  }

  async createFile(owner, repo, path, content, message, branch = 'main') {
    const encoded = btoa(unescape(encodeURIComponent(content)));
    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encoded,
        branch
      })
    });
  }

  async updateFile(owner, repo, path, content, message, sha, branch = 'main') {
    const encoded = btoa(unescape(encodeURIComponent(content)));
    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: encoded,
        sha,
        branch
      })
    });
  }

  async deleteFile(owner, repo, path, message, sha, branch = 'main') {
    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha,
        branch
      })
    });
  }

  // ─── Commits ────────────────────────────────────────────────────────────

  async listCommits(owner, repo, options = {}) {
    const params = new URLSearchParams({
      per_page: options.per_page || 30,
      ...(options.sha && { sha: options.sha }),
      ...(options.since && { since: options.since }),
      ...(options.until && { until: options.until })
    });
    return this.request(`/repos/${owner}/${repo}/commits?${params}`);
  }

  async getCommit(owner, repo, sha) {
    return this.request(`/repos/${owner}/${repo}/commits/${sha}`);
  }

  async createCommit(owner, repo, message, tree, parents) {
    return this.request(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree,
        parents
      })
    });
  }

  // ─── Pull Requests ──────────────────────────────────────────────────────

  async listPRs(owner, repo, options = {}) {
    const params = new URLSearchParams({
      state: options.state || 'open',
      per_page: options.per_page || 30
    });
    return this.request(`/repos/${owner}/${repo}/pulls?${params}`);
  }

  async getPR(owner, repo, number) {
    return this.request(`/repos/${owner}/${repo}/pulls/${number}`);
  }

  async createPR(owner, repo, title, body, head, base = 'main') {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        head,
        base
      })
    });
  }

  async mergePR(owner, repo, number, message = '') {
    return this.request(`/repos/${owner}/${repo}/pulls/${number}/merge`, {
      method: 'PUT',
      body: JSON.stringify({ commit_message: message })
    });
  }

  // ─── Issues ────────────────────────────────────────────────────────────

  async listIssues(owner, repo, options = {}) {
    const params = new URLSearchParams({
      state: options.state || 'open',
      per_page: options.per_page || 30,
      ...(options.labels && { labels: options.labels }),
      ...(options.assignee && { assignee: options.assignee })
    });
    return this.request(`/repos/${owner}/${repo}/issues?${params}`);
  }

  async createIssue(owner, repo, title, body, labels = []) {
    return this.request(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body, labels })
    });
  }

  // ─── Search ────────────────────────────────────────────────────────────

  async searchCode(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      per_page: options.per_page || 30,
      ...(options.page && { page: options.page })
    });
    return this.request(`/search/code?${params}`);
  }

  async searchRepos(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      sort: options.sort || 'stars',
      order: options.order || 'desc',
      per_page: options.per_page || 30
    });
    return this.request(`/search/repositories?${params}`);
  }
}

// ─── Repository Manager ────────────────────────────────────────────────────────

export class VibeRepoManager {
  constructor(client) {
    this.client = client;
    this.currentRepo = null;
    this.currentBranch = 'main';
  }

  async initRepo(owner, repo, branch = 'main') {
    this.currentRepo = { owner, repo };
    this.currentBranch = branch;
    return this.client.getRepo(owner, repo);
  }

  async cloneToLocal() {
    // Get all files recursively
    const files = {};

    const fetchDir = async (path = '') => {
      try {
        const contents = await this.client.listContents(
          this.currentRepo.owner,
          this.currentRepo.repo,
          path
        );

        for (const item of contents) {
          if (item.type === 'file') {
            const file = await this.client.getFile(
              this.currentRepo.owner,
              this.currentRepo.repo,
              item.path,
              this.currentBranch
            );
            files[`/${item.path}`] = file.decodedContent;
          } else if (item.type === 'dir') {
            await fetchDir(item.path);
          }
        }
      } catch (e) {
        // Ignore errors for now
      }
    };

    await fetchDir();
    return files;
  }

  async commit(message, files = {}) {
    // Get current commit SHA
    const commits = await this.client.listCommits(
      this.currentRepo.owner,
      this.currentRepo.repo,
      { sha: this.currentBranch }
    );
    const baseSha = commits[0]?.sha;

    // Create blobs for each file
    const blobs = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        const encoded = btoa(unescape(encodeURIComponent(content)));
        return this.client.request(
          `/repos/${this.currentRepo.owner}/${this.currentRepo.repo}/git/blobs`,
          {
            method: 'POST',
            body: JSON.stringify({ content: encoded })
          }
        );
      })
    );

    // Create tree
    const tree = await this.client.request(
      `/repos/${this.currentRepo.owner}/${this.currentRepo.repo}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseSha,
          tree: Object.keys(files).map((path, i) => ({
            path: path.replace(/^\//, ''),
            mode: '100644',
            type: 'blob',
            sha: blobs[i].sha
          }))
        })
      }
    );

    // Create commit
    const commit = await this.client.createCommit(
      this.currentRepo.owner,
      this.currentRepo.repo,
      message,
      tree.sha,
      baseSha ? [baseSha] : []
    );

    // Update branch ref
    await this.client.request(
      `/repos/${this.currentRepo.owner}/${this.currentRepo.repo}/git/refs/heads/${this.currentBranch}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha })
      }
    );

    return commit;
  }

  async createBranchAndCommit(message, files = {}, newBranchName) {
    // Get current HEAD SHA
    const branch = await this.client.getBranch(
      this.currentRepo.owner,
      this.currentRepo.repo,
      this.currentBranch
    );

    // Create new branch
    await this.client.createBranch(
      this.currentRepo.owner,
      this.currentRepo.repo,
      newBranchName,
      branch.commit.sha
    );

    // Switch to new branch
    this.currentBranch = newBranchName;

    // Commit files
    return this.commit(message, files);
  }
}

// ─── React Hook ────────────────────────────────────────────────────────────────

export function useGitHub() {
  const [client, setClient] = useState(null);
  const [repoManager, setRepoManager] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repos, setRepos] = useState([]);

  const init = useCallback((token) => {
    const ghClient = new GitHubClient(token);
    const manager = new VibeRepoManager(ghClient);
    setClient(ghClient);
    setRepoManager(manager);
    return manager;
  }, []);

  const loadRepos = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    setError(null);
    try {
      const userRepos = await client.listRepos();
      setRepos(userRepos);
      return userRepos;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return {
    client,
    repoManager,
    isLoading,
    error,
    repos,
    init,
    loadRepos
  };
}

// ─── GitHub Panel Component ──────────────────────────────────────────────────

export function GitHubPanel({ token, onClose }) {
  const { client, repos, isLoading, error, init, loadRepos } = useGitHub();

  useState(() => {
    if (token) {
      init(token);
      loadRepos();
    }
  }, [token]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        width: '500px',
        maxHeight: '600px',
        backgroundColor: '#0d1117',
        borderRadius: '12px',
        border: '1px solid #30363d',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #30363d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <span style={{ color: '#fff', fontWeight: 600 }}>GitHub</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', color: '#8b949e', padding: '40px' }}>
              Loading repositories...
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#f85149/20',
              borderRadius: '6px',
              color: '#f85149',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {repos.map(repo => (
            <div
              key={repo.id}
              style={{
                padding: '12px',
                backgroundColor: '#161b22',
                borderRadius: '6px',
                marginBottom: '8px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#21262d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#161b22'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fff', fontWeight: 500 }}>{repo.name}</span>
                {repo.private && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: '#30363d',
                    borderRadius: '10px',
                    color: '#8b949e'
                  }}>
                    Private
                  </span>
                )}
              </div>
              <div style={{ color: '#8b949e', fontSize: '12px', marginTop: '4px' }}>
                {repo.description || 'No description'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default {
  GitHubClient,
  VibeRepoManager,
  useGitHub,
  GitHubPanel
};
