#!/usr/bin/env node
/**
 * map-codebase.mjs — Transform profile.json into 8 deep codebase docs (GIA-style).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProfile } from './scan-profile.mjs';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TPL_DIR = path.join(SKILL_ROOT, 'templates', '.specs', 'codebase');

const DOC_FILES = [
  'DISCOVERY.md',
  'STACK.md',
  'ARCHITECTURE.md',
  'STRUCTURE.md',
  'CONVENTIONS.md',
  'TESTING.md',
  'INTEGRATIONS.md',
  'CONCERNS.md',
];

function parseArgs(argv) {
  const args = { cwd: process.cwd(), profile: null, out: null, merge: false, json: false, vars: {} };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--cwd' && argv[i + 1]) args.cwd = path.resolve(argv[++i]);
    else if (argv[i] === '--profile' && argv[i + 1]) args.profile = path.resolve(argv[++i]);
    else if (argv[i] === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (argv[i] === '--vars' && argv[i + 1]) args.vars = JSON.parse(argv[++i]);
    else if (argv[i] === '--merge') args.merge = true;
    else if (argv[i] === '--json') args.json = true;
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

function mergeAutoSections(existing, generated) {
  const genAutoRe = /<!-- auto(?::[\w-]+)? -->[\s\S]*?<!-- \/auto -->/g;
  const genBlocks = [...generated.matchAll(genAutoRe)].map((x) => x[0]);
  const exAutoRe = /<!-- auto(?::[\w-]+)? -->[\s\S]*?<!-- \/auto -->/g;
  const exBlocks = [...existing.matchAll(exAutoRe)].map((x) => x[0]);

  let result = existing;
  for (let i = 0; i < genBlocks.length; i++) {
    const genBlock = genBlocks[i];
    const tagMatch = genBlock.match(/<!-- auto(?::([\w-]+))? -->/);
    const tag = tagMatch?.[1];
    if (tag) {
      const exPattern = new RegExp(`<!-- auto:${tag} -->[\\s\\S]*?<!-- /auto -->`);
      if (exPattern.test(result)) {
        result = result.replace(exPattern, genBlock);
        continue;
      }
    }
    if (exBlocks[i]) result = result.replace(exBlocks[i], genBlock);
  }

  const agentRe = /<!-- AGENT:complete -->[\s\S]*?<!-- \/AGENT -->/g;
  const agentBlocks = [...existing.matchAll(agentRe)].map((x) => x[0]);
  for (const block of agentBlocks) {
    const agentContent = block.replace(/<!-- AGENT:complete -->|<!-- \/AGENT -->/g, '').trim();
    if (agentContent && !agentContent.startsWith('_Pending') && !agentContent.startsWith('_Optional')) {
      result = result.replace(agentRe, block);
    }
  }
  return result;
}

function deep(profile) {
  return profile.deep || {};
}

function formatPackagesTable(packages) {
  if (!packages?.length) return '_No package manifests detected._';
  return packages
    .map((pkg) => {
      const dir = path.dirname(pkg.path);
      const label = dir === '.' ? 'root' : dir;
      const scripts = pkg.scripts?.length ? pkg.scripts.join(', ') : 'none';
      const versions = pkg.mainVersions
        ? Object.entries(pkg.mainVersions).map(([k, v]) => `${k}@${v}`).join(', ')
        : '';
      return `| \`${label}\` | ${pkg.name || 'n/a'} | ${scripts} | ${versions || '—'} |`;
    })
    .join('\n');
}

function formatCommandsTable(packages) {
  if (!packages?.length) return '_No scripts detected._';
  const rows = [];
  for (const pkg of packages) {
    const dir = path.dirname(pkg.path);
    const label = dir === '.' ? 'root' : dir;
    const prefix = dir === '.' ? '' : `cd ${dir} && `;
    if (pkg.devScript) rows.push(`| dev | \`${label}\` | \`${prefix}npm run ${String(pkg.devScript).replace(/^npm run /, '')}\` |`);
    if (pkg.testScript) rows.push(`| test | \`${label}\` | \`${prefix}npm test\` |`);
    if (pkg.lintScript) rows.push(`| lint | \`${label}\` | \`${prefix}npm run lint\` |`);
    if (pkg.buildScript) rows.push(`| build | \`${label}\` | \`${prefix}npm run build\` |`);
  }
  if (!rows.length) return '_No npm scripts detected._';
  return '| Kind | Package | Command |\n|------|---------|--------|\n' + rows.join('\n');
}

function formatModulesDetailed(profile) {
  const modules = profile.modules || [];
  if (!modules.length) return '_No modules detected._';
  return modules.slice(0, 25).map((m) => {
    let line = `- **${m.name}** (\`${m.path}\`) — ${m.type}`;
    if (m.imports?.length) line += `\n  - imports: ${m.imports.join(', ')}`;
    if (m.controllers?.length) line += `\n  - controllers: ${m.controllers.join(', ')}`;
    if (m.providers?.length) line += `\n  - providers: ${m.providers.join(', ')}`;
    return line;
  }).join('\n');
}

function formatEntryPointsDetailed(profile) {
  const analysis = deep(profile).entryPointAnalysis || [];
  if (!analysis.length) {
    return (profile.entryPoints || []).map((e) => `- \`${e}\``).join('\n') || '_None detected._';
  }
  return analysis.map((ep) => {
    const lines = [`- \`${ep.path}\` (${ep.lineCount} lines)`];
    if (ep.patterns.length) lines.push(`  - ${ep.patterns.join(', ')}`);
    if (ep.localImports.length) lines.push(`  - imports: ${ep.localImports.slice(0, 5).map((i) => `\`${i}\``).join(', ')}`);
    return lines.join('\n');
  }).join('\n');
}

function formatPackageRoles(profile) {
  const roles = deep(profile).packageRoles || [];
  if (!roles.length) return '_Single package or roles not inferred._';
  return '| Path | Name | Role | Frameworks |\n|------|------|------|------------|\n' +
    roles.map((r) => `| \`${r.path}\` | ${r.name || 'n/a'} | ${r.role} | ${r.frameworks || '—'} |`).join('\n');
}

function formatAnnotatedTree(profile) {
  const tree = deep(profile).annotatedTree || [];
  return tree.length ? tree.join('\n') : (profile.topLevelDirs || []).slice(0, 30).map((d) => `- \`${d}\``).join('\n');
}

function formatNamingConventions(profile) {
  const conv = deep(profile).namingConventions || [];
  if (!conv.length) return '_No dominant file suffix patterns detected._';
  return '| Suffix | Count | Typical use |\n|--------|-------|-------------|\n' +
    conv.map((c) => {
      const use =
        c.suffix.includes('controller') ? 'HTTP handlers' :
        c.suffix.includes('service') ? 'Business logic' :
        c.suffix.includes('module') ? 'Module boundary' :
        c.suffix.includes('guard') ? 'Auth guards' :
        c.suffix.includes('spec') || c.suffix.includes('test') ? 'Tests' : 'Project convention';
      return `| \`${c.suffix}\` | ${c.count} | ${use} |`;
    }).join('\n');
}

function formatTestHelpers(profile) {
  const h = deep(profile).testHelpers || {};
  const lines = [];
  if (h.patterns?.length) lines.push('**Patterns:** ' + h.patterns.join(', '));
  if (h.setup?.length) lines.push('**Setup files:**\n' + h.setup.map((f) => `- \`${f}\``).join('\n'));
  if (h.mocks?.length) lines.push('**Mocks:**\n' + h.mocks.slice(0, 8).map((f) => `- \`${f}\``).join('\n'));
  if (h.fixtures?.length) lines.push('**Fixtures:**\n' + h.fixtures.slice(0, 8).map((f) => `- \`${f}\``).join('\n'));
  if (!lines.length) return '_No dedicated test helpers detected — tests may be colocated with source._';
  return lines.join('\n\n');
}

function formatEnvUsage(profile) {
  const usage = deep(profile).envUsage || [];
  if (!usage.length) return '_Env keys found in .env.example but usage not traced in code (or keys unused in scanned files)._';
  return '| Variable | Used in |\n|----------|--------|\n' +
    usage.map((u) => `| \`${u.key}\` | \`${u.file}\` |`).join('\n');
}

function formatIntegrationUsage(profile) {
  const usage = deep(profile).integrationUsage || [];
  if (!usage.length) return '_Dependencies listed but import sites not found in scanned paths._';
  return '| Dependency | File | Context |\n|------------|------|--------|\n' +
    usage.map((u) => `| ${u.dependency} | \`${u.file}\` | ${u.context} |`).join('\n');
}

function formatCiDeep(profile) {
  const ci = deep(profile).ciDeep || [];
  if (!ci.length && !profile.ciJobs?.length) return '_No CI detected._';
  const lines = [];
  for (const c of ci) {
    lines.push(`### \`${c.workflow}\``);
    lines.push(`- Triggers: ${c.triggers.join(', ') || '—'}`);
    lines.push(`- Jobs: ${c.jobs.join(', ') || '—'}`);
    if (c.nodeVersion) lines.push(`- Node: ${c.nodeVersion}`);
    lines.push(`- Blocking: ${c.blocking ? 'yes' : 'no (continue-on-error)'}`);
    lines.push('');
  }
  if (profile.ciJobs?.length) {
    lines.push('| Workflow | Job | Steps |');
    lines.push('|----------|-----|-------|');
    for (const j of profile.ciJobs) {
      lines.push(`| \`${j.workflow}\` | ${j.name} | ${j.steps?.join(', ') || '—'} |`);
    }
  }
  return lines.join('\n');
}

function formatDockerDeep(profile) {
  const d = profile.docker;
  if (!d?.dockerfile && !d?.compose?.length) return '_No Docker files detected._';
  const lines = [];
  if (d.dockerfile) lines.push(`- **Dockerfile:** \`${d.dockerfile}\``);
  if (d.compose?.length) lines.push(`- **Compose:** ${d.compose.map((c) => `\`${c}\``).join(', ')}`);
  if (d.nginx) lines.push(`- **Nginx:** \`${d.nginx}\``);
  return lines.join('\n');
}

function formatConcernsTable(profile) {
  const rows = deep(profile).codeConcerns || [];
  if (!rows.length) return '| — | — | No code-based concerns flagged | — |';
  return rows.map((r) => `| ${r.severity} | ${r.area} | ${r.finding} | ${r.initiative} |`).join('\n');
}

function formatHeuristicConcerns(profile) {
  const lines = [];
  if (!profile.testInventory?.testFileCount) lines.push('- **No tests found** — test net at risk');
  if (!profile.ciWorkflows?.length) lines.push('- **No CI** — merge gate manual only');
  const hasFe = profile.packages?.some((p) => /frontend/i.test(p.path));
  const hasDb = profile.externalDeps?.some((d) => /pg|prisma|supabase/i.test(d.dependency));
  if (hasFe && hasDb) lines.push('- **Frontend + DB dep** — verify API boundary');
  if (!profile.envFiles?.length) lines.push('- **No .env.example** — env contract missing');
  return lines.length ? lines.join('\n') : '- _No additional heuristic flags._';
}

function formatDiscoverySummary(profile) {
  const readme = deep(profile).readme;
  const parts = [];
  if (readme?.summary) parts.push(readme.summary);
  parts.push(`Layout: **${profile.packages?.length > 1 ? 'monorepo' : 'single-package'}** with ${profile.packages?.length || 0} package(s).`);
  if (deep(profile).harness?.isHarnessRepo) {
    parts.push('**Harness pilot repo** — validation lane + workflow docs (no product API).');
  }
  parts.push(`Stack: **${profile.primaryStack}** (${profile.detectedStacks?.join(', ')}).`);
  if (profile.languages?.length) parts.push(`Languages: ${profile.languages.join(', ')}.`);
  if (profile.modules?.length) parts.push(`${profile.modules.length} module(s)/route group(s) mapped from source.`);
  if (profile.testInventory?.testFileCount) parts.push(`${profile.testInventory.testFileCount} test file(s) found.`);
  return parts.join('\n\n');
}

/** Items that may be N/A on harness-only repos when the signal is absent. */
const HARNESS_NA_WHEN_ABSENT = new Set([
  'Monorepo layout',
  'HTTP/React routes',
  'Test inventory',
  'CI parsed',
  'Env vars + usage',
  'Integration imports',
  'Docker',
  'Naming conventions',
  'Auth patterns',
  'Data layer',
]);

