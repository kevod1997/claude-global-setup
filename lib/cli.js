const process = require("node:process");
const readline = require("node:readline/promises");
const packageJson = require("../package.json");

const {
  UsageError,
  getDefaultTargetPath,
  getPathType,
  installToTarget,
  loadTemplate,
  resolveTargetPath
} = require("./install");

function printHelp() {
  console.log(`claude-global-setup

Install or update the user-global CLAUDE.md for Claude Code.

Usage:
  claude-global-setup [--replace | --merge] [--yes] [--target <file-path>]
  claude-global-setup --version

Options:
  --replace            Backup the existing file, then overwrite it.
  --merge              Insert or update the managed block in the destination.
  --yes                Skip the prompt and accept the selected action.
  --target <file-path> Write to an explicit destination file path.
  --version, -v        Show the installed version.
  --help               Show this help.

Default target:
  ${getDefaultTargetPath()}
`);
}

function getPackageVersion() {
  return packageJson.version;
}

function parseArgs(argv) {
  let action = null;
  let target = null;
  let yes = false;
  let help = false;
  let version = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--replace") {
      if (action && action !== "replace") {
        throw new UsageError("Use only one action flag: --replace or --merge.");
      }
      action = "replace";
      continue;
    }

    if (arg === "--merge") {
      if (action && action !== "merge") {
        throw new UsageError("Use only one action flag: --replace or --merge.");
      }
      action = "merge";
      continue;
    }

    if (arg === "--yes") {
      yes = true;
      continue;
    }

    if (arg === "--target") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new UsageError("--target requires a file path.");
      }
      target = value;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--version" || arg === "-v") {
      version = true;
      continue;
    }

    throw new UsageError(`Unknown argument: ${arg}`);
  }

  return {
    action,
    help,
    target,
    version,
    yes
  };
}

async function promptForAction(targetPath, destinationLabel) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptText = [
    `A ${destinationLabel} CLAUDE.md already exists at:`,
    targetPath,
    "",
    "Choose an action:",
    "  [1] Replace (backup + overwrite)",
    "  [2] Merge managed block",
    "  [3] Cancel",
    "Selection [1]: "
  ].join("\n");

  try {
    while (true) {
      const answer = (await rl.question(promptText)).trim().toLowerCase();

      if (answer === "" || answer === "1" || answer === "replace" || answer === "r") {
        return "replace";
      }

      if (answer === "2" || answer === "merge" || answer === "m") {
        return "merge";
      }

      if (answer === "3" || answer === "cancel" || answer === "c") {
        return "cancel";
      }

      console.log("Invalid selection. Choose 1, 2, or 3.");
    }
  } finally {
    rl.close();
  }
}

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function chooseAction(existingFile, parsedArgs, targetPath, destinationLabel) {
  if (!existingFile) {
    return parsedArgs.action || "replace";
  }

  if (parsedArgs.action) {
    return parsedArgs.action;
  }

  if (parsedArgs.yes) {
    return "replace";
  }

  if (!isInteractive()) {
    console.log("No interactive terminal detected. Defaulting to replace.");
    return "replace";
  }

  return promptForAction(targetPath, destinationLabel);
}

async function runCli(argv = process.argv.slice(2)) {
  const parsedArgs = parseArgs(argv);
  if (parsedArgs.version) {
    console.log(getPackageVersion());
    return;
  }

  if (parsedArgs.help) {
    printHelp();
    return;
  }

  const targetPath = await resolveTargetPath(parsedArgs.target);
  const pathType = await getPathType(targetPath);
  const existingFile = pathType === "file";
  const destinationLabel = parsedArgs.target ? "destination" : "global";

  console.log(`Target path: ${targetPath}`);

  const action = await chooseAction(existingFile, parsedArgs, targetPath, destinationLabel);
  if (action === "cancel") {
    console.log("Cancelled. No changes were made.");
    return;
  }

  const templateContent = await loadTemplate();
  const result = await installToTarget({
    action,
    targetPath,
    templateContent
  });

  if (result.backupPath) {
    console.log(`Backup created: ${result.backupPath}`);
  }

  if (!result.existed) {
    console.log(`Installed new ${destinationLabel} CLAUDE.md.`);
    return;
  }

  if (result.action === "replace") {
    console.log(`Replaced ${destinationLabel} CLAUDE.md.`);
    return;
  }

  console.log(`Updated managed block in ${destinationLabel} CLAUDE.md.`);
}

module.exports = {
  getPackageVersion,
  parseArgs,
  runCli
};
