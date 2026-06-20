#!/usr/bin/env node
/**
 * Validates the skills.sh package layout and runs smoke tests.
 * Usage: node scripts/test-skill-package.mjs [--install]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_ROOT = path.join(REPO_ROOT, 'skills', 'ab-harness-skill');
const SCAN_FIXTURE = path.join(REPO_ROOT, 'tests', 'fixtures', 'minimal-repo');
const BROWNFIELD_FIXTURE = path.join(REPO_ROOT, 'tests', 'fixtures', 'brownfield-repo');
const HARNESS_ONLY_FIXTURE = path.join(REPO_ROOT, 'tests', 'fixtures', 'harness-only-repo');
const INSTALL_FIXTURE = path.join(REPO_ROOT, 'tests', '.tmp-install');

const { computeChecklistStats } = await import(
  pathToFileURL(path.join(SKILL_ROOT, 'scripts', 'map-codebase.mjs')).href
);
const { buildProfile } = await import(
  pathToFileURL(path.join(SKILL_ROOT, 'scripts', 'scan-profile.mjs')).href
);
const { mapCodebase } = await import(
  pathToFileURL(path.join(SKILL_ROOT, 'scripts', 'map-codebase.mjs')).href
);

const CODEBASE_DOCS = [
  'DISCOVERY.md',
  'STACK.md',
  'ARCHITECTURE.md',
  'STRUCTURE.md',
  'CONVENTIONS.md',
  'TESTING.md',
  'INTEGRATIONS.md',
  'CONCERNS.md',
];

const REQUIRED = [
  'SKILL.md',
  'references/methodology/sdd.md',
  'references/codebase-mapping-protocol.md',
  'templates/workflow.config.md.tpl',
  'templates/.specs/project/PROJECT.md.tpl',
  'templates/.specs/project/STATE.md.tpl',
  'templates/.specs/project/ROADMAP.md.tpl',
  'templates/.specs/project/DEPLOY-PLAN.md.tpl',
  'templates/.specs/quick/CURRENT-FOCUS.md.tpl',
  'templates/.specs/quick/NEXT-ACTIONS.md.tpl',
  'templates/.specs/features/delivery.md.tpl',
  'templates/.specs/testing/GATE-CHECKS.md.tpl',
  'templates/.specs/testing/SUBAGENTS-FLOW.md.tpl',
  'templates/.specs/testing/STRATEGY.md.tpl',
  'templates/.specs/testing/MODEL-ROUTING.md.tpl',
  'templates/adapters/cursor/rules/model-routing.mdc',
  'templates/docs/workflow/upgrade-v1.3-to-v1.4.md.tpl',
  'CHANGELOG.md',
  'templates/.specs/testing/runners/lint-build.md.tpl',
  'scripts/scan-profile.mjs',
  'scripts/map-codebase.mjs',
  'scripts/install-harness.mjs',
  'scripts/generate-specs.mjs',
  'scripts/extractors/index.mjs',
  'scripts/extractors/deep-analysis.mjs',
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

  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  const skillRaw = fs.readFileSync(path.join(SKILL_ROOT, 'SKILL.md'), 'utf8');
  const verMatch = skillRaw.match(/version:\s*"([^"]+)"/);
  if (!verMatch) fail('SKILL.md missing metadata.version');
  if (pkg.version !== verMatch[1]) {
    fail(`version mismatch: package.json ${pkg.version} vs SKILL.md ${verMatch[1]}`);
  }
  ok(`version sync package.json ↔ SKILL.md (${pkg.version})`);

  const list = run('npx', ['skills', 'add', '.', '--list', '-y'], { cwd: REPO_ROOT });
  if (list.status !== 0) fail(`npx skills add --list failed:\n${list.out}`);
  if (!/ab-harness-skill/.test(list.out)) fail('CLI did not discover ab-harness-skill');
  ok('npx skills add --list discovers ab-harness-skill');

  const staleHits = [];
  function walkStale(dir) {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, name.name);
      if (name.isDirectory()) walkStale(p);
      else if (/\.(md|mdc|tpl)$/.test(name.name)) {
        const body = fs.readFileSync(p, 'utf8');
        if (/overview\.md/.test(body)) staleHits.push(path.relative(SKILL_ROOT, p));
      }
    }
  }
  walkStale(SKILL_ROOT);
  if (staleHits.length) fail(`stale overview.md references in:\n${staleHits.join('\n')}`);
  ok('no stale overview.md references in skill templates');
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
    '.specs/project/PROJECT.md',
    '.specs/project/STATE.md',
    '.specs/project/ROADMAP.md',
    '.specs/project/DEPLOY-PLAN.md',
    '.specs/project/context.md',
    '.specs/quick/CURRENT-FOCUS.md',
    '.specs/quick/NEXT-ACTIONS.md',
    '.specs/features/delivery.md.tpl',
    '.specs/testing/STRATEGY.md',
    '.specs/testing/GATE-CHECKS.md',
    '.specs/testing/SUBAGENTS.md',
    '.specs/testing/SUBAGENTS-FLOW.md',
    '.specs/testing/TEST-LANE-CLI.md',
    '.specs/testing/CONTEXT-BOUNDARIES.md',
    '.specs/testing/MODEL-ROUTING.md',
    '.specs/testing/runners/lint-build.md',
    '.specs/testing/runners/unit.md',
    '.specs/testing/runners/integration.md',
    '.specs/testing/runners/e2e.md',
    '.specs/testing/runners/uat.md',
    '.specs/testing/handoff/.gitkeep',
    '.specs/testing/reports/TEMPLATE.md',
    'docs/workflow/upgrade-v1.3-to-v1.4.md',
    'scripts/generate-specs.mjs',
    'scripts/map-codebase.mjs',
    ...CODEBASE_DOCS.map((f) => `.specs/codebase/${f}`),
  ];
  for (const rel of required) {
    if (!fs.existsSync(path.join(fixture, rel))) fail(`install missing ${rel}`);
  }
  const readme = fs.readFileSync(path.join(fixture, '.specs/README.md'), 'utf8');
  if (!readme.includes('CURRENT-FOCUS')) fail('.specs/README.md missing GIA session order');
  const agents = fs.readFileSync(path.join(fixture, 'AGENTS.md'), 'utf8');
  if (!/CURRENT-FOCUS/.test(agents)) fail('AGENTS.md missing CURRENT-FOCUS session start');
  if (!/\.specs\/testing\/SUBAGENTS-FLOW/.test(agents)) fail('AGENTS.md missing .specs/testing lane pointer');
  if (!/Source of truth/i.test(agents)) fail('AGENTS.md missing Source of truth section');
  if (!/MODEL-ROUTING/.test(agents)) fail('AGENTS.md missing MODEL-ROUTING pointer');
  if (!fs.existsSync(path.join(fixture, '.cursor/rules/model-routing.mdc'))) {
    fail('install missing .cursor/rules/model-routing.mdc');
  }
  const modelRouting = fs.readFileSync(path.join(fixture, '.cursor/rules/validation-lane.mdc'), 'utf8');
  if (!/S0/.test(modelRouting) || !/S1/.test(modelRouting)) {
    fail('validation-lane.mdc missing S0/S1 model routing');
  }
  const workflowCfg = fs.readFileSync(path.join(fixture, 'workflow.config.md'), 'utf8');
  if (!workflowCfg.includes('HANDOFF_DIR=.specs/testing/handoff')) {
    fail('workflow.config.md missing .specs/testing/handoff path');
  }
  const subagentsFlow = fs.readFileSync(path.join(fixture, '.specs/testing/SUBAGENTS-FLOW.md'), 'utf8');
  if (!subagentsFlow.includes('validation-lane:handoff')) fail('SUBAGENTS-FLOW.md missing handoff CLI');
  const discovery = fs.readFileSync(path.join(fixture, '.specs/codebase/DISCOVERY.md'), 'utf8');
  if (!discovery.includes('STACK.md')) fail('DISCOVERY.md missing cross-links');
  const concerns = fs.readFileSync(path.join(fixture, '.specs/codebase/CONCERNS.md'), 'utf8');
  if (concerns.split('\n').length < 5) fail('CONCERNS.md too short');
  fs.rmSync(fixture, { recursive: true, force: true });
  ok('install-harness creates docs/workflow and .specs tree (8 codebase + project + quick + testing lane)');
}

function runValidationLaneSmoke() {
  const fixture = path.join(REPO_ROOT, 'tests', '.tmp-lane-smoke');
  fs.rmSync(fixture, { recursive: true, force: true });
  fs.mkdirSync(fixture, { recursive: true });
  fs.copyFileSync(
    path.join(SCAN_FIXTURE, 'package.json'),
    path.join(fixture, 'package.json'),
  );
  fs.writeFileSync(path.join(fixture, 'README.md'), '# lane smoke\n');

  const config = path.join(SKILL_ROOT, 'scripts', 'install-config.example.json');
  const install = spawnSync(
    process.execPath,
    [path.join(SKILL_ROOT, 'scripts', 'install-harness.mjs'), '--config', config, '--target', fixture],
    { encoding: 'utf8', cwd: REPO_ROOT },
  );
  if (install.status !== 0) fail(`lane smoke install failed:\n${install.stderr || install.stdout}`);

  const slug = 'smoke-v14';
  const handoff = spawnSync(
    process.execPath,
    [path.join(fixture, 'scripts/validation-lane.mjs'), '--write-handoff', '--name', slug, '--pattern', 'minimal'],
    { encoding: 'utf8', cwd: fixture },
  );
  if (handoff.status !== 0) fail(`handoff failed:\n${handoff.stderr || handoff.stdout}`);

  const handoffPath = path.join(fixture, '.specs/testing/handoff', `${slug}.json`);
  if (!fs.existsSync(handoffPath)) fail(`handoff JSON missing at ${handoffPath}`);

  for (const role of ['lint-build', 'unit', 'integration', 'e2e', 'uat']) {
    const runner = spawnSync(
      process.execPath,
      [
        path.join(fixture, 'scripts/validation-lane.mjs'),
        '--runner',
        role,
        '--name',
        slug,
        '--pattern',
        'minimal',
      ],
      { encoding: 'utf8', cwd: fixture },
    );
    if (runner.status !== 0) fail(`runner ${role} failed:\n${runner.stderr || runner.stdout}`);
  }

  const merge = spawnSync(
    process.execPath,
    [path.join(fixture, 'scripts/validation-lane.mjs'), '--merge', '--name', slug],
    { encoding: 'utf8', cwd: fixture },
  );
  if (merge.status !== 0) fail(`merge failed:\n${merge.stderr || merge.stdout}`);

  const reportsDir = path.join(fixture, '.specs/testing/reports');
  const reports = fs.readdirSync(reportsDir).filter((f) => f.endsWith(`-${slug}.md`));
  if (!reports.length) fail('merge did not produce dated report in .specs/testing/reports/');

  const reportBody = fs.readFileSync(path.join(reportsDir, reports[0]), 'utf8');
  if (!/APROVADO/.test(reportBody)) fail('lane report should be APROVADO');
  if (!reportBody.includes('Consolidated by validation-lane merge')) fail('report missing merge banner');

  fs.rmSync(fixture, { recursive: true, force: true });
  ok('validation lane smoke: handoff → 5 runners → merge → .specs/testing/reports/');
}

function runMapCodebaseSmoke() {
  const outDir = path.join(BROWNFIELD_FIXTURE, '.tmp-codebase-map');
  fs.rmSync(outDir, { recursive: true, force: true });

  const profilePath = path.join(BROWNFIELD_FIXTURE, '.tmp-profile.json');
  const scan = spawnSync(
    process.execPath,
    [
      path.join(SKILL_ROOT, 'scripts', 'scan-profile.mjs'),
      '--cwd',
      BROWNFIELD_FIXTURE,
      '--json',
      '--out',
      profilePath,
    ],
    { encoding: 'utf8', cwd: REPO_ROOT },
  );
  if (scan.status !== 0) fail(`brownfield scan failed:\n${scan.stderr || scan.stdout}`);

  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  if (!profile.packages?.length) fail('brownfield profile missing packages');
  if (!profile.envVars?.length) fail('brownfield profile missing envVars');
  if (!profile.ciJobs?.length) fail('brownfield profile missing ciJobs');

  const map = spawnSync(
    process.execPath,
    [
      path.join(SKILL_ROOT, 'scripts', 'map-codebase.mjs'),
      '--cwd',
      BROWNFIELD_FIXTURE,
      '--profile',
      profilePath,
      '--out',
      outDir,
    ],
    { encoding: 'utf8', cwd: REPO_ROOT },
  );
  if (map.status !== 0) fail(`map-codebase failed:\n${map.stderr || map.stdout}`);

  for (const doc of CODEBASE_DOCS) {
    const p = path.join(outDir, doc);
    if (!fs.existsSync(p)) fail(`map-codebase missing ${doc}`);
    const body = fs.readFileSync(p, 'utf8');
    if (body.length < 100) fail(`${doc} output too short`);
  }

  const stack = fs.readFileSync(path.join(outDir, 'STACK.md'), 'utf8');
  if (!/backend|frontend/i.test(stack)) fail('STACK.md missing monorepo packages');
  if (!/lint|test|build/i.test(stack)) fail('STACK.md missing CI/commands depth');

  const arch = fs.readFileSync(path.join(outDir, 'ARCHITECTURE.md'), 'utf8');
  if (!/backend\/src\/main|UsersModule|react-route/i.test(arch)) fail('ARCHITECTURE.md lacks code-derived modules/routes');
  if (!/mermaid/i.test(arch)) fail('ARCHITECTURE.md missing layer diagram');

  const struct = fs.readFileSync(path.join(outDir, 'STRUCTURE.md'), 'utf8');
  if (!/backend|frontend/i.test(struct)) fail('STRUCTURE.md missing annotated tree');

  const integrations = fs.readFileSync(path.join(outDir, 'INTEGRATIONS.md'), 'utf8');
  if (!/DATABASE_URL|JWT_SECRET|VITE_API_URL/i.test(integrations)) fail('INTEGRATIONS.md missing env vars');

  const concerns = fs.readFileSync(path.join(outDir, 'CONCERNS.md'), 'utf8');
  if (!/\| (High|Medium|Low) \|/i.test(concerns)) fail('CONCERNS.md missing severity table');

  const testing = fs.readFileSync(path.join(outDir, 'TESTING.md'), 'utf8');
  if (!/jest|vitest/i.test(testing)) fail('TESTING.md missing frameworks');
  if (!/\.spec\.|\.test\./i.test(testing)) fail('TESTING.md missing test inventory');

  const stats = computeChecklistStats(profile);
  if (stats.applicablePct < 80) fail(`brownfield applicable checklist ${stats.applicablePct}% < 80%`);
  if (!stats.gatePassed) fail('brownfield checklist gate should pass');

  fs.unlinkSync(profilePath);
  fs.rmSync(outDir, { recursive: true, force: true });
  ok('map-codebase smoke test on tests/fixtures/brownfield-repo');
}

function runHarnessOnlyGateSmoke() {
  const outDir = path.join(HARNESS_ONLY_FIXTURE, '.tmp-codebase-map');
  fs.rmSync(outDir, { recursive: true, force: true });

  const profile = buildProfile(HARNESS_ONLY_FIXTURE);
  if (!profile.deep?.harness?.isHarnessRepo) fail('harness-only fixture should detect isHarnessRepo');

  mapCodebase(profile, outDir);
  const stats = computeChecklistStats(profile);
  if (!stats.harnessOnly) fail('harness-only stats.harnessOnly should be true');
  if (!stats.gatePassed) fail(`harness-only gate failed (${stats.applicableChecked}/${stats.applicableTotal})`);

  const discovery = fs.readFileSync(path.join(outDir, 'DISCOVERY.md'), 'utf8');
  if (!/\[~\]/.test(discovery) || !/harness repo/i.test(discovery)) {
    fail('DISCOVERY.md missing N/A checklist items');
  }
  if (!/gate \*\*passed\*\*/i.test(discovery)) fail('DISCOVERY.md gate should show passed');

  fs.rmSync(outDir, { recursive: true, force: true });
  ok('harness-only-repo checklist gate passes with N/A items');
}

