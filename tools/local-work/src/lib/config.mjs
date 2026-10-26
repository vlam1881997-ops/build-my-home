import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export function rootDir(){ return root; }
export function stateDir(){
  const d = path.join(root, ".local-work");
  fs.mkdirSync(d, { recursive: true });
  return d;
}
export function loadConfig(){
  const local = path.join(root, "config.local.json");
  const example = path.join(root, "config.example.json");
  const p = fs.existsSync(local) ? local : example;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
export function saveState(name, value){
  fs.writeFileSync(path.join(stateDir(), name), JSON.stringify(value, null, 2), "utf8");
}
export function loadState(name, fallback){
  const p = path.join(stateDir(), name);
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
