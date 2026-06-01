import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export function setGitConfigGlobal(username: string, email: string): void {
  execSync(`git config --global user.name "${username}"`, { stdio: 'pipe' });
  execSync(`git config --global user.email "${email}"`, { stdio: 'pipe' });
}

export function setGitConfigLocal(username: string, email: string): void {
  execSync(`git config user.name "${username}"`, { stdio: 'pipe' });
  execSync(`git config user.email "${email}"`, { stdio: 'pipe' });
}

export function getRepoRoot(): string | null {
  try {
    const root = execSync('git rev-parse --show-toplevel', { stdio: 'pipe' })
      .toString()
      .trim();
    return root;
  } catch {
    return null;
  }
}

export function getRemoteUrl(): string | null {
  try {
    const url = execSync('git remote get-url origin', { stdio: 'pipe' })
      .toString()
      .trim();
    return url;
  } catch {
    return null;
  }
}

export function setRemoteUrl(url: string): void {
  execSync(`git remote set-url origin "${url}"`, { stdio: 'pipe' });
}

/**
 * Convert a GitHub remote URL to use the SSH alias for a specific account.
 * e.g., git@github.com:user/repo.git → git@github-work:user/repo.git
 */
export function convertRemoteToAlias(remoteUrl: string, alias: string): string | null {
  // Handle SSH format: git@github.com:user/repo.git
  const sshMatch = remoteUrl.match(/^git@github\.com:(.+)$/);
  if (sshMatch) {
    return `git@github-${alias}:${sshMatch[1]}`;
  }

  // Handle HTTPS format: https://github.com/user/repo.git
  const httpsMatch = remoteUrl.match(/^https:\/\/github\.com\/(.+)$/);
  if (httpsMatch) {
    return `git@github-${alias}:${httpsMatch[1]}`;
  }

  // Handle already-aliased format: git@github-xxx:user/repo.git
  const aliasMatch = remoteUrl.match(/^git@github-[^:]+:(.+)$/);
  if (aliasMatch) {
    return `git@github-${alias}:${aliasMatch[1]}`;
  }

  return null;
}

/**
 * Read the .ghml file in the repo root to get the per-repo account alias.
 */
export function getRepoAlias(): string | null {
  const root = getRepoRoot();
  if (!root) return null;

  const ghmlFile = path.join(root, '.ghml');
  if (!fs.existsSync(ghmlFile)) return null;

  return fs.readFileSync(ghmlFile, 'utf-8').trim();
}

/**
 * Write the .ghml file in the repo root to set the per-repo account alias.
 */
export function setRepoAlias(alias: string): void {
  const root = getRepoRoot();
  if (!root) throw new Error('Not inside a git repository');

  const ghmlFile = path.join(root, '.ghml');
  fs.writeFileSync(ghmlFile, alias + '\n', 'utf-8');
}
