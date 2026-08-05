const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

function makeWritable(entryPath) {
  try {
    fs.chmodSync(entryPath, 0o666);
  } catch (err) {
    // ignore
  }
}

function removeEntry(entryPath) {
  try {
    const stat = fs.lstatSync(entryPath);
    if (stat.isDirectory()) {
      const childNames = fs.readdirSync(entryPath);
      for (const child of childNames) {
        removeEntry(path.join(entryPath, child));
      }
      makeWritable(entryPath);
      fs.rmdirSync(entryPath);
    } else {
      makeWritable(entryPath);
      fs.unlinkSync(entryPath);
    }
  } catch (err) {
    // ignore individual removal errors
  }
}

if (!fs.existsSync(distDir)) {
  process.exit(0);
}

try {
  const entries = fs.readdirSync(distDir);
  for (const entry of entries) {
    removeEntry(path.join(distDir, entry));
  }
  try {
    fs.rmdirSync(distDir);
  } catch (err) {
    // ignore if the directory itself cannot be removed
  }
  console.log('[clean-dist] removed dist');
} catch (err) {
  console.warn('[clean-dist] unable to clean dist:', err.message);
}
process.exit(0);
