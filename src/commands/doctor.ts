import chalk from 'chalk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig } from '../utils/config';

interface CheckResult {
  label: string;
  status: 'ok' | 'warn' | 'fail';
  message: string;
}

export async function doctorCommand(): Promise<void> {
  const config = loadConfig();

  console.log(chalk.cyan('\n--- ghml doctor ---\n'));

  if (config.accounts.length === 0) {
    console.log(chalk.yellow('No accounts configured. Use "ghml add" to add one.\n'));
    return;
  }

  const results: CheckResult[] = [];

  for (const account of config.accounts) {
    // Check SSH private key exists
    const keyPath = account.sshKeyPath;
    const resolvedKeyPath = keyPath.replace('~', os.homedir());
    if (fs.existsSync(resolvedKeyPath)) {
      results.push({
        label: `[${account.alias}] SSH private key`,
        status: 'ok',
        message: keyPath,
      });
    } else {
      results.push({
        label: `[${account.alias}] SSH private key`,
        status: 'fail',
        message: `Not found: ${keyPath}`,
      });
    }

    // Check SSH public key exists
    const pubKeyPath = resolvedKeyPath + '.pub';
    if (fs.existsSync(pubKeyPath)) {
      results.push({
        label: `[${account.alias}] SSH public key`,
        status: 'ok',
        message: keyPath + '.pub',
      });
    } else {
      results.push({
        label: `[${account.alias}] SSH public key`,
        status: 'fail',
        message: `Not found: ${keyPath}.pub`,
      });
    }

    // Check SSH config entry exists
    const sshConfigPath = path.join(os.homedir(), '.ssh', 'config');
    if (fs.existsSync(sshConfigPath)) {
      const sshConfig = fs.readFileSync(sshConfigPath, 'utf-8');
      if (sshConfig.includes(`Host github-${account.alias}`)) {
        results.push({
          label: `[${account.alias}] SSH config entry`,
          status: 'ok',
          message: `Host github-${account.alias}`,
        });
      } else {
        results.push({
          label: `[${account.alias}] SSH config entry`,
          status: 'fail',
          message: `Missing Host github-${account.alias} in ~/.ssh/config`,
        });
      }
    } else {
      results.push({
        label: `[${account.alias}] SSH config`,
        status: 'fail',
        message: '~/.ssh/config not found',
      });
    }

    // Test SSH connection
    try {
      const output = execSync(
        `ssh -T -o StrictHostKeyChecking=no -o ConnectTimeout=5 git@github-${account.alias} 2>&1`,
        { stdio: 'pipe', timeout: 10000 }
      ).toString();

      if (output.includes('successfully authenticated')) {
        results.push({
          label: `[${account.alias}] SSH connection`,
          status: 'ok',
          message: 'Authenticated',
        });
      } else {
        results.push({
          label: `[${account.alias}] SSH connection`,
          status: 'warn',
          message: output.trim().substring(0, 80),
        });
      }
    } catch (err: any) {
      const output = err.stdout?.toString() || err.stderr?.toString() || '';
      if (output.includes('successfully authenticated')) {
        results.push({
          label: `[${account.alias}] SSH connection`,
          status: 'ok',
          message: 'Authenticated',
        });
      } else if (output.includes('Permission denied')) {
        results.push({
          label: `[${account.alias}] SSH connection`,
          status: 'fail',
          message: 'Permission denied - key not added to GitHub?',
        });
      } else {
        results.push({
          label: `[${account.alias}] SSH connection`,
          status: 'warn',
          message: output.trim().substring(0, 80) || 'Connection failed',
        });
      }
    }
  }

  // Check git is installed
  try {
    const gitVersion = execSync('git --version', { stdio: 'pipe' }).toString().trim();
    results.push({ label: 'Git installed', status: 'ok', message: gitVersion });
  } catch {
    results.push({ label: 'Git installed', status: 'fail', message: 'git not found in PATH' });
  }

  // Check ssh-keygen is available
  try {
    execSync('ssh-keygen -h', { stdio: 'pipe' });
    results.push({ label: 'ssh-keygen available', status: 'ok', message: 'Available' });
  } catch {
    results.push({ label: 'ssh-keygen available', status: 'fail', message: 'ssh-keygen not found' });
  }

  // Print results
  for (const r of results) {
    const icon = r.status === 'ok' ? chalk.green('[OK]  ')
      : r.status === 'warn' ? chalk.yellow('[WARN]')
      : chalk.red('[FAIL]');
    const msg = r.status === 'ok' ? chalk.gray(r.message)
      : r.status === 'warn' ? chalk.yellow(r.message)
      : chalk.red(r.message);
    console.log(`${icon} ${chalk.white(r.label)} - ${msg}`);
  }

  const failCount = results.filter((r) => r.status === 'fail').length;
  const warnCount = results.filter((r) => r.status === 'warn').length;

  console.log('');
  if (failCount === 0 && warnCount === 0) {
    console.log(chalk.green('All checks passed!\n'));
  } else {
    if (failCount > 0) console.log(chalk.red(`${failCount} check(s) failed.`));
    if (warnCount > 0) console.log(chalk.yellow(`${warnCount} warning(s).`));
    console.log('');
  }
}
