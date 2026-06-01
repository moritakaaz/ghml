# Project Context

## Overview
`ghml` (GitHub Multi-Login) - A global Node.js/TypeScript CLI tool to manage multiple GitHub accounts on a single device using SSH keys.

## Tech Stack
- **Language:** TypeScript (compile to CommonJS)
- **Runtime:** Node.js
- **CLI framework:** commander v11.1.0
- **Interactive prompts:** inquirer v8.2.6
- **Styling:** chalk v4.1.2
- **Build:** tsc (TypeScript compiler)

## Architecture

### Data Flow
1. User runs `ghml add` → generate SSH key + update `~/.ssh/config` + save to `~/.ghml/config.json`
2. User runs `ghml switch` → update global git config (user.name, user.email)
3. User runs `ghml init` in a repo → set local git config + update remote URL + write `.ghml` file

### Storage
- **Global config:** `~/.ghml/config.json` (account list + active account)
- **Per-repo marker:** `.ghml` file in repo root (contains account alias)
- **SSH keys:** `~/.ssh/ghml_<alias>` and `~/.ssh/ghml_<alias>.pub`
- **SSH config:** Entries in `~/.ssh/config` with `# ghml-start/end` markers

### Account Priority
1. Per-repo (from `ghml init`) → highest priority
2. Global active (from `ghml switch`) → fallback

## Commands

| Command | Description |
|---------|-------------|
| `ghml add` | Interactive prompt: add account + auto-generate SSH key ed25519 |
| `ghml remove` | Select account to remove (interactive) + cleanup SSH key & config |
| `ghml list` / `ghml ls` | Display all accounts, mark active (global/repo) |
| `ghml switch` / `ghml sw` | Set global active account + update global git config |
| `ghml init` | Set per-repo account + update remote URL to SSH alias + local git config |
| `ghml status` / `ghml st` | Quick check active account (global + repo) + remote URL |
| `ghml clone [url]` | Clone repo with a specific account + auto-configure |
| `ghml doctor` | Health check: SSH keys, config entries, GitHub connection |

## SSH Strategy
- Each account has its own SSH key: `~/.ssh/ghml_<alias>`
- In `~/.ssh/config`, each account has a Host alias: `github-<alias>`
- Repo remote URLs are converted to: `git@github-<alias>:user/repo.git`

## Design Decisions
- **SSH-only auth:** Most secure and reliable for multi-account setups
- **Interactive prompts:** More user-friendly than CLI flags
- **Per-repo override:** `.ghml` file in repo root so it's not affected by global switch
- **Marker-based SSH config:** Uses comment markers to allow cleanup without breaking other config entries
- **chalk v4:** Using v4 (CommonJS) because v5 is ESM-only

## File Structure
```
src/
├── index.ts              # CLI entry point (commander setup)
├── types.ts              # TypeScript interfaces (Account, GhmlConfig)
├── commands/
│   ├── add.ts            # ghml add
│   ├── remove.ts         # ghml remove
│   ├── list.ts           # ghml list
│   ├── switch.ts         # ghml switch
│   ├── init.ts           # ghml init
│   ├── status.ts         # ghml status
│   ├── clone.ts          # ghml clone
│   └── doctor.ts         # ghml doctor
└── utils/
    ├── config.ts         # ~/.ghml/config.json CRUD operations
    ├── ssh.ts            # SSH key generation + ~/.ssh/config management
    └── git.ts            # Git config + remote URL helpers
```

## Development Status
- [x] Project setup (package.json, tsconfig)
- [x] Core config storage (~/.ghml/config.json)
- [x] SSH key management (generate, add/remove config)
- [x] Command: ghml add
- [x] Command: ghml remove
- [x] Command: ghml list
- [x] Command: ghml switch
- [x] Command: ghml init
- [x] Command: ghml status
- [x] Command: ghml clone
- [x] Command: ghml doctor
- [x] SSH validation after add (test connection)
- [x] Global npm link

## Versioning & Release

### Tools
- **standard-version:** Auto version bump + CHANGELOG generation based on conventional commits
- **commitlint + husky:** Enforce conventional commit format on every commit

### Conventional Commit Format
```
feat: description     → minor bump (1.0.0 → 1.1.0)
fix: description      → patch bump (1.0.0 → 1.0.1)
feat!: description    → major bump (1.0.0 → 2.0.0)
chore: description    → no bump
docs: description     → no bump
refactor: description → no bump
```

### Release Workflow
```bash
npx standard-version          # bump version + generate CHANGELOG + git tag
git push --follow-tags         # push commits + tags to GitHub
# GitHub Actions will automatically:
#   → publish to npm
#   → create GitHub Release with changelog
```

## Repository
- **GitHub:** https://github.com/moritakaaz/ghml
- **npm:** https://www.npmjs.com/package/@moritakaaz/ghml
- **Install:** `npm install -g @moritakaaz/ghml`

## CI/CD (GitHub Actions)
- **CI** (`.github/workflows/ci.yml`): Build check on every push/PR to master (Node 16, 18, 20)
- **Release** (`.github/workflows/release.yml`): Auto publish to npm + create GitHub Release on tag push (`v*`)
