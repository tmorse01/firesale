import { spawn } from "node:child_process";

const railwayCommand = process.platform === "win32" ? "railway.cmd" : "railway";
const target = (process.argv[2] ?? "all").toLowerCase();

const deployTargets = {
  all: ["firesale-api", "firesale-web"],
  api: ["firesale-api"],
  web: ["firesale-web"]
};

const services = deployTargets[target];

if (!services) {
  console.error("Usage: npm run deploy -- [all|api|web]");
  process.exit(1);
}

for (const service of services) {
  console.log(`\nDeploying ${service}...`);
  await runCommand(railwayCommand, ["up", "-s", service]);
}

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
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
