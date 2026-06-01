import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadConfig, setActive, findAccount } from '../utils/config';
import { setGitConfigGlobal } from '../utils/git';

export async function switchCommand(): Promise<void> {
  const config = loadConfig();

  if (config.accounts.length === 0) {
    console.log(chalk.yellow('\nNo accounts found. Use "ghml add" to add one.\n'));
    return;
  }

  const { alias } = await inquirer.prompt([
    {
      type: 'list',
      name: 'alias',
      message: 'Switch to account:',
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

  // Set as active
  setActive(alias);

  // Update global git config
  setGitConfigGlobal(account.username, account.email);

  console.log(chalk.green(`\nSwitched to: ${account.alias} (${account.username})`));
  console.log(chalk.gray(`Global git config updated: ${account.username} <${account.email}>`));
  console.log(chalk.gray(`\nTip: Use "ghml init" inside a repo to set per-repo config.\n`));
}