export function buildDiscoveryChecklistItems(profile) {
  const d = deep(profile);
  const harness = d.harness?.isHarnessRepo;
  const raw = [
    ['Git root', profile.git, 'STRUCTURE'],
    ['Monorepo layout', profile.packages?.length > 1, 'STRUCTURE'],
    ['Languages from source', profile.languages?.length > 0, 'STACK'],
    ['Package managers', profile.packageManagers?.length > 0, 'STACK'],
    ['Entry points / harness scripts', d.entryPointAnalysis?.length > 0 || harness, 'ARCHITECTURE'],
    ['Modules from code', profile.modules?.length > 0 || harness, 'ARCHITECTURE'],
    ['HTTP/React routes', (d.httpRoutes?.length || d.reactRoutes?.length) > 0, 'ARCHITECTURE'],
    ['Validation lane harness', harness, 'ARCHITECTURE'],
    ['Test inventory', profile.testInventory?.testFileCount > 0, 'TESTING'],
    ['CI parsed', profile.ciWorkflows?.length > 0, 'STACK'],
    ['Env vars + usage', profile.envVars?.length > 0, 'INTEGRATIONS'],
    ['Integration imports', d.integrationUsage?.length > 0, 'INTEGRATIONS'],
    ['Docker', profile.docker?.dockerfile || profile.docker?.compose?.length, 'STACK'],
    ['Naming conventions', d.namingConventions?.length > 0, 'CONVENTIONS'],
    ['Auth patterns', profile.authHints?.length > 0, 'CONVENTIONS'],
    ['Data layer', d.dataLayer?.length > 0, 'ARCHITECTURE'],
    ['Agent docs (.cursor/rules)', (d.harness?.agentDocs?.length || profile.agentDocs?.length) > 0, 'DISCOVERY'],
  ];

  return raw.map(([label, done, doc]) => {
    const na = harness && HARNESS_NA_WHEN_ABSENT.has(label) && !done;
    return { label, done: !!done, doc, na, reason: na ? 'harness repo' : null };
  });
}

