#!/usr/bin/env node

import { Command } from 'commander';
import { addCommand } from './commands/add';
import { removeCommand } from './commands/remove';
import { listCommand } from './commands/list';
import { switchCommand } from './commands/switch';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { cloneCommand } from './commands/clone';
import { doctorCommand } from './commands/doctor';

const program = new Command();

program
  .name('ghml')
  .description('GitHub Multi-Login - Switch between multiple GitHub accounts using SSH keys')
  .version('1.0.0');

program
  .command('add')
  .description('Add a new GitHub account')
  .action(async () => {
    await addCommand();
  });

program
  .command('remove')
  .description('Remove a GitHub account')
  .action(async () => {
    await removeCommand();
  });

program
  .command('list')
  .aliases(['ls'])
  .description('List all GitHub accounts')
  .action(() => {
    listCommand();
  });

program
  .command('switch')
  .aliases(['sw'])
  .description('Switch active GitHub account (global)')
  .action(async () => {
    await switchCommand();
  });

program
  .command('init')
  .description('Configure current repo to use a specific account')
  .action(async () => {
    await initCommand();
  });

program
  .command('status')
  .aliases(['st'])
  .description('Show current active account (global and repo)')
  .action(() => {
    statusCommand();
  });

program
  .command('clone [url]')
  .description('Clone a repo with a specific account')
  .action(async (url?: string) => {
    await cloneCommand(url);
  });

program
  .command('doctor')
  .description('Check health of all accounts (SSH keys, config, connection)')
  .action(async () => {
    await doctorCommand();
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
