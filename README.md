# claude-global-setup

One-shot setup for a global `CLAUDE.md` in Claude Code.

## Run it once

```bash
npm exec --yes --package=https://github.com/kevod1997/claude-global-setup/releases/download/v0.1.2/claude-global-setup-0.1.2.tgz -- claude-global-setup --replace --yes
```

## What it does

- installs the template from [`CLAUDE.md`](./CLAUDE.md)
- writes to the user-global Claude Code path:
  - Windows: `C:\Users\<user>\.claude\CLAUDE.md`
  - macOS: `/Users/<user>/.claude/CLAUDE.md`
  - Linux: `/home/<user>/.claude/CLAUDE.md`
- does not touch project files like `./CLAUDE.md` or `./.claude/CLAUDE.md`
- does not require a permanent global install

## Usage

```bash
npm exec --yes --package=https://github.com/kevod1997/claude-global-setup/releases/download/v0.1.2/claude-global-setup-0.1.2.tgz -- claude-global-setup
npm exec --yes --package=https://github.com/kevod1997/claude-global-setup/releases/download/v0.1.2/claude-global-setup-0.1.2.tgz -- claude-global-setup --merge --yes
npm exec --yes --package=https://github.com/kevod1997/claude-global-setup/releases/download/v0.1.2/claude-global-setup-0.1.2.tgz -- claude-global-setup --version
```

## Options

```text
--replace            Backup the existing file, then overwrite it
--merge              Insert or update the managed block
--yes                Skip the prompt and accept the selected action
--target <file-path> Write to an explicit destination file path
--version, -v        Show the installed version
```

If the destination already exists, the CLI can:

- replace it with a backup
- merge the managed block
- cancel without changes
