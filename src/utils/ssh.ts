import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const SSH_DIR = path.join(os.homedir(), '.ssh');
const SSH_CONFIG = path.join(SSH_DIR, 'config');

const GHML_MARKER_START = (alias: string) => `# ghml-start: ${alias}`;
const GHML_MARKER_END = (alias: string) => `# ghml-end: ${alias}`;

function ensureSshDir(): void {
  if (!fs.existsSync(SSH_DIR)) {
    fs.mkdirSync(SSH_DIR, { recursive: true, mode: 0o700 });
  }
}

export function generateSshKey(alias: string, email: string): string {
  ensureSshDir();
  const keyPath = path.join(SSH_DIR, `ghml_${alias}`);

  if (fs.existsSync(keyPath)) {
    throw new Error(`SSH key already exists at ${keyPath}`);
  }

  execSync(
    `ssh-keygen -t ed25519 -C "${email}" -f "${keyPath}" -N ""`,
    { stdio: 'pipe' }
  );

  return keyPath;
}

export function getSshPublicKey(alias: string): string {
  const pubKeyPath = path.join(SSH_DIR, `ghml_${alias}.pub`);
  if (!fs.existsSync(pubKeyPath)) {
    throw new Error(`Public key not found: ${pubKeyPath}`);
  }
  return fs.readFileSync(pubKeyPath, 'utf-8').trim();
}

export function addSshConfig(alias: string, keyPath: string): void {
  ensureSshDir();

  const entry = [
    '',
    GHML_MARKER_START(alias),
    `Host github-${alias}`,
    `  HostName github.com`,
    `  User git`,
    `  IdentityFile ${keyPath}`,
    `  IdentitiesOnly yes`,
    GHML_MARKER_END(alias),
    '',
  ].join('\n');

  let existingConfig = '';
  if (fs.existsSync(SSH_CONFIG)) {
    existingConfig = fs.readFileSync(SSH_CONFIG, 'utf-8');
  }

  // Check if entry already exists
  if (existingConfig.includes(GHML_MARKER_START(alias))) {
    return; // Already configured
  }

  fs.writeFileSync(SSH_CONFIG, existingConfig + entry, 'utf-8');
}

export function removeSshConfig(alias: string): void {
  if (!fs.existsSync(SSH_CONFIG)) return;

  const content = fs.readFileSync(SSH_CONFIG, 'utf-8');
  const lines = content.split('\n');
  const filtered: string[] = [];
  let skipping = false;

  for (const line of lines) {
    if (line.trim() === GHML_MARKER_START(alias)) {
      skipping = true;
      continue;
    }
    if (line.trim() === GHML_MARKER_END(alias)) {
      skipping = false;
      continue;
    }
    if (!skipping) {
      filtered.push(line);
    }
  }

  // Clean up extra blank lines
  const cleaned = filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  fs.writeFileSync(SSH_CONFIG, cleaned, 'utf-8');
}

export function removeSshKey(alias: string): void {
  const keyPath = path.join(SSH_DIR, `ghml_${alias}`);
  const pubKeyPath = path.join(SSH_DIR, `ghml_${alias}.pub`);

  if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
  if (fs.existsSync(pubKeyPath)) fs.unlinkSync(pubKeyPath);
}
