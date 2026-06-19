#!/usr/bin/env node
/**
 * scan-profile.mjs — Read-only repository profile for ab-harness-skill.
 * Usage: node scan-profile.mjs [--cwd <path>] [--out <file>] [--json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { cwd: process.cwd(), out: null, json: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--cwd' && argv[i + 1]) args.cwd = path.resolve(argv[++i]);
    else if (argv[i] === '--out' && argv[i + 1]) args.out = argv[++i];
    else if (argv[i] === '--json') args.json = true;
  }
  return args;
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function walkShallow(dir, depth = 2, base = dir, acc = []) {
  if (depth < 0 || !exists(dir)) return acc;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.github') continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (e.isDirectory()) {
      acc.push(rel + '/');
      if (depth > 0 && !['node_modules', 'dist', 'build', '.git', 'vendor'].includes(e.name)) {
        walkShallow(full, depth - 1, base, acc);
      }
    } else {
      acc.push(rel);
    }
  }
  return acc;
}

function detectPackageManagers(root) {
  const found = [];
  if (exists(path.join(root, 'package.json'))) found.push('npm');
  if (exists(path.join(root, 'pnpm-lock.yaml'))) found.push('pnpm');
  if (exists(path.join(root, 'yarn.lock'))) found.push('yarn');
  if (exists(path.join(root, 'requirements.txt')) || exists(path.join(root, 'pyproject.toml')))
    found.push('pip');
  if (exists(path.join(root, 'go.mod'))) found.push('go');
  if (exists(path.join(root, 'Cargo.toml'))) found.push('cargo');
  return found;
}

function scanPackageJson(root, relPath) {
  const p = path.join(root, relPath);
  const pkg = readJsonSafe(p);
  if (!pkg) return null;
  const scripts = pkg.scripts || {};
  return {
    path: relPath,
    name: pkg.name,
    scripts: Object.keys(scripts),
    testScript: scripts.test || null,
    lintScript: scripts.lint || null,
    buildScript: scripts.build || null,
    devDependencies: Object.keys(pkg.devDependencies || {}),
    dependencies: Object.keys(pkg.dependencies || {}),
  };
}

function findPackages(root) {
  const packages = [];
  const rootPkg = scanPackageJson(root, 'package.json');
  if (rootPkg) packages.push(rootPkg);

  for (const sub of ['backend', 'frontend', 'packages', 'apps', 'services']) {
    const subPath = path.join(root, sub);
    if (!exists(subPath)) continue;
    const stat = fs.statSync(subPath);
    if (!stat.isDirectory()) continue;
    const entries = fs.readdirSync(subPath, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const rel = `${sub}/${e.name}/package.json`;
        const scanned = scanPackageJson(root, rel);
        if (scanned) packages.push(scanned);
      }
    }
    const direct = scanPackageJson(root, `${sub}/package.json`);
    if (direct) packages.push(direct);
  }
  return [...new Map(packages.map((p) => [p.path, p])).values()];
}

function detectTestFrameworks(packages) {
  const frameworks = new Set();
  const allDeps = packages.flatMap((p) => [...p.devDependencies, ...p.dependencies]);
  if (allDeps.some((d) => d.includes('jest'))) frameworks.add('jest');
  if (allDeps.some((d) => d.includes('vitest'))) frameworks.add('vitest');
  if (allDeps.some((d) => d.includes('mocha'))) frameworks.add('mocha');
  if (allDeps.some((d) => d.includes('pytest'))) frameworks.add('pytest');
  if (allDeps.some((d) => d.includes('playwright'))) frameworks.add('playwright');
  if (allDeps.some((d) => d.includes('cypress'))) frameworks.add('cypress');
  return [...frameworks];
}

function detectCi(root) {
  const workflows = [];
  const ghActions = path.join(root, '.github', 'workflows');
  if (exists(ghActions)) {
    for (const f of fs.readdirSync(ghActions)) {
      if (f.endsWith('.yml') || f.endsWith('.yaml')) workflows.push(`.github/workflows/${f}`);
    }
  }
  if (exists(path.join(root, '.gitlab-ci.yml'))) workflows.push('.gitlab-ci.yml');
  return workflows;
}

function detectAgentDocs(root) {
  const docs = [];
  for (const f of ['AGENTS.md', 'CLAUDE.md', 'CONTRIBUTING.md']) {
    if (exists(path.join(root, f))) docs.push(f);
  }
  if (exists(path.join(root, '.cursor', 'rules'))) docs.push('.cursor/rules/');
  if (exists(path.join(root, '.claude', 'rules'))) docs.push('.claude/rules/');
  if (exists(path.join(root, 'workflow.config.md'))) docs.push('workflow.config.md');
  return docs;
}

function grepFileForPatterns(root, patterns) {
  const hits = [];
  const files = ['README.md', 'package.json', 'CONTRIBUTING.md'];
  for (const f of files) {
    const p = path.join(root, f);
    if (!exists(p)) continue;
    const content = fs.readFileSync(p, 'utf8').toLowerCase();
    for (const pat of patterns) {
      if (content.includes(pat.toLowerCase())) hits.push({ file: f, pattern: pat });
    }
  }
  return hits;
}

function suggestLaneCommands(packages) {
  const lintBuild = {};
  const unit = {};
  for (const pkg of packages) {
    const dir = path.dirname(pkg.path);
    const label = dir === '.' ? 'root' : dir.replace(/\\/g, '/');
    const cd = dir === '.' ? '' : `cd ${dir} && `;
    if (pkg.lintScript && pkg.buildScript) {
      lintBuild[label] = `${cd}npm run lint && npm run build`;
    } else if (pkg.buildScript) {
      lintBuild[label] = `${cd}npm run build`;
    } else if (pkg.lintScript) {
      lintBuild[label] = `${cd}npm run lint`;
    }
    if (pkg.testScript) {
      unit[label] = `${cd}npm test`;
    }
  }
  const e2ePkg = packages.find((p) => p.scripts.some((s) => /e2e|test:e2e/i.test(s)));
  let e2e = null;
  if (e2ePkg) {
    const dir = path.dirname(e2ePkg.path);
    const cd = dir === '.' ? '' : `cd ${dir} && `;
    const script = e2ePkg.scripts.find((s) => /e2e/i.test(s)) || 'test:e2e';
    e2e = `${cd}npm run ${script}`;
  }
  return { lintBuild, unit, e2e };
}

function buildProfile(root) {
  const packages = findPackages(root);
  const integrationHints = grepFileForPatterns(root, [
    'jira',
    'atlassian',
    'confluence',
    'github.com',
    'pull request',
  ]);

  return {
    scannedAt: new Date().toISOString(),
    root,
    git: exists(path.join(root, '.git')),
    packageManagers: detectPackageManagers(root),
    packages,
    testFrameworks: detectTestFrameworks(packages),
    ciWorkflows: detectCi(root),
    agentDocs: detectAgentDocs(root),
    integrationHints,
    topLevelDirs: walkShallow(root, 1).filter((p) => p.endsWith('/')),
    suggestedLaneCommands: suggestLaneCommands(packages),
  };
}

function profileToMarkdown(profile) {
  const lines = [
    '# Repository Profile',
    '',
    `Scanned: ${profile.scannedAt}`,
    `Root: ${profile.root}`,
    '',
    '## Summary',
    '',
    `- Git: ${profile.git ? 'yes' : 'no'}`,
    `- Package managers: ${profile.packageManagers.join(', ') || 'none detected'}`,
    `- Test frameworks: ${profile.testFrameworks.join(', ') || 'none detected'}`,
    `- CI workflows: ${profile.ciWorkflows.length ? profile.ciWorkflows.join(', ') : 'none'}`,
    '',
    '## Packages',
    '',
  ];

  for (const pkg of profile.packages) {
    lines.push(`### ${pkg.path}`);
    lines.push(`- Scripts: ${pkg.scripts.join(', ') || 'none'}`);
    lines.push('');
  }

  lines.push('## Agent docs existing', '');
  lines.push(profile.agentDocs.length ? profile.agentDocs.map((d) => `- ${d}`).join('\n') : '- none');
  lines.push('', '## Integration hints', '');
  if (profile.integrationHints.length) {
    for (const h of profile.integrationHints) {
      lines.push(`- ${h.pattern} in ${h.file}`);
    }
  } else {
    lines.push('- none from README/package scan');
  }

  lines.push('', '## Suggested lane commands', '', '```json');
  lines.push(JSON.stringify(profile.suggestedLaneCommands, null, 2));
  lines.push('```', '', '## Top-level directories', '');
  for (const d of profile.topLevelDirs.slice(0, 30)) {
    lines.push(`- ${d}`);
  }
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const profile = buildProfile(args.cwd);
  const output = args.json ? JSON.stringify(profile, null, 2) : profileToMarkdown(profile);

  if (args.out) {
    const outPath = path.isAbsolute(args.out) ? args.out : path.join(args.cwd, args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, 'utf8');
    console.log(`Profile written: ${outPath}`);
  } else {
    console.log(output);
  }
}

export { buildProfile, profileToMarkdown, parseArgs };

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
