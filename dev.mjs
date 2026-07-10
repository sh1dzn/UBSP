import { spawn } from "node:child_process";

const backend = spawn(process.execPath, ["server.mjs"], { stdio: "inherit" });
const frontend = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
  { stdio: "inherit" },
);

const stop = () => {
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
backend.on("exit", (code) => code && process.exit(code));
frontend.on("exit", (code) => code && process.exit(code));
