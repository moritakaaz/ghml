# ghml - GitHub Multi-Login

A CLI tool to manage multiple GitHub accounts on a single device using SSH keys.

Switch between personal, work, and other GitHub accounts seamlessly without manual SSH key juggling.

## Install

```bash
npm install -g @moritakaaz/ghml
```

## Quick Start

```bash
# Add your first account
ghml add

# Add another account
ghml add

# Switch global active account
ghml switch

# Check status
ghml status
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `ghml add` | | Add a new GitHub account (interactive) |
| `ghml remove` | | Remove an account + cleanup SSH keys |
| `ghml list` | `ghml ls` | List all accounts |
| `ghml switch` | `ghml sw` | Switch global active account |
| `ghml init` | | Set account for current repo |
| `ghml status` | `ghml st` | Show active account info |
| `ghml clone [url]` | | Clone repo with specific account |
| `ghml doctor` | | Health check all accounts |

## How It Works

### SSH Strategy

Each account gets its own SSH key and host alias:

```
~/.ssh/ghml_personal        # SSH key for "personal"
~/.ssh/ghml_work            # SSH key for "work"
```

In `~/.ssh/config`:
```
Host github-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/ghml_personal
  IdentitiesOnly yes

Host github-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/ghml_work
  IdentitiesOnly yes
```

### Account Priority

1. **Per-repo** (set via `ghml init`) - highest priority
2. **Global** (set via `ghml switch`) - fallback

### Per-Repo Setup

When you run `ghml init` inside a repo:
- Local git config is set (user.name, user.email)
- Remote URL is converted to use the SSH alias (e.g., `git@github-work:org/repo.git`)
- A `.ghml` file is created in the repo root

This means the repo will always use the assigned account, regardless of global switch.

## Workflow Examples

### Adding accounts

```bash
$ ghml add
# Account alias: personal
# GitHub username: myuser
# Email: me@gmail.com
# → SSH key generated
# → Copy the public key to https://github.com/settings/keys

$ ghml add
# Account alias: work
# GitHub username: work-user
# Email: me@company.com
```

### Working with repos

```bash
# Clone with a specific account
ghml clone https://github.com/org/project.git

# Or configure an existing repo
cd ~/projects/work-project
ghml init
# → Select "work" account
# → Remote URL updated, local git config set

# Check what account is active
ghml status
```

### Health check

```bash
$ ghml doctor
# [OK]   [personal] SSH private key
# [OK]   [personal] SSH config entry
# [OK]   [personal] SSH connection - Authenticated
# [OK]   [work] SSH private key
# [OK]   [work] SSH config entry
# [FAIL] [work] SSH connection - Permission denied
# → Key not added to GitHub?
```

## Storage

| Location | Purpose |
|----------|---------|
| `~/.ghml/config.json` | Account list + active account |
| `~/.ssh/ghml_<alias>` | SSH private key per account |
| `~/.ssh/ghml_<alias>.pub` | SSH public key per account |
| `~/.ssh/config` | SSH host aliases (managed via markers) |
| `.ghml` (in repo root) | Per-repo account assignment |

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for versioning:

```bash
feat: add new command        # → minor version bump (1.0.0 → 1.1.0)
fix: handle edge case        # → patch version bump (1.0.0 → 1.0.1)
feat!: breaking change       # → major version bump (1.0.0 → 2.0.0)
```

## Requirements

- Node.js >= 16.0.0
- Git
- ssh-keygen (comes with Git on Windows)

## License

MIT
