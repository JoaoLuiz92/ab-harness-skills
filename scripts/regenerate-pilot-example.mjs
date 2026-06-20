#!/usr/bin/env node
/**
 * regenerate-pilot-example.mjs — Refresh bootstrap codebase map in examples/test-pilot-repo.
 * Usage: node scripts/regenerate-pilot-example.mjs [--target <path>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_ROOT = path.join(REPO_ROOT, 'skills', 'ab-harness-skill');
const DEFAULT_TARGET = path.join(REPO_ROOT, 'examples', 'test-pilot-repo');

function parseArgs(argv) {
  const args = { target: DEFAULT_TARGET };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--target' && argv[i + 1]) args.target = path.resolve(argv[++i]);
  }
  return args;
}

function runNode(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Synced ${path.relative(REPO_ROOT, dest)}`);
}

function main() {
  const { target } = parseArgs(process.argv);
  if (!fs.existsSync(target)) {
    console.error(`Target not found: ${target}`);
    process.exit(1);
  }

  const bootstrap = path.join(target, 'docs', 'workflow', 'bootstrap');
  const codebaseOut = path.join(bootstrap, 'codebase');
  const profileJson = path.join(bootstrap, 'profile.json');
  const profileMd = path.join(bootstrap, 'profile.md');

  fs.mkdirSync(codebaseOut, { recursive: true });

  runNode(path.join(SKILL_ROOT, 'scripts', 'scan-profile.mjs'), [
    '--cwd',
    target,
    '--json',
    '--out',
    profileJson,
  ]);
  runNode(path.join(SKILL_ROOT, 'scripts', 'scan-profile.mjs'), [
    '--cwd',
    target,
    '--out',
    profileMd,
  ]);
  runNode(path.join(SKILL_ROOT, 'scripts', 'map-codebase.mjs'), [
    '--cwd',
    target,
    '--profile',
    profileJson,
    '--out',
    codebaseOut,
  ]);

  // Sync session-start pointers that drift from skill templates
  copyIfExists(
    path.join(SKILL_ROOT, 'templates', 'adapters', 'cursor', 'rules', 'workflow-core.mdc'),
    path.join(target, '.cursor', 'rules', 'workflow-core.mdc'),
  );

  const readmeTpl = path.join(SKILL_ROOT, 'templates', 'docs', 'workflow', 'README.md.tpl');
  if (fs.existsSync(readmeTpl)) {
    let name = path.basename(target);
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
      if (pkg.name) name = pkg.name;
    } catch {
      /* ignore */
    }
    const raw = fs.readFileSync(readmeTpl, 'utf8');
    const body = raw
      .replace(/\{\{PROJECT_NAME\}\}/g, name)
      .replace(/\{\{TOOLS_LIST\}\}/g, '- Cursor\n- Codex')
      .replace(/\{\{INTEGRATIONS_SUMMARY\}\}/g, 'JIRA: OFF · GitHub PR: ON · Confluence: OFF');
    fs.mkdirSync(path.join(target, 'docs', 'workflow'), { recursive: true });
    fs.writeFileSync(path.join(target, 'docs', 'workflow', 'README.md'), body, 'utf8');
    console.log(`Synced ${path.relative(REPO_ROOT, path.join(target, 'docs', 'workflow', 'README.md'))}`);
  }

  const agentsTpl = path.join(SKILL_ROOT, 'templates', 'AGENTS.md.tpl');
  if (fs.existsSync(agentsTpl) && fs.existsSync(path.join(target, 'AGENTS.md'))) {
    // Only patch codebase pointer if AGENTS exists without DISCOVERY link
    const agentsPath = path.join(target, 'AGENTS.md');
    let agents = fs.readFileSync(agentsPath, 'utf8');
    if (!agents.includes('DISCOVERY.md')) {
      agents = agents.replace(
        /(- Specs map:.*\n)/,
        '$1- Codebase map: [.specs/codebase/DISCOVERY.md](.specs/codebase/DISCOVERY.md)\n',
      );
      if (!agents.includes('Codebase map')) {
        agents = agents.replace(
          '## Workflow\n',
          '## Workflow\n\n- Codebase map: [.specs/codebase/DISCOVERY.md](.specs/codebase/DISCOVERY.md)\n',
        );
      }
      fs.writeFileSync(agentsPath, agents, 'utf8');
      console.log(`Patched ${path.relative(REPO_ROOT, agentsPath)}`);
    }
  }

  console.log(`Pilot example refreshed: ${target}`);
  console.log(`  bootstrap/codebase: ${codebaseOut}`);
}

main();
