import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const emptyStore = () => ({ items: [], requests: [], checks: [] });

// Local-disk locking coordinates Next route bundles and concurrent processes.
// Deploy on one host with persistent disk, not serverless or network storage.
const isVault = (data) => Array.isArray(data.items) &&
  (data.requests === undefined || Array.isArray(data.requests)) &&
  (data.checks === undefined || Array.isArray(data.checks));

// Defaults describe the vault file; other JSON files pass their own empty/valid.
export function createStore(file, { empty = emptyStore, valid = isVault } = {}) {
  const lock = `${file}.lock`;
  async function readStore() {
    let raw;
    try { raw = await fs.readFile(file, "utf8"); }
    catch (error) {
      if (error.code === "ENOENT") return empty();
      throw error;
    }
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data) || !valid(data)) {
      throw new Error("Invalid store file. Restore a known-good backup.");
    }
    return { ...empty(), ...data };
  }

  async function updateStore(change) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const deadline = Date.now() + 5000;
    while (true) {
      try { await fs.mkdir(lock); break; }
      catch (error) {
        if (error.code !== "EEXIST") throw error;
        if (Date.now() >= deadline) throw new Error("Vault is locked.");
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      const store = await readStore();
      const result = await change(store);
      const handle = await fs.open(temporary, "wx", 0o600);
      try {
        await handle.writeFile(JSON.stringify(store, null, 2), "utf8");
        await handle.sync();
      } finally { await handle.close(); }
      await fs.rename(temporary, file);
      return result;
    } finally {
      try { await fs.rm(temporary, { force: true }); }
      finally { await fs.rmdir(lock); }
    }
  }
  return { readStore, updateStore };
}
