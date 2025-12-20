import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

async function run(command: string, args: string[], cwd?: string): Promise<string> {
  const { stdout } = await execFileAsync(command, args, { cwd });
  return stdout.trim();
}

export function isGitRepo(dir: string): boolean {
  return existsSync(path.join(dir, ".git"));
}

export async function gitAdd(files: string[], cwd: string): Promise<void> {
  await run("git", ["add", ...files], cwd);
}

export async function gitCommit(message: string, cwd: string): Promise<void> {
  const fullMessage = `${message}

🤖 Generated with Context Engineering Blog CLI`;

  await run("git", ["commit", "-m", fullMessage], cwd);
}

export async function gitPush(cwd: string): Promise<void> {
  await run("git", ["push"], cwd);
}

export async function hasChanges(cwd: string): Promise<boolean> {
  try {
    const status = await run("git", ["status", "--porcelain"], cwd);
    return status.length > 0;
  } catch {
    return false;
  }
}

export async function autoCommitAndPush(
  files: string[],
  title: string,
  cwd: string,
  options: { autoCommit: boolean; autoPush: boolean }
): Promise<void> {
  if (!isGitRepo(cwd)) {
    console.log("⚠️  Not a git repository, skipping git operations");
    return;
  }

  if (!(await hasChanges(cwd))) {
    console.log("ℹ️  No changes to commit");
    return;
  }

  if (options.autoCommit) {
    await gitAdd(files, cwd);
    await gitCommit(`post: ${title}`, cwd);
    console.log(`✓ Committed: post: ${title}`);

    if (options.autoPush) {
      await gitPush(cwd);
      console.log("✓ Pushed to remote");
    }
  }
}
