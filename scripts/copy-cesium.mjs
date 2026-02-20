import { cpSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const cesiumSource = join(root, "node_modules", "cesium", "Build", "Cesium");
const publicCesium = join(root, "public", "cesium");

if (!existsSync(cesiumSource)) {
  console.warn("Cesium source not found, skipping asset copy");
  process.exit(0);
}

mkdirSync(publicCesium, { recursive: true });

const dirs = ["Workers", "Assets", "Widgets", "ThirdParty"];
for (const dir of dirs) {
  const src = join(cesiumSource, dir);
  const dest = join(publicCesium, dir);
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
  }
}

console.log("Cesium assets copied to public/cesium/");
