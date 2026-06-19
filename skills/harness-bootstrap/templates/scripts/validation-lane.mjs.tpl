#!/usr/bin/env node
/**
 * validation-lane.mjs — Generic validation harness (handoff → runners → merge).
 * Config: docs/workflow/lane-commands.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const LANE_COMMANDS = path.join(ROOT, 'docs/workflow/lane-commands.json');
const HANDOFF_DIR = path.join(ROOT, 'docs/workflow/handoff');
const REPORTS_DIR = path.join(ROOT, 'docs/workflow/reports');

const ROLES = ['lint-build', 'unit', 'integration', 'e2e', 'uat'];

function parseArgs(argv) {
  const args = {
    writeHandoff: false,
    merge: false,
    runner: null,
    name: null,
    tracker: null,
    pattern: null,
    area: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write-handoff') args.writeHandoff = true;
    else if (a === '--merge') args.merge = true;
    else if (a === '--runner' && argv[i + 1]) args.runner = argv[++i];
    else if (a === '--name' && argv[i + 1]) args.name = argv[++i];
    else if (a === '--tracker' && argv[i + 1]) args.tracker = argv[++i];
    else if (a === '--pattern' && argv[i + 1]) args.pattern = argv[++i];
    else if (a === '--area' && argv[i + 1]) args.area = argv[++i];
  }
  return args;
}

function loadCommands() {
  if (!fs.existsSync(LANE_COMMANDS)) {
    console.error(`Missing ${LANE_COMMANDS}. Run harness-bootstrap install.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(LANE_COMMANDS, 'utf8'));
}

function ensureDirs() {
  fs.mkdirSync(HANDOFF_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function runShell(cmd, label) {
  if (!cmd) return { exitCode: 0, skipped: true, summary: `${label}: no command configured` };
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { exitCode: 0, skipped: false, summary: `${label}: PASS`, output: out.slice(-2000) };
  } catch (e) {
    const code = e.status ?? 1;
    const stderr = (e.stderr || e.message || '').toString().slice(-2000);
    return { exitCode: code, skipped: false, summary: `${label}: FAIL (exit ${code})`, output: stderr };
  }
}

function runMapCommands(map, label, pattern) {
  if (!map || (typeof map === 'object' && Object.keys(map).length === 0)) {
    return { exitCode: 0, skipped: true, summary: `${label}: SKIP (not configured)` };
  }
  if (typeof map === 'string') {
    const cmd = pattern ? map.replace(/\{\{pattern\}\}/g, pattern) : map;
    return runShell(cmd, label);
  }
  let worst = 0;
  const parts = [];
  for (const [key, cmdTemplate] of Object.entries(map)) {
    const cmd = pattern ? cmdTemplate.replace(/\{\{pattern\}\}/g, pattern) : cmdTemplate;
    const r = runShell(cmd, `${label}/${key}`);
    parts.push(r.summary);
    if (r.exitCode !== 0 && !r.skipped) worst = r.exitCode;
  }
  return {
    exitCode: worst,
    skipped: false,
    summary: parts.join('; '),
  };
}

function gitChangedFiles() {
  try {
    execSync('git rev-parse HEAD', { cwd: ROOT, stdio: 'ignore' });
    const out = execSync('git diff --name-only HEAD', { cwd: ROOT, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch {
    try {
      const out = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
      return out
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((l) => l.slice(3).trim());
    } catch {
      return [];
    }
  }
}

function writeHandoff(args) {
  ensureDirs();
  if (!args.name) {
    console.error('--name required for handoff');
    process.exit(1);
  }
  const handoff = {
    name: args.name,
    tracker: args.tracker || null,
    pattern: args.pattern || null,
    area: args.area || null,
    changedFiles: gitChangedFiles(),
    createdAt: new Date().toISOString(),
    uatMode: 'smart',
  };
  const file = path.join(HANDOFF_DIR, `${args.name}.json`);
  fs.writeFileSync(file, JSON.stringify(handoff, null, 2), 'utf8');
  console.log(`Handoff: ${file}`);
}

function runnerResult(args, role, result) {
  const status = result.skipped ? 'SKIP' : result.exitCode === 0 ? 'PASS' : 'FAIL';
  const payload = {
    role,
    slug: args.name,
    tracker: args.tracker || null,
    status,
    exitCode: result.exitCode,
    summary: result.summary,
    timestamp: new Date().toISOString(),
  };
  const tmp = path.join(REPORTS_DIR, `.tmp-${args.name}-${role}.json`);
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`${status}: ${tmp}`);
  return result.exitCode === 0 || result.skipped ? 0 : 1;
}

function runRunner(args) {
  ensureDirs();
  if (!args.name || !args.runner) {
    console.error('--name and --runner required');
    process.exit(1);
  }
  if (!ROLES.includes(args.runner)) {
    console.error(`Unknown runner: ${args.runner}. Use: ${ROLES.join(', ')}`);
    process.exit(1);
  }
  const cmds = loadCommands();
  const pattern = args.pattern || '';
  let result;
  switch (args.runner) {
    case 'lint-build':
      result = runMapCommands(cmds.lintBuild, 'lint-build', pattern);
      break;
    case 'unit':
      result = runMapCommands(cmds.unit, 'unit', pattern);
      break;
    case 'integration':
      result = runMapCommands(cmds.integration || cmds.unit, 'integration', pattern);
      break;
    case 'e2e':
      result = runMapCommands(cmds.e2e, 'e2e', pattern);
      break;
    case 'uat':
      if (cmds.uat === null || cmds.uat === undefined) {
        result = { exitCode: 0, skipped: true, summary: 'uat: SKIP (not applicable)' };
      } else {
        result = runMapCommands(cmds.uat, 'uat', pattern);
      }
      break;
    default:
      result = { exitCode: 1, skipped: false, summary: 'unknown runner' };
  }
  process.exit(runnerResult(args, args.runner, result));
}

function mergeReports(args) {
  ensureDirs();
  if (!args.name) {
    console.error('--name required for merge');
    process.exit(1);
  }
  const date = new Date().toISOString().slice(0, 10);
  const rows = [];
  let blockingFail = false;
  for (const role of ROLES) {
    const tmp = path.join(REPORTS_DIR, `.tmp-${args.name}-${role}.json`);
    if (!fs.existsSync(tmp)) {
      rows.push({ role, status: 'MISSING', summary: 'runner did not run' });
      blockingFail = true;
      continue;
    }
    const data = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    rows.push(data);
    if (data.status === 'FAIL') blockingFail = true;
  }
  const trackerLine = args.tracker ? `\n- **Tracker**: ${args.tracker}` : '';
  const md = [
    `# Validation Lane Report — ${args.name} — ${date}`,
    '',
    `> Consolidated by validation-lane merge from ${ROLES.length} runner evidence files.`,
    trackerLine,
    '',
    '## Results',
    '',
    '| Runner | Status | Summary |',
    '|--------|--------|---------|',
    ...rows.map((r) => `| ${r.role} | ${r.status} | ${(r.summary || '').replace(/\|/g, '\\|')} |`),
    '',
    `## Overall: ${blockingFail ? 'REPROVADO' : 'APROVADO'}`,
    '',
    `Handoff: docs/workflow/handoff/${args.name}.json`,
  ].join('\n');
  const out = path.join(REPORTS_DIR, `${date}-${args.name}.md`);
  fs.writeFileSync(out, md, 'utf8');
  console.log(`Report: ${out}`);
  process.exit(blockingFail ? 1 : 0);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.writeHandoff) writeHandoff(args);
  else if (args.merge) mergeReports(args);
  else if (args.runner) runRunner(args);
  else {
    console.log(`Usage:
  --write-handoff --name <slug> [--tracker KEY] [--pattern P] [--area PATH]
  --runner <role> --name <slug> [--pattern P]
  --merge --name <slug> [--tracker KEY]

Roles: ${ROLES.join(', ')}`);
    process.exit(1);
  }
}

main();
