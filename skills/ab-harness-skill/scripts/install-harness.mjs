#!/usr/bin/env node
/**
 * install-harness.mjs — Apply templates to target repo.
 * Usage: node install-harness.mjs --config install-config.json --target /path/to/repo
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSpecs } from './generate-specs.mjs';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TPL = path.join(SKILL_ROOT, 'templates');

function parseArgs(argv) {
  const args = { config: null, target: process.cwd() };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--config' && argv[i + 1]) args.config = path.resolve(argv[++i]);
    else if (argv[i] === '--target' && argv[i + 1]) args.target = path.resolve(argv[++i]);
  }
  if (!args.config) {
    console.error('Usage: node install-harness.mjs --config <json> [--target <repo>]');
    process.exit(1);
  }
  return args;
}

function substitute(content, vars) {
  let out = content;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ''));
  }
  return out;
}

function writeFromTpl(tplPath, destPath, vars) {
  if (!fs.existsSync(tplPath)) return false;
  const raw = fs.readFileSync(tplPath, 'utf8');
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, substitute(raw, vars), 'utf8');
  console.log(`Wrote ${destPath}`);
  return true;
}

function copyDirRules(srcDir, destDir, vars, filter) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const f of fs.readdirSync(srcDir)) {
    if (filter && !filter(f)) continue;
    const src = path.join(srcDir, f);
    const dest = path.join(destDir, f);
    const raw = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, substitute(raw, vars), 'utf8');
    console.log(`Wrote ${dest}`);
  }
}

function mergePackageScripts(target, fragmentPath) {
  const pkgPath = path.join(target, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.warn('No package.json — skip scripts merge');
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const fragment = JSON.parse(fs.readFileSync(fragmentPath, 'utf8'));
  pkg.scripts = { ...pkg.scripts, ...fragment };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log('Merged package.json scripts');
}

function main() {
  const { config, target } = parseArgs(process.argv);
  const vars = JSON.parse(fs.readFileSync(config, 'utf8'));
  const tools = (vars.TOOLS || '').split(',').map((t) => t.trim());

  writeFromTpl(path.join(TPL, 'workflow.config.md.tpl'), path.join(target, 'workflow.config.md'), vars);
  writeFromTpl(path.join(TPL, 'AGENTS.md.tpl'), path.join(target, 'AGENTS.md'), vars);

  if (tools.includes('claude')) {
    writeFromTpl(path.join(TPL, 'CLAUDE.md.tpl'), path.join(target, 'CLAUDE.md'), vars);
  }

  const workflowTplDir = path.join(TPL, 'docs/workflow');
  for (const f of fs.readdirSync(workflowTplDir)) {
    if (!f.endsWith('.tpl')) continue;
    const base = f.replace(/\.tpl$/, '');
    writeFromTpl(path.join(workflowTplDir, f), path.join(target, 'docs/workflow', base), vars);
  }

  writeFromTpl(
    path.join(TPL, 'scripts/validation-lane.mjs.tpl'),
    path.join(target, 'scripts/validation-lane.mjs'),
    vars,
  );

  for (const script of ['scan-profile.mjs', 'generate-specs.mjs']) {
    const src = path.join(SKILL_ROOT, 'scripts', script);
    const dest = path.join(target, 'scripts', script);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`Wrote ${dest}`);
  }

  mergePackageScripts(target, path.join(TPL, 'package.json.scripts.fragment'));

  if (tools.includes('cursor')) {
    const jiraOn = vars.JIRA_TASKS === 'ON';
    const githubOn = vars.GITHUB_PULL_REQUESTS === 'ON';
    const confOn = vars.CONFLUENCE === 'ON';
    copyDirRules(path.join(TPL, 'adapters/cursor/rules'), path.join(target, '.cursor/rules'), vars, (f) => {
      if (f.includes('jira') && !jiraOn) return false;
      if (f.includes('local') && jiraOn) return false;
      if (f.includes('create-pr') && !githubOn) return false;
      if (f.includes('document-wiki') && !confOn) return false;
      return true;
    });
  }

  if (tools.includes('claude')) {
    const jiraOn = vars.JIRA_TASKS === 'ON';
    const githubOn = vars.GITHUB_PULL_REQUESTS === 'ON';
    const confOn = vars.CONFLUENCE === 'ON';
    copyDirRules(path.join(TPL, 'adapters/claude/rules'), path.join(target, '.claude/rules'), vars, (f) => {
      if (f.includes('jira') && !jiraOn) return false;
      if (f.includes('local') && jiraOn) return false;
      if (f.includes('create-pr') && !githubOn) return false;
      if (f.includes('document-wiki') && !confOn) return false;
      return true;
    });
  }

  if (tools.includes('codex')) {
    fs.mkdirSync(path.join(target, '.codex'), { recursive: true });
    fs.copyFileSync(
      path.join(TPL, 'adapters/codex/config.toml.example'),
      path.join(target, '.codex/config.toml.example'),
    );
    console.log(`Wrote ${path.join(target, '.codex/config.toml.example')}`);
  }

  fs.mkdirSync(path.join(target, 'docs/workflow/bootstrap'), { recursive: true });

  generateSpecs(target, vars);

  console.log('Install complete.');
}

main();
