const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const MANAGED_BLOCK_START = "<!-- claude-global-setup:start -->";
const MANAGED_BLOCK_END = "<!-- claude-global-setup:end -->";

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
    this.exitCode = 1;
  }
}

function getTemplatePath() {
  return path.resolve(__dirname, "..", "CLAUDE.md");
}

async function loadTemplate() {
  const content = await fs.readFile(getTemplatePath(), "utf8");
  return content.replace(/^\uFEFF/, "");
}

function getDefaultTargetPath() {
  return path.join(os.homedir(), ".claude", "CLAUDE.md");
}

function detectEol(text) {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildManagedBlock(templateContent, eol) {
  const trimmedTemplate = templateContent.trimEnd();
  return [
    MANAGED_BLOCK_START,
    trimmedTemplate,
    MANAGED_BLOCK_END
  ].join(eol) + eol;
}

function mergeManagedBlock(existingContent, templateContent) {
  const eol = detectEol(existingContent);
  const managedBlock = buildManagedBlock(templateContent, eol);
  const blockPattern = new RegExp(
    `${escapeRegExp(MANAGED_BLOCK_START)}[\\s\\S]*?${escapeRegExp(MANAGED_BLOCK_END)}\\r?\\n?`,
    "m"
  );

  if (blockPattern.test(existingContent)) {
    return existingContent.replace(blockPattern, managedBlock);
  }

  const trimmedExisting = existingContent.trimEnd();
  if (!trimmedExisting) {
    return managedBlock;
  }

  return `${trimmedExisting}${eol}${eol}${managedBlock}`;
}

function createBackupPath(targetPath, now = new Date()) {
  const timestamp = now.toISOString().replace(/:/g, "-");
  return `${targetPath}.bak.${timestamp}`;
}

async function getPathType(targetPath) {
  try {
    const stats = await fs.stat(targetPath);
    if (stats.isFile()) {
      return "file";
    }
    if (stats.isDirectory()) {
      return "directory";
    }
    return "other";
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return "missing";
    }
    throw error;
  }
}

function validateTargetInput(rawTarget) {
  if (typeof rawTarget !== "string") {
    throw new UsageError("--target requires a file path.");
  }

  const trimmedTarget = rawTarget.trim();
  if (!trimmedTarget) {
    throw new UsageError("--target requires a file path.");
  }

  if (/[\\/]+$/.test(trimmedTarget)) {
    throw new UsageError(`--target must be a file path, not a directory: ${trimmedTarget}`);
  }

  return trimmedTarget;
}

async function resolveTargetPath(targetOverride) {
  if (!targetOverride) {
    return getDefaultTargetPath();
  }

  const validatedTarget = validateTargetInput(targetOverride);
  const absoluteTarget = path.resolve(validatedTarget);
  const pathType = await getPathType(absoluteTarget);

  if (pathType === "directory") {
    throw new UsageError(`--target must be a file path, not a directory: ${absoluteTarget}`);
  }

  if (pathType === "other") {
    throw new UsageError(`--target must point to a regular file path: ${absoluteTarget}`);
  }

  return absoluteTarget;
}

async function ensureParentDirectory(targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
}

async function installToTarget(options) {
  const { targetPath, templateContent, action } = options;
  const pathType = await getPathType(targetPath);

  if (pathType === "directory") {
    throw new UsageError(`Target path is a directory, expected a file: ${targetPath}`);
  }

  if (pathType === "other") {
    throw new UsageError(`Target path must be a regular file path: ${targetPath}`);
  }

  await ensureParentDirectory(targetPath);

  const existed = pathType === "file";
  let finalContent = templateContent;
  let backupPath = null;

  if (existed && action === "replace") {
    backupPath = createBackupPath(targetPath);
    await fs.copyFile(targetPath, backupPath);
  } else if (existed && action === "merge") {
    const existingContent = await fs.readFile(targetPath, "utf8");
    finalContent = mergeManagedBlock(existingContent, templateContent);
  } else if (action !== "replace" && action !== "merge") {
    throw new UsageError(`Unsupported action: ${action}`);
  }

  await fs.writeFile(targetPath, finalContent, "utf8");

  return {
    action,
    backupPath,
    existed,
    targetPath
  };
}

module.exports = {
  MANAGED_BLOCK_END,
  MANAGED_BLOCK_START,
  UsageError,
  createBackupPath,
  getDefaultTargetPath,
  getPathType,
  installToTarget,
  loadTemplate,
  mergeManagedBlock,
  resolveTargetPath
};
