#!/usr/bin/env node
/**
 * generate-specs.mjs — Map codebase and scaffold .specs/ in target repo.
 * Usage: node generate-specs.mjs --target <repo> [--config <install.json>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProfile } from './scan-profile.mjs';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TPL = path.join(SKILL_ROOT, 'templates', '.specs');

function parseArgs(argv) {
  const args = { target: process.cwd(), config: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--target' && argv[i + 1]) args.target = path.resolve(argv[++i]);
    else if (argv[i] === '--config' && argv[i + 1]) args.config = path.resolve(argv[++i]);
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

function writeFile(destPath, content) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  console.log(`Wrote ${destPath}`);
}

function writeFromTpl(tplName, destPath, vars) {
  const tplPath = path.join(TPL, tplName);
  if (!fs.existsSync(tplPath)) return false;
  const raw = fs.readFileSync(tplPath, 'utf8');
  writeFile(destPath, substitute(raw, vars));
  return true;
}

function formatPackages(profile) {
  if (!profile.packages.length) return '_No package manifests detected._';
  return profile.packages
    .map((pkg) => {
      const scripts = pkg.scripts.length ? pkg.scripts.join(', ') : 'none';
      return `### \`${pkg.path}\`\n\n- Name: ${pkg.name || 'n/a'}\n- Scripts: ${scripts}`;
    })
    .join('\n\n');
}

function formatDirs(profile) {
  const dirs = profile.topLevelDirs.slice(0, 40);
  if (!dirs.length) return '_No top-level directories detected._';
  return dirs.map((d) => `- \`${d}\``).join('\n');
}

function formatIntegrationHints(profile) {
  if (!profile.integrationHints.length) return '_None detected from README/package scan._';
  return profile.integrationHints.map((h) => `- **${h.pattern}** mentioned in \`${h.file}\``).join('\n');
}

function formatLaneCommands(profile) {
  const { lintBuild, unit, e2e } = profile.suggestedLaneCommands;
  const lines = ['## Suggested commands (from scan)', '', '### lint-build', '```json', JSON.stringify(lintBuild, null, 2), '```', '', '### unit', '```json', JSON.stringify(unit, null, 2), '```'];
  lines.push('', '### e2e', '```json', JSON.stringify(e2e ? { default: e2e } : null, null, 2), '```');
  return lines.join('\n');
}

function buildCodebaseOverview(profile, vars) {
  return [
    '# Codebase overview',
    '',
    `> Auto-generated at bootstrap. Re-run \`node scripts/generate-specs.mjs\` after major structural changes.`,
    '',
    `**Project:** ${vars.PROJECT_NAME || 'n/a'}`,
    `**Scanned:** ${profile.scannedAt}`,
    `**Root:** \`${profile.root}\``,
    '',
    '## Summary',
    '',
    `- Git repository: ${profile.git ? 'yes' : 'no'}`,
    `- Package managers: ${profile.packageManagers.join(', ') || 'none detected'}`,
    `- Test frameworks: ${profile.testFrameworks.join(', ') || 'none detected'}`,
    `- CI workflows: ${profile.ciWorkflows.length ? profile.ciWorkflows.map((w) => `\`${w}\``).join(', ') : 'none'}`,
    '',
    '## Agent docs already present',
    '',
    profile.agentDocs.length ? profile.agentDocs.map((d) => `- \`${d}\``).join('\n') : '_None detected._',
    '',
    '## Integration hints',
    '',
    formatIntegrationHints(profile),
    '',
    '## Related',
    '',
    '- [structure.md](structure.md) — directories and packages',
    '- [stack.md](stack.md) — tooling and CI',
    '- [../testing/strategy.md](../testing/strategy.md) — test strategy',
  ].join('\n');
}

function buildCodebaseStructure(profile) {
  return [
    '# Codebase structure',
    '',
    `Scanned: ${profile.scannedAt}`,
    '',
    '## Top-level directories',
    '',
    formatDirs(profile),
    '',
    '## Packages',
    '',
    formatPackages(profile),
  ].join('\n');
}

function buildCodebaseStack(profile) {
  const ci = profile.ciWorkflows.length
    ? profile.ciWorkflows.map((w) => `- \`${w}\``).join('\n')
    : '_No CI workflows detected._';
  return [
    '# Stack and tooling',
    '',
    '## Package managers',
    '',
    profile.packageManagers.length ? profile.packageManagers.map((p) => `- ${p}`).join('\n') : '_None detected._',
    '',
    '## Test frameworks (from dependencies)',
    '',
    profile.testFrameworks.length ? profile.testFrameworks.map((f) => `- ${f}`).join('\n') : '_None detected._',
    '',
    '## CI',
    '',
    ci,
  ].join('\n');
}

function buildTestingStrategy(profile, vars) {
  return [
    '# Testing strategy',
    '',
    `> Generated for **${vars.PROJECT_NAME || 'project'}**. Formal validation lane: [docs/workflow/test-lane.md](../../docs/workflow/test-lane.md).`,
    '',
    '## Frameworks detected',
    '',
    profile.testFrameworks.length ? profile.testFrameworks.map((f) => `- ${f}`).join('\n') : '_None — add conventions when tests are introduced._',
    '',
    '## Fast loop (during development)',
    '',
    vars.TEST_CMD ? `- Default: \`${vars.TEST_CMD}\`` : '- Set project test command in AGENTS.md',
    '',
    '## Validation lane (before merge)',
    '',
    '- Config: `docs/workflow/lane-commands.json`',
    '- Handoff: `npm run validation-lane:handoff -- --name <slug> ...`',
    '- Merge report: `docs/workflow/reports/<date>-<slug>.md`',
    '',
    formatLaneCommands(profile),
    '',
    '## Traceability',
    '',
    'Each acceptance criterion in `.specs/features/` or `.specs/quick/` should map to at least one test or gate check before merge.',
  ].join('\n');
}

export function generateSpecs(target, vars = {}) {
  const profile = buildProfile(target);
  const specsRoot = path.join(target, '.specs');

  writeFile(path.join(specsRoot, 'codebase', 'overview.md'), buildCodebaseOverview(profile, vars));
  writeFile(path.join(specsRoot, 'codebase', 'structure.md'), buildCodebaseStructure(profile));
  writeFile(path.join(specsRoot, 'codebase', 'stack.md'), buildCodebaseStack(profile));
  writeFile(path.join(specsRoot, 'testing', 'strategy.md'), buildTestingStrategy(profile, vars));

  const tplFiles = [
    ['README.md.tpl', 'README.md'],
    ['project/context.md.tpl', 'project/context.md'],
    ['features/README.md.tpl', 'features/README.md'],
    ['quick/README.md.tpl', 'quick/README.md'],
    ['quick/_template.md.tpl', 'quick/_template.md'],
  ];
  for (const [tpl, dest] of tplFiles) {
    writeFromTpl(tpl, path.join(specsRoot, dest), vars);
  }

  return { profile, specsRoot };
}

function main() {
  const { target, config } = parseArgs(process.argv);
  const vars = config && fs.existsSync(config) ? JSON.parse(fs.readFileSync(config, 'utf8')) : {};
  generateSpecs(target, vars);
  console.log('Specs generation complete.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
