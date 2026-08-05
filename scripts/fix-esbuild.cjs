const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '..', 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild'),
  path.join(__dirname, '..', 'node_modules', 'esbuild', 'bin', 'esbuild'),
];

if (process.platform !== 'linux') {
  console.log('[fix-esbuild] skipping permission fix on non-Linux platform');
  process.exit(0);
}

for (const filePath of candidates) {
  try {
    if (fs.existsSync(filePath)) {
      fs.chmodSync(filePath, 0o755);
      console.log(`[fix-esbuild] permission fixed: ${filePath}`);
      process.exit(0);
    }
  } catch (err) {
    console.warn(`[fix-esbuild] failed to chmod ${filePath}: ${err.message}`);
  }
}

console.warn('[fix-esbuild] no esbuild binary found to fix');
process.exit(0);
