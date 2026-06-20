#!/usr/bin/env node
/**
 * generate-specs.mjs — Map codebase and scaffold .specs/ in target repo.
 * Usage: node generate-specs.mjs --target <repo> [--config <install.json>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProfile } from './scan-profile.mjs';
import { mapCodebase } from './map-codebase.mjs';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TPL = path.join(SKILL_ROOT, 'templates', '.specs');

function parseArgs(argv) {
  const args = { target: process.cwd(), config: null, merge: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--target' && argv[i + 1]) args.target = path.resolve(argv[++i]);
    else if (argv[i] === '--config' && argv[i + 1]) args.config = path.resolve(argv[++i]);
    else if (argv[i] === '--merge') args.merge = true;
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

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${destPath}`);
    }
  }
}

function formatLaneCommands(profile) {
  const { lintBuild, unit, e2e } = profile.suggestedLaneCommands;
  const lines = [
    '## Suggested commands (from scan)',
    '',
    '### lint-build',
    '```json',
    JSON.stringify(lintBuild, null, 2),
    '```',
    '',
    '### unit',
    '```json',
    JSON.stringify(unit, null, 2),
    '```',
  ];
  lines.push('', '### e2e', '```json', JSON.stringify(e2e ? { default: e2e } : null, null, 2), '```');
  return lines.join('\n');
}

function enrichInstallVars(vars) {
  const confluenceOn = vars.CONFLUENCE === 'ON';
  return {
    ...vars,
    PROJECT_ONE_LINER:
      vars.PROJECT_ONE_LINER || '_Unknown — describe mission in PROJECT.md after bootstrap._',
    CONFLUENCE_DEPLOY_NOTE: confluenceOn
      ? '- [ ] Confluence / team wiki updated if change impacts whole team'
      : '',
    CONFLUENCE_DELIVERY_SECTION: confluenceOn
      ? '| Field | Value |\n|-------|-------|\n| **Mode** | section / page |\n| **URL** | _pending_ |\n| **Published** | _pending_ |'
      : '_Confluence OFF — skip section 6 or mark N/A._',
    TRACKER_ID_OR_SLUG: vars.TRACKER_ID_OR_SLUG || '<slug>',
    DELIVERY_DATE: vars.DELIVERY_DATE || vars.BOOTSTRAP_DATE || new Date().toISOString().slice(0, 10),
  };
}

function buildTestingStrategy(profile, vars) {
  return [
    '# Testing strategy',
    '',
    `> Generated for **${vars.PROJECT_NAME || 'project'}**. Formal validation lane: [docs/workflow/test-lane.md](../../docs/workflow/test-lane.md).`,
    '',
    '## Frameworks detected',
    '',
    profile.testFrameworks.length
      ? profile.testFrameworks.map((f) => `- ${f}`).join('\n')
      : '_None — add conventions when tests are introduced._',
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
    '## Codebase test map',
    '',
    '- [codebase/TESTING.md](codebase/TESTING.md) — inventory and CI',
    '- [codebase/DISCOVERY.md](codebase/DISCOVERY.md) — discovery index',
    '',
    formatLaneCommands(profile),
    '',
    '## Traceability',
    '',
    'Each acceptance criterion in `.specs/features/` or `.specs/quick/` should map to at least one test or gate check before merge.',
  ].join('\n');
}

function resolveCodebaseMap(target, profile, vars, options = {}) {
  const specsCodebase = path.join(target, '.specs', 'codebase');
  const bootstrapCodebase = path.join(target, 'docs', 'workflow', 'bootstrap', 'codebase');

  if (fs.existsSync(bootstrapCodebase)) {
    const files = fs.readdirSync(bootstrapCodebase).filter((f) => f.endsWith('.md'));
    if (files.length >= 8) {
      copyDirRecursive(bootstrapCodebase, specsCodebase);
      return { source: 'bootstrap', path: bootstrapCodebase };
    }
  }

  const enrichmentPending = !fs.existsSync(bootstrapCodebase);
  mapCodebase(profile, specsCodebase, {
    merge: options.merge,
    vars: {
      ...vars,
      enrichmentPending,
      MAP_STATUS: enrichmentPending
        ? 'scaffold only — run Part A Phase 1b or re-bootstrap with agent enrichment'
        : undefined,
    },
  });

  const profileJsonPath = path.join(specsCodebase, '.profile.json');
  writeFile(profileJsonPath, JSON.stringify(profile, null, 2));
  return { source: enrichmentPending ? 'scaffold-fallback' : 'map', path: specsCodebase };
}

export function generateSpecs(target, vars = {}, options = {}) {
  const profile = buildProfile(target);
  const specsRoot = path.join(target, '.specs');
  const installVars = enrichInstallVars(vars);

  resolveCodebaseMap(target, profile, installVars, options);
  writeFile(path.join(specsRoot, 'testing', 'strategy.md'), buildTestingStrategy(profile, installVars));

  const tplFiles = [
    ['README.md.tpl', 'README.md'],
    ['project/PROJECT.md.tpl', 'project/PROJECT.md'],
    ['project/STATE.md.tpl', 'project/STATE.md'],
    ['project/ROADMAP.md.tpl', 'project/ROADMAP.md'],
    ['project/DEPLOY-PLAN.md.tpl', 'project/DEPLOY-PLAN.md'],
    ['project/context.md.tpl', 'project/context.md'],
    ['features/README.md.tpl', 'features/README.md'],
    ['features/delivery.md.tpl', 'features/delivery.md.tpl'],
    ['quick/README.md.tpl', 'quick/README.md'],
    ['quick/CURRENT-FOCUS.md.tpl', 'quick/CURRENT-FOCUS.md'],
    ['quick/NEXT-ACTIONS.md.tpl', 'quick/NEXT-ACTIONS.md'],
    ['quick/_template.md.tpl', 'quick/_template.md'],
  ];
  for (const [tpl, dest] of tplFiles) {
    writeFromTpl(tpl, path.join(specsRoot, dest), installVars);
  }

  return { profile, specsRoot };
}

function main() {
  const { target, config, merge } = parseArgs(process.argv);
  const vars = config && fs.existsSync(config) ? JSON.parse(fs.readFileSync(config, 'utf8')) : {};
  generateSpecs(target, vars, { merge });
  console.log('Specs generation complete.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
