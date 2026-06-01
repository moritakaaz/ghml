import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadConfig, removeAccount } from '../utils/config';
import { removeSshKey, removeSshConfig } from '../utils/ssh';

export async function removeCommand(): Promise<void> {
  const config = loadConfig();

  if (config.accounts.length === 0) {
    console.log(chalk.yellow('\nNo accounts found. Use "ghml add" to add one.\n'));
    return;
  }

  const { alias } = await inquirer.prompt([
    {
      type: 'list',
      name: 'alias',
      message: 'Select account to remove:',
      choices: config.accounts.map((a) => ({
        name: `${a.alias} (${a.username}) - ${a.email}`,
        value: a.alias,
      })),
    },
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove "${alias}"? This will delete the SSH key.`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Cancelled.'));
    return;
  }

  try {
    // Remove SSH key files
    removeSshKey(alias);
    console.log(chalk.green('SSH key removed.'));

    // Remove SSH config entry
    removeSshConfig(alias);
    console.log(chalk.green('SSH config entry removed.'));

    // Remove from config
    removeAccount(alias);
    console.log(chalk.green(`\nAccount "${alias}" removed successfully!`));
  } catch (err: any) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}