export function computeChecklistStats(profile, items = buildDiscoveryChecklistItems(profile)) {
  const applicable = items.filter((i) => !i.na);
  const checkedAll = items.filter((i) => i.done).length;
  const checkedApplicable = applicable.filter((i) => i.done).length;
  const totalAll = items.length;
  const totalApplicable = applicable.length;
  const pctAll = totalAll ? Math.round((checkedAll / totalAll) * 100) : 0;
  const pctApplicable = totalApplicable ? Math.round((checkedApplicable / totalApplicable) * 100) : 0;
  const harness = deep(profile).harness?.isHarnessRepo;
  const gatePassed =
    pctApplicable >= 80 || (harness && checkedAll >= 5 && totalApplicable > 0);

  return {
    checked: checkedAll,
    total: totalAll,
    pct: pctAll,
    applicableChecked: checkedApplicable,
    applicableTotal: totalApplicable,
    applicablePct: pctApplicable,
    gatePassed,
    harnessOnly: !!harness,
  };
}

export function buildDiscoveryChecklist(profile) {
  return buildDiscoveryChecklistItems(profile)
    .map((item) => {
      if (item.na) {
        return `- [~] ${item.label} (N/A — ${item.reason}) → [${item.doc}.md](${item.doc}.md)`;
      }
      return `- [${item.done ? 'x' : ' '}] ${item.label} → [${item.doc}.md](${item.doc}.md)`;
    })
    .join('\n');
}

