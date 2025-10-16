#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧹 Clearing cache...");

// Clear Vite cache
const viteCacheDir = path.join(__dirname, "node_modules", ".vite");
if (fs.existsSync(viteCacheDir)) {
  fs.rmSync(viteCacheDir, { recursive: true, force: true });
  console.log("✅ Cleared Vite cache");
}

// Clear dist folder
const distDir = path.join(__dirname, "dist");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log("✅ Cleared dist folder");
}

console.log("🎉 Cache cleared successfully!");
console.log('💡 Run "npm run dev" to start fresh');
