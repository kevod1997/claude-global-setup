# claude-global-setup

This repository packages a curated global `CLAUDE.md` plus a small CLI to install or update it in the user-level Claude Code memory location.

## What This Installs

Claude Code loads a user-global memory file from:

```text
~/.claude/CLAUDE.md
```

The CLI resolves that path from the current user's home directory, so the concrete destination becomes:

- Windows: `C:\Users\<user>\.claude\CLAUDE.md`
- macOS: `/Users/<user>/.claude/CLAUDE.md`
- Linux: `/home/<user>/.claude/CLAUDE.md`

This tool is for the global file only. It does not inspect or modify:

- `./CLAUDE.md`
- `./.claude/CLAUDE.md`

Those are project-level instruction files and are intentionally out of scope.

## What The Template Controls

- model selection by task type
- a strong bias toward parallel execution
- subagent role selection for read, write, and architecture work

## Install

Install the packaged CLI from a versioned GitHub Release asset:

```bash
npm install -g https://github.com/kevod1997/claude-global-setup/releases/download/v0.1.0/claude-global-setup-0.1.0.tgz
```

For future versions, replace `0.1.0` with the version you want to install. Use release assets instead of mutable branches so installs stay pinned to a specific tarball.

For local development inside this repo:

```bash
node ./bin/claude-global-setup.js
```

### Actions

If the destination file does not exist, the CLI creates it.

If the destination file already exists, the CLI offers:

- `Replace`: create a timestamped backup and overwrite the file
- `Merge managed block`: insert or update only the managed block
- `Cancel`

### Flags

```text
--replace            Backup the existing file, then overwrite it
--merge              Insert or update the managed block
--yes                Skip the prompt and accept the selected action
--target <file-path> Write to an explicit destination file path
```

`--target` is an override for advanced cases. The default behavior always targets the global Claude Code memory file in the user's home directory.

## Merge Behavior

The merge mode manages only this block:

```html
<!-- claude-global-setup:start -->
...
<!-- claude-global-setup:end -->
```

If the block already exists, it is replaced in place. If it does not exist, it is appended once. The CLI does not attempt a free-form merge outside that block.

## Notes

- The template source is [`CLAUDE.md`](./CLAUDE.md).
- The CLI is dependency-free and requires Node.js 18+.
- Backups are created beside the destination file as `CLAUDE.md.bak.<timestamp>`.

## Local Testing Before Releasing

Validate the packaged artifact before creating a release:

```bash
npm test
npm pack --dry-run
npm pack
```

Then install the generated tarball into a temporary test directory and run the CLI against a temporary target path:

```bash
mkdir tmp-package-test
npm install --prefix ./tmp-package-test ./claude-global-setup-X.Y.Z.tgz
npx --prefix ./tmp-package-test claude-global-setup --help
npx --prefix ./tmp-package-test claude-global-setup --replace --yes --target ./tmp-package-test/tmp/CLAUDE.md
```

This keeps the validation flow close to the published package and avoids touching `~/.claude/CLAUDE.md`.

## Create a GitHub Release

Use the GitHub repo for distribution:

```text
https://github.com/kevod1997/claude-global-setup
```

For each release:

```bash
# 1. Update package.json version to X.Y.Z
npm test
npm pack --dry-run
npm pack
gh auth status
# If the GitHub CLI token is invalid, run:
# gh auth login -h github.com
git tag vX.Y.Z
git push origin main --tags
gh release create vX.Y.Z ./claude-global-setup-X.Y.Z.tgz --title "vX.Y.Z" --notes "Release vX.Y.Z"
```

After the release is published, users can install that exact version with:

```bash
npm install -g https://github.com/kevod1997/claude-global-setup/releases/download/vX.Y.Z/claude-global-setup-X.Y.Z.tgz
```

Current release:

```text
https://github.com/kevod1997/claude-global-setup/releases/tag/v0.1.0
```

## References

- Claude Code memory: https://code.claude.com/docs/en/memory
- Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Node.js `os.homedir()`: https://nodejs.org/api/os.html#oshomedir
