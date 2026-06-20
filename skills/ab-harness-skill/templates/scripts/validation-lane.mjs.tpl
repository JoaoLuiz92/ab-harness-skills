#!/usr/bin/env node
/**
 * validation-lane.mjs — Generic validation harness (handoff → runners → merge).
 * Config: docs/workflow/lane-commands.json
 * Paths: workflow.config.md (HANDOFF_DIR, REPORTS_DIR, LANE_COMMANDS)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const ROLES = ['lint-build', 'unit', 'integration', 'e2e', 'uat'];

const DEFAULTS = {
  HANDOFF_DIR: '.specs/testing/handoff',
  REPORTS_DIR: '.specs/testing/reports',
  LANE_COMMANDS: 'docs/workflow/lane-commands.json',
};

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

function loadWorkflowConfig() {
  const cfg = { ...DEFAULTS };
  const configPath = path.join(ROOT, 'workflow.config.md');
  if (!fs.existsSync(configPath)) return cfg;
  for (const line of fs.readFileSync(configPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && m[1] in cfg) cfg[m[1]] = m[2].trim();
  }
  return cfg;
}

function resolvePath(rel) {
  return path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
}

function lanePaths() {
  const cfg = loadWorkflowConfig();
  return {
    laneCommands: resolvePath(cfg.LANE_COMMANDS),
    handoffDir: resolvePath(cfg.HANDOFF_DIR),
    reportsDir: resolvePath(cfg.REPORTS_DIR),
  };
}

function loadCommands() {
  const { laneCommands } = lanePaths();
  if (!fs.existsSync(laneCommands)) {
    console.error(`Missing ${laneCommands}. Run ab-harness-skill install.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(laneCommands, 'utf8'));
}

function ensureDirs() {
  const { handoffDir, reportsDir } = lanePaths();
  fs.mkdirSync(handoffDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
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
  const { handoffDir } = lanePaths();
  const handoff = {
    name: args.name,
    tracker: args.tracker || null,
    pattern: args.pattern || null,
    area: args.area || null,
    changedFiles: gitChangedFiles(),
    createdAt: new Date().toISOString(),
    uatMode: 'smart',
  };
  const file = path.join(handoffDir, `${args.name}.json`);
  fs.writeFileSync(file, JSON.stringify(handoff, null, 2), 'utf8');
  console.log(`Handoff: ${file}`);
}

function runnerResult(args, role, result) {
  const { reportsDir } = lanePaths();
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
  const tmp = path.join(reportsDir, `.tmp-${args.name}-${role}.json`);
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
  const { handoffDir, reportsDir } = lanePaths();
  const cfg = loadWorkflowConfig();
  const date = new Date().toISOString().slice(0, 10);
  const rows = [];
  let blockingFail = false;
  for (const role of ROLES) {
    const tmp = path.join(reportsDir, `.tmp-${args.name}-${role}.json`);
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
  const handoffRel = path.join(cfg.HANDOFF_DIR, `${args.name}.json`).replace(/\\/g, '/');
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
    `Handoff: ${handoffRel}`,
  ].join('\n');
  const out = path.join(reportsDir, `${date}-${args.name}.md`);
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

Roles: ${ROLES.join(', ')}

Paths from workflow.config.md: HANDOFF_DIR, REPORTS_DIR, LANE_COMMANDS`);
    process.exit(1);
  }
}

main();
