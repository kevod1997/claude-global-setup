# claude-global-setup

Install a global `CLAUDE.md` for Claude Code.

## Install

```bash
npm install -g https://github.com/kevod1997/claude-global-setup/releases/download/v0.1.1/claude-global-setup-0.1.1.tgz
```

## What it does

- installs the template from [`CLAUDE.md`](./CLAUDE.md)
- writes to the user-global Claude Code path:
  - Windows: `C:\Users\<user>\.claude\CLAUDE.md`
  - macOS: `/Users/<user>/.claude/CLAUDE.md`
  - Linux: `/home/<user>/.claude/CLAUDE.md`
- does not touch project files like `./CLAUDE.md` or `./.claude/CLAUDE.md`

## Usage

```bash
claude-global-setup --help
claude-global-setup --version
claude-global-setup
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
