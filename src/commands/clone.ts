import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import * as path from 'path';
import { loadConfig, findAccount } from '../utils/config';
import { setGitConfigLocal, setRepoAlias, convertRemoteToAlias } from '../utils/git';

export async function cloneCommand(repoUrl?: string): Promise<void> {
  const config = loadConfig();

  if (config.accounts.length === 0) {
    console.log(chalk.yellow('\nNo accounts found. Use "ghml add" to add one.\n'));
    return;
  }

  // Get repo URL if not provided
  if (!repoUrl) {
    const { url } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Repository URL (HTTPS or SSH):',
        validate: (input: string) => {
          if (!input.trim()) return 'URL is required';
          if (!input.includes('github.com')) return 'Only GitHub URLs are supported';
          return true;
        },
      },
    ]);
    repoUrl = url;
  }

  // Select account
  const { alias } = await inquirer.prompt([
    {
      type: 'list',
      name: 'alias',
      message: 'Clone with which account?',
      choices: config.accounts.map((a) => ({
        name: `${a.alias === config.active ? '* ' : '  '}${a.alias} (${a.username}) - ${a.email}`,
        value: a.alias,
      })),
    },
  ]);

  const account = findAccount(alias);
  if (!account) {
    console.error(chalk.red(`Account "${alias}" not found.`));
    process.exit(1);
    return;
  }

  // Convert URL to SSH alias format
  const sshUrl = convertRemoteToAlias(repoUrl!, alias);
  if (!sshUrl) {
    console.error(chalk.red(`Could not convert URL: ${repoUrl}`));
    console.error(chalk.gray('Supported formats: https://github.com/user/repo.git or git@github.com:user/repo.git'));
    process.exit(1);
    return;
  }

  // Extract repo name for directory
  const repoName = extractRepoName(repoUrl!);

  console.log(chalk.yellow(`\nCloning with account "${alias}"...`));
  console.log(chalk.gray(`URL: ${sshUrl}`));
  console.log(chalk.gray(`Dir: ./${repoName}\n`));

  try {
    // Clone the repo
    execSync(`git clone ${sshUrl}`, { stdio: 'inherit' });

    // Configure the cloned repo
    const repoPath = path.resolve(process.cwd(), repoName);

    // Set local git config
    execSync(`git config user.name "${account.username}"`, { cwd: repoPath, stdio: 'pipe' });
    execSync(`git config user.email "${account.email}"`, { cwd: repoPath, stdio: 'pipe' });

    // Write .ghml file
    const fs = require('fs');
    fs.writeFileSync(path.join(repoPath, '.ghml'), alias + '\n', 'utf-8');

    console.log(chalk.green(`\nCloned and configured with account "${alias}"!`));
    console.log(chalk.gray(`  User: ${account.username} <${account.email}>`));
    console.log(chalk.gray(`  SSH:  github-${alias}\n`));
  } catch (err: any) {
    console.error(chalk.red(`\nClone failed. Make sure the SSH key is added to GitHub.`));
    console.error(chalk.gray(`Run: ssh -T git@github-${alias}`));
    process.exit(1);
  }
}

function extractRepoName(url: string): string {
  // git@github.com:user/repo.git → repo
  // https://github.com/user/repo.git → repo
  // git@github-alias:user/repo.git → repo
  const match = url.match(/\/([^/]+?)(?:\.git)?$/) || url.match(/:([^/]+\/)?([^/]+?)(?:\.git)?$/);
  if (match) {
    const name = match[2] || match[1];
    return name.replace(/\.git$/, '').replace(/\/$/, '');
  }
  return 'repo';
}