function runMergeRefreshSmoke() {
  const outDir = path.join(BROWNFIELD_FIXTURE, '.tmp-merge-map');
  fs.rmSync(outDir, { recursive: true, force: true });

  const profile = buildProfile(BROWNFIELD_FIXTURE);
  mapCodebase(profile, outDir);

  const stackPath = path.join(outDir, 'STACK.md');
  let stack = fs.readFileSync(stackPath, 'utf8');
  const manualNote = '## Team notes\n\nManual preservation test paragraph.\n';
  stack = stack.replace('# Stack', `# Stack\n\n${manualNote}`);
  fs.writeFileSync(stackPath, stack, 'utf8');

  profile.testFrameworks = [...(profile.testFrameworks || []), 'playwright-extra-fixture'];
  mapCodebase(profile, outDir, { merge: true });

  const merged = fs.readFileSync(stackPath, 'utf8');
  if (!merged.includes('Manual preservation test paragraph.')) {
    fail('merge did not preserve manual content outside auto blocks');
  }
  if (!merged.includes('playwright-extra-fixture')) {
    fail('merge did not refresh auto sections with updated profile');
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  ok('map-codebase --merge preserves manual content and refreshes auto sections');
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
runMapCodebaseSmoke();
runHarnessOnlyGateSmoke();
runMergeRefreshSmoke();
runInstallSmoke();
runValidationLaneSmoke();
if (doInstall) installSmoke();
console.log('\nAll checks passed.');
if (!doInstall) {
  console.log('\nTip: run with --install to also test npx skills add --copy');
}
