import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const target = process.env.FIRESALE_SERVICE_TARGET;

const commandByTarget = {
  api: ["run", "start:api"],
  web: ["run", "start:web"]
};

const args = target ? commandByTarget[target] : undefined;

if (!args) {
  console.error("Set FIRESALE_SERVICE_TARGET to 'api' or 'web' before running npm start.");
  process.exit(1);
}

const child = spawn(npmCommand, args, {
  cwd: process.cwd(),
  env: process.env,
  shell: process.platform === "win32",
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
