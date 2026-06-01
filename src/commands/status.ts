import chalk from 'chalk';
import { loadConfig, getActive } from '../utils/config';
import { getRepoRoot, getRepoAlias, getRemoteUrl } from '../utils/git';

export function statusCommand(): void {
  const config = loadConfig();

  if (config.accounts.length === 0) {
    console.log(chalk.yellow('\nNo accounts configured. Use "ghml add" to add one.\n'));
    return;
  }

  console.log(chalk.cyan('\n--- ghml status ---\n'));

  // Global active
  const globalActive = getActive();
  if (globalActive) {
    console.log(chalk.white(`Global : ${chalk.green(globalActive.alias)} (${globalActive.username}) - ${globalActive.email}`));
  } else {
    console.log(chalk.white(`Global : ${chalk.yellow('none')}`));
  }

  // Per-repo
  const repoRoot = getRepoRoot();
  if (repoRoot) {
    const repoAlias = getRepoAlias();
    if (repoAlias) {
      const account = config.accounts.find((a) => a.alias === repoAlias);
      if (account) {
        console.log(chalk.white(`Repo   : ${chalk.green(account.alias)} (${account.username}) - ${account.email}`));
      } else {
        console.log(chalk.white(`Repo   : ${chalk.red(repoAlias)} (account not found in config)`));
      }
    } else {
      console.log(chalk.white(`Repo   : ${chalk.gray('not set (using global)')}`));
    }

    // Show remote URL
    const remoteUrl = getRemoteUrl();
    if (remoteUrl) {
      console.log(chalk.white(`Remote : ${chalk.gray(remoteUrl)}`));
    }

    console.log(chalk.white(`Path   : ${chalk.gray(repoRoot)}`));
  } else {
    console.log(chalk.white(`Repo   : ${chalk.gray('not inside a git repo')}`));
  }

  // Effective account (which one will be used)
  const repoAlias = repoRoot ? getRepoAlias() : null;
  const effectiveAlias = repoAlias || config.active;
  if (effectiveAlias) {
    const effective = config.accounts.find((a) => a.alias === effectiveAlias);
    if (effective) {
      console.log(chalk.white(`\nActive : ${chalk.green.bold(effective.alias)} (${effective.username})`));
      console.log(chalk.gray(`         SSH host: github-${effective.alias}`));
    }
  }

  console.log('');
}
