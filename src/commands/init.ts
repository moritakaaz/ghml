import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadConfig, findAccount } from '../utils/config';
import {
  getRepoRoot,
  getRemoteUrl,
  setRemoteUrl,
  convertRemoteToAlias,
  setGitConfigLocal,
  setRepoAlias,
} from '../utils/git';

export async function initCommand(): Promise<void> {
  const repoRoot = getRepoRoot();

  if (!repoRoot) {
    console.error(chalk.red('\nError: Not inside a git repository.\n'));
    process.exit(1);
    return;
  }

  const config = loadConfig();

  if (config.accounts.length === 0) {
    console.log(chalk.yellow('\nNo accounts found. Use "ghml add" to add one.\n'));
    return;
  }

  console.log(chalk.cyan(`\n--- Init repo: ${repoRoot} ---\n`));

  const { alias } = await inquirer.prompt([
    {
      type: 'list',
      name: 'alias',
      message: 'Select account for this repo:',
      choices: config.accounts.map((a) => ({
        name: `${a.alias} (${a.username}) - ${a.email}`,
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

  // Set local git config
  setGitConfigLocal(account.username, account.email);
  console.log(chalk.green(`Local git config set: ${account.username} <${account.email}>`));

  // Update remote URL to use SSH alias
  const remoteUrl = getRemoteUrl();
  if (remoteUrl) {
    const newUrl = convertRemoteToAlias(remoteUrl, alias);
    if (newUrl) {
      setRemoteUrl(newUrl);
      console.log(chalk.green(`Remote URL updated: ${newUrl}`));
    } else {
      console.log(chalk.yellow(`Could not convert remote URL: ${remoteUrl}`));
      console.log(chalk.yellow(`You may need to manually set it to: git@github-${alias}:<user>/<repo>.git`));
    }
  } else {
    console.log(chalk.yellow('No remote "origin" found. Remote URL not updated.'));
  }

  // Write .ghml file in repo root
  setRepoAlias(alias);
  console.log(chalk.green(`Repo marker saved: .ghml`));

  console.log(chalk.green(`\nRepo initialized with account "${alias}"!`));
  console.log(chalk.gray('This repo will always use this account regardless of global switch.\n'));
}
