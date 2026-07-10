import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaPath = join(root, "prisma", "schema.sqlite.prisma");
const dbPath = join(root, "prisma", "dev.db");
const command =
  process.platform === "win32"
    ? ["cmd.exe", ["/d", "/s", "/c", "npx.cmd"]]
    : ["npx", []];

if (existsSync(dbPath)) {
  rmSync(dbPath);
}

const sql = execFileSync(
  command[0],
  [
    ...command[1],
    "prisma",
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    schemaPath,
    "--script"
  ],
  {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  }
);

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(sql);
db.close();

console.log(`SQLite database created at ${dbPath}`);
