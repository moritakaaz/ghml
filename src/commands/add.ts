import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { accountExists, addAccount } from '../utils/config';
import { generateSshKey, getSshPublicKey, addSshConfig } from '../utils/ssh';

export async function addCommand(): Promise<void> {
  console.log(chalk.cyan('\n--- Add GitHub Account ---\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'alias',
      message: 'Account alias (e.g., personal, work):',
      validate: (input: string) => {
        if (!input.trim()) return 'Alias is required';
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) return 'Alias can only contain letters, numbers, hyphens, and underscores';
        if (accountExists(input.trim())) return `Account "${input}" already exists`;
        return true;
      },
    },
    {
      type: 'input',
      name: 'username',
      message: 'GitHub username:',
      validate: (input: string) => (input.trim() ? true : 'Username is required'),
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email address:',
      validate: (input: string) => {
        if (!input.trim()) return 'Email is required';
        if (!input.includes('@')) return 'Invalid email format';
        return true;
      },
    },
  ]);

  const { alias, username, email } = answers;

  try {
    // Generate SSH key
    console.log(chalk.yellow(`\nGenerating SSH key for "${alias}"...`));
    const keyPath = generateSshKey(alias.trim(), email.trim());
    console.log(chalk.green(`SSH key generated: ${keyPath}`));

    // Add SSH config entry
    addSshConfig(alias.trim(), keyPath);
    console.log(chalk.green(`SSH config updated (Host: github-${alias.trim()})`));

    // Save account to config
    addAccount({
      alias: alias.trim(),
      username: username.trim(),
      email: email.trim(),
      sshKeyPath: keyPath,
    });

    // Show public key
    const pubKey = getSshPublicKey(alias.trim());
    console.log(chalk.cyan('\n--- Public Key ---'));
    console.log(chalk.white(pubKey));
    console.log(chalk.cyan('--- End ---\n'));
    console.log(chalk.yellow('Add this public key to your GitHub account:'));
    console.log(chalk.white('https://github.com/settings/keys\n'));
    console.log(chalk.green(`Account "${alias.trim()}" added successfully!\n`));

    // Ask to verify SSH connection
    const { verify } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'verify',
        message: 'Have you added the key to GitHub? Test SSH connection now?',
        default: false,
      },
    ]);

    if (verify) {
      console.log(chalk.yellow(`\nTesting SSH connection to github-${alias.trim()}...`));
      try {
        const result = execSync(
          `ssh -T -o StrictHostKeyChecking=no git@github-${alias.trim()} 2>&1`,
          { stdio: 'pipe', timeout: 10000 }
        ).toString();
        if (result.includes('successfully authenticated')) {
          console.log(chalk.green('SSH connection successful!'));
        } else {
          console.log(chalk.yellow(result.trim()));
        }
      } catch (err: any) {
        const output = err.stdout?.toString() || err.stderr?.toString() || '';
        if (output.includes('successfully authenticated')) {
          console.log(chalk.green('SSH connection successful!'));
        } else {
          console.log(chalk.red('SSH connection failed. Make sure you added the public key to GitHub.'));
          console.log(chalk.gray(output.trim()));
        }
      }
    }
  } catch (err: any) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}