function checklistStatus(profile, key) {
  const stats = computeChecklistStats(profile);
  if (key === 'overall') {
    if (stats.gatePassed) return 'deep scan complete';
    return `deep scan (${stats.applicableChecked}/${stats.applicableTotal} applicable, ${stats.applicablePct}%)`;
  }
  return stats.applicablePct >= 70 ? 'mapped from code' : 'partial — review';
}

export function buildVars(profile, extra = {}) {
  const d = deep(profile);
  const checklist = buildDiscoveryChecklist(profile);
  const checklistStats = computeChecklistStats(profile);
  const mapStatus = extra.MAP_STATUS || (
    extra.enrichmentPending
      ? 'deep scaffold — optional agent refinement'
      : checklistStats.gatePassed
        ? 'deep scan complete'
        : `deep scan (${checklistStats.applicableChecked}/${checklistStats.applicableTotal} applicable, ${checklistStats.applicablePct}%)`
  );

  return {
    PROJECT_NAME: extra.PROJECT_NAME || path.basename(profile.root),
    SCANNED_AT: profile.scannedAt,
    PRIMARY_STACK: profile.primaryStack || 'generic',
    DETECTED_STACKS: profile.detectedStacks?.join(', ') || 'generic',
    LANGUAGES: profile.languages?.join(', ') || 'unknown',
    PACKAGE_MANAGERS: profile.packageManagers?.join(', ') || 'none',
    DISCOVERY_SUMMARY: formatDiscoverySummary(profile),
    PACKAGES_TABLE: profile.packages?.length
      ? '| Package | Name | Scripts | Key versions |\n|---------|------|---------|-------------|\n' + formatPackagesTable(profile.packages)
      : '_No package manifests detected._',
    PACKAGE_ROLES: formatPackageRoles(profile),
    COMMANDS_TABLE: formatCommandsTable(profile.packages),
    TEST_FRAMEWORKS: profile.testFrameworks?.length ? profile.testFrameworks.map((f) => `- ${f}`).join('\n') : '_None detected._',
    CI_SECTION: formatCiDeep(profile),
    DOCKER_SECTION: formatDockerDeep(profile),
    ARCHITECTURE_DIAGRAM: d.architectureDiagram || '_No diagram generated._',
    ENTRY_POINTS: profile.entryPoints?.join(', ') || 'none',
    ENTRY_POINTS_DETAIL: formatEntryPointsDetailed(profile),
    MODULES_DETAIL: formatModulesDetailed(profile),
    DATA_FLOW: d.dataFlow || '_No data flow inferred._',
    AUTH_DETAIL: (profile.authHints || []).map((h) => `- **${h.label}** — \`${h.file}\``).join('\n') || '_None detected._',
    LAYOUT_TYPE: profile.packages?.length > 1 ? 'monorepo' : 'single-package',
    PACKAGE_COUNT: String(profile.packages?.length || 0),
    ANNOTATED_TREE: formatAnnotatedTree(profile),
    MIGRATIONS_SECTION: profile.migrations?.length ? profile.migrations.map((m) => `- \`${m}\``).join('\n') : '_None detected._',
    FOLDER_ROLES: formatPackageRoles(profile),
    API_PATTERNS: (profile.apiPatterns || []).map((p) => `- **${p.type}**${p.alias ? ` \`${p.alias}\`` : ''} — \`${p.file}\``).join('\n') || '_None._',
    PATH_ALIASES: (profile.apiPatterns || []).filter((p) => p.type === 'path-alias').map((a) => `- \`${a.alias}\` → ${a.target || 'config'} (\`${a.file}\`)`).join('\n') || '_None._',
    NAMING_CONVENTIONS: formatNamingConventions(profile),
    AUTH_CONVENTIONS: (profile.authHints || []).map((h) => `- ${h.label} (\`${h.file}\`)`).join('\n') || '_None._',
    TEST_FILE_COUNT: String(profile.testInventory?.testFileCount || 0),
    TEST_COMMANDS: formatCommandsTable(profile.packages),
    VALIDATION_LANE: (d.harness?.isHarnessRepo)
      ? d.harness.patterns.map((p) => `- **${p.type}** — \`${p.path}\`: ${p.role}`).join('\n') +
        (d.harness.harnessScripts?.length ? `\n\nScripts: ${d.harness.harnessScripts.map((s) => `\`${s}\``).join(', ')}` : '')
      : '_Not a harness repo._',
    TEST_INVENTORY: profile.testInventory?.testFiles?.slice(0, 20).map((f) => `- \`${f}\``).join('\n') || '_None._',
    TEST_HELPERS: formatTestHelpers(profile),
    TEST_CONFIGS: profile.testInventory?.configs?.map((c) => `- \`${c}\``).join('\n') || '_None._',
    CI_TEST_JOBS: profile.ciJobs?.filter((j) => j.steps?.includes('test')).map((j) => `- \`${j.workflow}\` / **${j.name}**`).join('\n') || '_None parsed._',
    EXTERNAL_DEPS_TABLE: (profile.externalDeps || []).length
      ? '| Package | Dependency |\n|---------|------------|\n' + profile.externalDeps.map((x) => `| \`${x.package}\` | ${x.dependency} |`).join('\n')
      : '_None in dependency scan._',
    INTEGRATION_USAGE: formatIntegrationUsage(profile),
    ENV_VARS_TABLE: (profile.envVars || []).map((k) => `- \`${k}\``).join('\n') || '_None._',
    ENV_USAGE: formatEnvUsage(profile),
    ENV_FILES_LIST: (profile.envFiles || []).map((f) => `- \`${f}\``).join('\n') || '_None._',
    INTEGRATION_HINTS: (profile.integrationHints || []).map((h) => `- **${h.pattern}** in \`${h.file}\``).join('\n') || '_None._',
    HEURISTIC_CONCERNS: formatHeuristicConcerns(profile),
    CONCERNS_TABLE: formatConcernsTable(profile),
    DISCOVERY_CHECKLIST: checklist,
    CHECKLIST_APPLICABLE_SUMMARY: `${checklistStats.applicableChecked}/${checklistStats.applicableTotal} applicable (${checklistStats.applicablePct}%)`,
    CHECKLIST_GATE_STATUS: checklistStats.gatePassed ? 'passed' : 'needs review',
    MAP_STATUS: mapStatus,
    CHECK_STACK: checklistStatus(profile),
    CHECK_ARCH: checklistStatus(profile),
    CHECK_STRUCT: checklistStatus(profile),
    CHECK_CONV: checklistStatus(profile),
    CHECK_TEST: checklistStatus(profile),
    CHECK_INT: checklistStatus(profile),
    CHECK_CONC: checklistStatus(profile),
    ...extra,
  };
}

