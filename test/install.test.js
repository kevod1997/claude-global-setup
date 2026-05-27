const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");

const {
  MANAGED_BLOCK_END,
  MANAGED_BLOCK_START,
  installToTarget,
  loadTemplate,
  mergeManagedBlock,
  resolveTargetPath
} = require("../lib/install");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function makeTempDir() {
  return fs.mkdtemp(path.join(process.cwd(), ".tmp-claude-global-setup-"));
}

test("mergeManagedBlock inserts and updates a single managed block", async (t) => {
  const tempDir = await makeTempDir();
  t.after(async () => {
    await fs.rm(tempDir, { force: true, recursive: true });
  });

  const original = "# Existing rules\n\nKeep this.";
  const firstTemplate = "## Rule A\n- first";
  const secondTemplate = "## Rule B\n- second";

  const mergedOnce = mergeManagedBlock(original, firstTemplate);
  assert.match(mergedOnce, new RegExp(escapeRegExp(MANAGED_BLOCK_START)));
  assert.match(mergedOnce, /## Rule A/);

  const mergedTwice = mergeManagedBlock(mergedOnce, secondTemplate);
  assert.equal(mergedTwice.split(MANAGED_BLOCK_START).length - 1, 1);
  assert.match(mergedTwice, /## Rule B/);
  assert.doesNotMatch(mergedTwice, /## Rule A/);
  assert.match(mergedTwice, new RegExp(escapeRegExp(MANAGED_BLOCK_END)));
});

test("installToTarget replace creates a backup and overwrites the file", async (t) => {
  const tempDir = await makeTempDir();
  t.after(async () => {
    await fs.rm(tempDir, { force: true, recursive: true });
  });

  const targetPath = path.join(tempDir, "CLAUDE.md");
  await fs.writeFile(targetPath, "old content", "utf8");

  const result = await installToTarget({
    action: "replace",
    targetPath,
    templateContent: "new content"
  });

  assert.equal(result.existed, true);
  assert.ok(result.backupPath);
  assert.equal(await fs.readFile(targetPath, "utf8"), "new content");
  assert.equal(await fs.readFile(result.backupPath, "utf8"), "old content");
});

test("installToTarget merge appends a managed block without touching existing text", async (t) => {
  const tempDir = await makeTempDir();
  t.after(async () => {
    await fs.rm(tempDir, { force: true, recursive: true });
  });

  const targetPath = path.join(tempDir, "CLAUDE.md");
  await fs.writeFile(targetPath, "local rule", "utf8");

  await installToTarget({
    action: "merge",
    targetPath,
    templateContent: "global rule"
  });

  const finalContent = await fs.readFile(targetPath, "utf8");
  assert.match(finalContent, /local rule/);
  assert.match(finalContent, /global rule/);
  assert.equal(finalContent.split(MANAGED_BLOCK_START).length - 1, 1);
});

test("resolveTargetPath rejects a directory target", async (t) => {
  const tempDir = await makeTempDir();
  t.after(async () => {
    await fs.rm(tempDir, { force: true, recursive: true });
  });

  await assert.rejects(
    () => resolveTargetPath(tempDir),
    /must be a file path, not a directory/
  );
});

test("loadTemplate strips a leading BOM from the template file", async () => {
  const template = await loadTemplate();
  assert.equal(template.charCodeAt(0), "#".charCodeAt(0));
  assert.doesNotMatch(template, /^\uFEFF/);
});
