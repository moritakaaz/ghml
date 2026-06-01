export interface Account {
  alias: string;
  username: string;
  email: string;
  sshKeyPath: string;
}

export interface GhmlConfig {
  accounts: Account[];
  active: string | null;
}
