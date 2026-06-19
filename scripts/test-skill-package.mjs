#!/usr/bin/env node
/**
 * Validates the skills.sh package layout and runs smoke tests.
 * Usage: node scripts/test-skill-package.mjs [--install]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_ROOT = path.join(REPO_ROOT, 'skills', 'ab-harness-skill');
const SCAN_FIXTURE = path.join(REPO_ROOT, 'tests', 'fixtures', 'minimal-repo');
const INSTALL_FIXTURE = path.join(REPO_ROOT, 'tests', '.tmp-install');

const REQUIRED = [
  'SKILL.md',
  'references/methodology/sdd.md',
  'templates/workflow.config.md.tpl',
  'scripts/scan-profile.mjs',
  'scripts/install-harness.mjs',
  'scripts/generate-specs.mjs',
  'LICENSE',
];

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...opts,
  });
  const out = `${result.stdout || ''}${result.stderr || ''}`;
  return { ...result, out };
}

function readFrontmatter(name) {
  const raw = fs.readFileSync(path.join(SKILL_ROOT, 'SKILL.md'), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) fail('SKILL.md missing YAML frontmatter');
  const nameLine = m[1].match(/^name:\s*(.+)$/m);
  if (!nameLine || nameLine[1].trim() !== name) {
    fail(`SKILL.md name must be "${name}" (skills.sh spec)`);
  }
  ok(`frontmatter name=${name}`);
}

function checkLayout() {
  if (!fs.existsSync(SKILL_ROOT)) fail(`missing ${SKILL_ROOT}`);
  for (const rel of REQUIRED) {
    const p = path.join(SKILL_ROOT, rel);
    if (!fs.existsSync(p)) fail(`missing ${rel}`);
  }
  ok('skills/ab-harness-skill layout');
  readFrontmatter('ab-harness-skill');

  const list = run('npx', ['skills', 'add', '.', '--list', '-y'], { cwd: REPO_ROOT });
  if (list.status !== 0) fail(`npx skills add --list failed:\n${list.out}`);
  if (!/ab-harness-skill/.test(list.out)) fail('CLI did not discover ab-harness-skill');
  ok('npx skills add --list discovers ab-harness-skill');
}

function runInstallSmoke() {
  const fixture = path.join(REPO_ROOT, 'tests', '.tmp-harness-install');
  fs.rmSync(fixture, { recursive: true, force: true });
  fs.mkdirSync(fixture, { recursive: true });
  fs.copyFileSync(
    path.join(SCAN_FIXTURE, 'package.json'),
    path.join(fixture, 'package.json'),
  );
  fs.writeFileSync(path.join(fixture, 'README.md'), '# harness install smoke\n');

  const config = path.join(SKILL_ROOT, 'scripts', 'install-config.example.json');
  const install = spawnSync(
    process.execPath,
    [path.join(SKILL_ROOT, 'scripts', 'install-harness.mjs'), '--config', config, '--target', fixture],
    { encoding: 'utf8', cwd: REPO_ROOT },
  );
  if (install.status !== 0) fail(`install-harness failed:\n${install.stderr || install.stdout}`);

  const required = [
    'workflow.config.md',
    'docs/workflow/README.md',
    '.specs/README.md',
    '.specs/codebase/overview.md',
    '.specs/project/context.md',
    '.specs/testing/strategy.md',
    'scripts/generate-specs.mjs',
  ];
  for (const rel of required) {
    if (!fs.existsSync(path.join(fixture, rel))) fail(`install missing ${rel}`);
  }
  fs.rmSync(fixture, { recursive: true, force: true });
  ok('install-harness creates docs/workflow and .specs tree');
}

function runScanSmoke() {
  const out = path.join(SCAN_FIXTURE, '.tmp-skill-package-scan.md');
  const scan = spawnSync(
    process.execPath,
    [path.join(SKILL_ROOT, 'scripts', 'scan-profile.mjs'), '--cwd', SCAN_FIXTURE, '--out', out],
    { encoding: 'utf8', cwd: REPO_ROOT },
  );
  if (scan.status !== 0) fail(`scan-profile failed:\n${scan.stderr || scan.stdout}`);
  if (!fs.existsSync(out)) fail('scan-profile did not write output');
  const body = fs.readFileSync(out, 'utf8');
  if (body.length < 200) fail('scan-profile output too short');
  fs.unlinkSync(out);
  ok('scan-profile smoke test on tests/fixtures/minimal-repo');
}

function installSmoke() {
  fs.rmSync(INSTALL_FIXTURE, { recursive: true, force: true });
  fs.mkdirSync(INSTALL_FIXTURE, { recursive: true });
  fs.copyFileSync(
    path.join(SCAN_FIXTURE, 'package.json'),
    path.join(INSTALL_FIXTURE, 'package.json'),
  );
  fs.writeFileSync(path.join(INSTALL_FIXTURE, 'README.md'), '# install smoke\n');

  const remove = run('npx', ['skills', 'remove', 'ab-harness-skill', '-y'], { cwd: INSTALL_FIXTURE });
  if (remove.status !== 0 && !/not found|no skills/i.test(remove.out)) {
    console.warn('WARN: skills remove returned non-zero (may be first install)');
  }

  const repoFromInstall = path.relative(INSTALL_FIXTURE, REPO_ROOT).replace(/\\/g, '/');

  const add = run(
    'npx',
    ['skills', 'add', repoFromInstall, '--skill', 'ab-harness-skill', '-a', 'cursor', '--copy', '-y'],
    { cwd: INSTALL_FIXTURE },
  );
  if (add.status !== 0) fail(`npx skills add failed:\n${add.out}`);

  const candidates = [
    path.join(INSTALL_FIXTURE, '.cursor', 'skills', 'ab-harness-skill'),
    path.join(INSTALL_FIXTURE, '.agents', 'skills', 'ab-harness-skill'),
  ];
  const installedRoot = candidates.find((dir) => fs.existsSync(path.join(dir, 'SKILL.md')));
  if (!installedRoot) fail(`expected skill in one of:\n${candidates.join('\n')}`);
  if (!fs.existsSync(path.join(installedRoot, 'scripts', 'scan-profile.mjs'))) {
    fail(`expected scan-profile.mjs under ${installedRoot}`);
  }
  ok(`npx skills add --copy installed to ${path.relative(INSTALL_FIXTURE, installedRoot)}`);

  fs.rmSync(INSTALL_FIXTURE, { recursive: true, force: true });
}

const doInstall = process.argv.includes('--install');

console.log('=== ab-harness-skill skills.sh package test ===\n');
checkLayout();
runScanSmoke();
runInstallSmoke();
if (doInstall) installSmoke();
console.log('\nAll checks passed.');
if (!doInstall) {
  console.log('\nTip: run with --install to also test npx skills add --copy');
}
