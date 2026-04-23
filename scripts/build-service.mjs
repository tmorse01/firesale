import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const target = process.env.FIRESALE_SERVICE_TARGET ?? "all";

const commandSets = {
  all: [
    ["run", "build:api"],
    ["run", "build:web"]
  ],
  api: [["run", "build:api"]],
  web: [["run", "build:web"]]
};

const commands = commandSets[target];

if (!commands) {
  console.error(`Unsupported FIRESALE_SERVICE_TARGET: ${target}`);
  process.exit(1);
}

for (const args of commands) {
  await new Promise((resolve, reject) => {
    const child = spawn(npmCommand, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${npmCommand} ${args.join(" ")} exited with code ${code ?? 1}`));
    });
    child.on("error", reject);
  });
}
