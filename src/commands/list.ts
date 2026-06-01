import chalk from 'chalk';
import { loadConfig } from '../utils/config';
import { getRepoAlias } from '../utils/git';

export function listCommand(): void {
  const config = loadConfig();

  if (config.accounts.length === 0) {
    console.log(chalk.yellow('\nNo accounts found. Use "ghml add" to add one.\n'));
    return;
  }

  const repoAlias = getRepoAlias();

  console.log(chalk.cyan('\n--- GitHub Accounts ---\n'));

  for (const account of config.accounts) {
    const isGlobalActive = account.alias === config.active;
    const isRepoActive = account.alias === repoAlias;

    let prefix = '  ';
    let suffix = '';

    if (isRepoActive) {
      prefix = chalk.green('* ');
      suffix = chalk.green(' [repo]');
    } else if (isGlobalActive) {
      prefix = chalk.blue('* ');
      suffix = chalk.blue(' [global]');
    }

    console.log(
      `${prefix}${chalk.white(account.alias)} (${account.username}) - ${account.email}${suffix}`
    );
  }

  console.log('');

  if (repoAlias) {
    console.log(chalk.gray(`Repo account: ${repoAlias}`));
  }
  if (config.active) {
    console.log(chalk.gray(`Global active: ${config.active}`));
  }
  console.log('');
}
