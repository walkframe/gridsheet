#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/set-version.mjs <version>');
  console.error('Example: node scripts/set-version.mjs 3.0.0-rc.12');
  process.exit(1);
}

const root = new URL('..', import.meta.url).pathname;
const pkgDirs = readdirSync(join(root, 'packages')).filter((d) => {
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'packages', d, 'package.json'), 'utf-8'));
    return !pkg.private && pkg.version !== '0.0.0';
  } catch {
    return false;
  }
});

const pkgNames = new Set();

for (const dir of pkgDirs) {
  const pkgPath = join(root, 'packages', dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkgNames.add(pkg.name);
}

let changed = 0;

for (const dir of pkgDirs) {
  const pkgPath = join(root, 'packages', dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const oldVersion = pkg.version;
  pkg.version = version;

  for (const depKey of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[depKey];
    if (!deps) continue;
    for (const [name, val] of Object.entries(deps)) {
      if (pkgNames.has(name) && !val.startsWith('workspace:')) {
        deps[name] = version;
      }
    }
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  ${pkg.name}: ${oldVersion} -> ${version}`);
  changed++;
}

console.log(`\nUpdated ${changed} packages to ${version}`);

execSync(`git add packages/*/package.json`, { cwd: root, stdio: 'inherit' });
execSync(`git commit -m "${version}"`, { cwd: root, stdio: 'inherit' });
console.log(`\nCommitted as "${version}"`);

for (const dir of pkgDirs) {
  const pkgPath = join(root, 'packages', dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const shortName = pkg.name.split('/').pop();
  const tag = `${shortName}/${version}`;
  execSync(`git tag "${tag}"`, { cwd: root, stdio: 'pipe' });
  console.log(`  tagged: ${tag}`);
}
