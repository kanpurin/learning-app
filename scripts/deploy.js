const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');
const buildDir = path.join(root, 'build');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const ensureInsideRoot = (target) => {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to operate outside project root: ${target}`);
  }
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: options.stdio || 'inherit',
    shell: false,
  });

  if (options.allowStatus?.includes(result.status)) {
    return result;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  return result;
};

const hasStagedChanges = () => {
  const result = run('git', ['diff', '--cached', '--quiet'], {
    stdio: 'ignore',
    allowStatus: [0, 1],
  });
  return result.status === 1;
};

ensureInsideRoot(docsDir);
ensureInsideRoot(buildDir);

fs.rmSync(docsDir, { recursive: true, force: true });
run(npmCommand, ['run', 'build']);

if (!fs.existsSync(buildDir)) {
  throw new Error('Build directory was not created.');
}

fs.rmSync(docsDir, { recursive: true, force: true });
fs.renameSync(buildDir, docsDir);

run('git', ['add', 'docs']);
if (hasStagedChanges()) {
  run('git', ['commit', '-m', 'Deploy app']);
} else {
  console.log('No docs changes to commit.');
}
run('git', ['push', 'origin', 'main']);

