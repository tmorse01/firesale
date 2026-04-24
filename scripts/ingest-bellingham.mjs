import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const forwardedArgs = process.argv.slice(2);
if (process.env.npm_config_publish === "true" && !forwardedArgs.includes("--publish")) {
  forwardedArgs.push("--publish");
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? 1}`));
    });

    child.on("error", reject);
  });
}

await run(npmCommand, ["run", "build:api"]);
await run("node", ["apps/api/dist/scripts/ingestBellingham.js", ...forwardedArgs]);
