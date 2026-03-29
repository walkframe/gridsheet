#!/usr/bin/env node

import { execSync } from 'child_process';

const root = new URL('..', import.meta.url).pathname;
const rev = process.argv[2] || 'HEAD';

const allTags = execSync('git tag', { cwd: root, encoding: 'utf-8' }).trim().split('\n').filter(Boolean);

let deleted = 0;
for (const tag of allTags) {
  try {
    const tagRev = execSync(`git rev-parse "${tag}^{}"`, { cwd: root, encoding: 'utf-8' }).trim();
    const targetRev = execSync(`git rev-parse "${rev}"`, { cwd: root, encoding: 'utf-8' }).trim();
    if (tagRev === targetRev) {
      execSync(`git tag -d "${tag}"`, { cwd: root, stdio: 'pipe' });
      console.log(`  deleted: ${tag}`);
      deleted++;
    }
  } catch {
    // skip
  }
}

if (deleted === 0) {
  console.log(`No tags found at ${rev}`);
} else {
  console.log(`\nDeleted ${deleted} tags at ${rev}`);
}