function renderDoc(tplName, vars) {
  return substitute(fs.readFileSync(path.join(TPL_DIR, tplName), 'utf8'), vars);
}

export function mapCodebase(profile, outDir, options = {}) {
  const { merge = false, vars = {} } = options;
  fs.mkdirSync(outDir, { recursive: true });
  profile.checklistApplicable = computeChecklistStats(profile);
  const templateVars = buildVars(profile, vars);
  const written = [];
  for (const doc of DOC_FILES) {
    const dest = path.join(outDir, doc);
    let content = renderDoc(`${doc}.tpl`, templateVars);
    if (merge && fs.existsSync(dest)) {
      content = mergeAutoSections(fs.readFileSync(dest, 'utf8'), content);
    }
    fs.writeFileSync(dest, content, 'utf8');
    written.push(dest);
    console.log(`Wrote ${dest}`);
  }
  return { written, vars: templateVars };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.out) {
    console.error('Usage: node map-codebase.mjs --out <dir> [--cwd <repo>] [--profile <json>] [--merge]');
    process.exit(1);
  }
  const outDir = path.isAbsolute(args.out) ? args.out : path.join(args.cwd, args.out);
  let profile = args.profile && fs.existsSync(args.profile)
    ? JSON.parse(fs.readFileSync(args.profile, 'utf8'))
    : buildProfile(args.cwd);
  mapCodebase(profile, outDir, { merge: args.merge, vars: args.vars });
  if (args.json) {
    const p = path.join(outDir, '.profile.json');
    fs.writeFileSync(p, JSON.stringify(profile, null, 2), 'utf8');
    console.log(`Wrote ${p}`);
  }
  console.log('Codebase map complete (8 docs).');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();

export { parseArgs, mergeAutoSections, DOC_FILES, computeChecklistStats as evaluateChecklistGate };
