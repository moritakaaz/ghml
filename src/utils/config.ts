import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GhmlConfig, Account } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.ghml');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getDefaultConfig(): GhmlConfig {
  return {
    accounts: [],
    active: null,
  };
}

export function loadConfig(): GhmlConfig {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return getDefaultConfig();
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as GhmlConfig;
  } catch {
    return getDefaultConfig();
  }
}

export function saveConfig(config: GhmlConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function findAccount(alias: string): Account | undefined {
  const config = loadConfig();
  return config.accounts.find((a) => a.alias === alias);
}

export function accountExists(alias: string): boolean {
  return findAccount(alias) !== undefined;
}

export function addAccount(account: Account): void {
  const config = loadConfig();
  config.accounts.push(account);
  if (config.accounts.length === 1) {
    config.active = account.alias;
  }
  saveConfig(config);
}

export function removeAccount(alias: string): void {
  const config = loadConfig();
  config.accounts = config.accounts.filter((a) => a.alias !== alias);
  if (config.active === alias) {
    config.active = config.accounts.length > 0 ? config.accounts[0].alias : null;
  }
  saveConfig(config);
}

export function setActive(alias: string): void {
  const config = loadConfig();
  config.active = alias;
  saveConfig(config);
}

export function getActive(): Account | undefined {
  const config = loadConfig();
  if (!config.active) return undefined;
  return config.accounts.find((a) => a.alias === config.active);
}
