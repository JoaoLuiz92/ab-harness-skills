/**
 * Deep code analysis — reads source files to enrich profile for 8-doc map (GIA-style depth).
 */
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'vendor', '.next', 'coverage', '.turbo',
]);

const FOLDER_ROLES = {
  src: 'Application source',
  lib: 'Shared libraries',
  app: 'Application modules (App Router / modules)',
  api: 'API layer',
  services: 'Business services',
  controllers: 'HTTP controllers',
  routes: 'Route definitions',
  models: 'Data models / entities',
  entities: 'ORM entities',
  migrations: 'Database migrations',
  prisma: 'Prisma schema and migrations',
  components: 'UI components',
  pages: 'Page routes / views',
  hooks: 'React hooks',
  utils: 'Utilities',
  helpers: 'Helper functions',
  middleware: 'HTTP middleware',
  guards: 'Auth guards',
  interceptors: 'Request/response interceptors',
  dto: 'Data transfer objects',
  types: 'Type definitions',
  tests: 'Test suites',
  __tests__: 'Jest test directory',
  __mocks__: 'Test mocks',
  fixtures: 'Test fixtures',
  public: 'Static assets',
  assets: 'Static assets',
  config: 'Configuration',
  scripts: 'Build / automation scripts',
  docs: 'Documentation',
  backend: 'Backend package',
  frontend: 'Frontend package',
  packages: 'Monorepo packages',
  apps: 'Monorepo applications',
};

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readSafe(p, max = 8000) {
  try {
    return fs.readFileSync(p, 'utf8').slice(0, max);
  } catch {
    return '';
  }
}

function walkFiles(dir, pattern, maxDepth = 6, depth = 0, base = dir, acc = []) {
  if (depth > maxDepth || !exists(dir)) return acc;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkFiles(full, pattern, maxDepth, depth + 1, base, acc);
    } else if (!pattern || pattern.test(e.name)) {
      acc.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return acc;
}

function inferFolderRole(name, fullPath) {
  if (FOLDER_ROLES[name]) return FOLDER_ROLES[name];
  if (/\.controller\.(ts|js)$/.test(name)) return 'Controller';
  if (/\.service\.(ts|js)$/.test(name)) return 'Service';
  if (/\.module\.(ts|js)$/.test(name)) return 'Module';
  if (/\.guard\.(ts|js)$/.test(name)) return 'Guard';
  if (/\.spec\.(ts|js)$/.test(name) || /\.test\.(tsx|ts|js)$/.test(name)) return 'Test file';
  try {
    const children = fs.readdirSync(fullPath);
    if (children.some((c) => c.endsWith('.module.ts') || c.endsWith('.module.js'))) return 'NestJS module folder';
    if (children.some((c) => c.endsWith('.controller.ts') || c.endsWith('.controller.js'))) return 'Controllers';
  } catch {
    /* skip */
  }
  return null;
}

export function buildAnnotatedTree(root, maxDepth = 3) {
  const lines = [];

  function walk(dir, depth, prefix) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !SKIP_DIRS.has(e.name));
    } catch {
      return;
    }
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.github') continue;
      const rel = path.relative(root, path.join(dir, e.name)).replace(/\\/g, '/');
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        const role = inferFolderRole(e.name, full);
        const note = role ? ` — ${role}` : '';
        lines.push(`${prefix}- \`${rel}/\`${note}`);
        walk(full, depth + 1, prefix);
      } else if (depth <= 2 && /\.(json|md|yml|yaml|toml)$/.test(e.name)) {
        lines.push(`${prefix}  - \`${rel}\``);
      }
    }
  }

  walk(root, 0, '');
  return lines.slice(0, 80);
}

export function parseReadme(root) {
  const content = readSafe(path.join(root, 'README.md'), 6000);
  if (!content) return { summary: null, sections: [] };

  const lines = content.split('\n');
  const summary = [];
  let inSection = false;
  const sections = [];

  for (const line of lines) {
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      summary.push(line.replace(/^#\s+/, ''));
      continue;
    }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      inSection = h2[1].toLowerCase();
      sections.push(h2[1]);
      continue;
    }
    if (!inSection && line.trim() && summary.length < 5 && !line.startsWith('#')) {
      summary.push(line.trim());
    }
  }

  return {
    summary: summary.slice(0, 4).join(' ').slice(0, 400) || null,
    sections,
    hasInstall: /npm install|yarn|pnpm|pip install/i.test(content),
    hasDev: /npm run dev|yarn dev|npm start/i.test(content),
  };
}

export function analyzeEntryPoints(root, entryPoints) {
  return entryPoints.map((rel) => {
    const content = readSafe(path.join(root, rel), 5000);
    const imports = [...content.matchAll(/(?:import|require)\(?['"]([^'"]+)['"]\)?/g)]
      .map((m) => m[1])
      .filter((i) => !i.startsWith('.') && !i.startsWith('@/'))
      .slice(0, 12);
    const localImports = [...content.matchAll(/(?:import|require)\(?['"](\.[^'"]+)['"]\)?/g)]
      .map((m) => m[1])
      .slice(0, 8);
    const patterns = [];
    if (/NestFactory|@nestjs/.test(content)) patterns.push('NestJS bootstrap');
    if (/express\(\)|fastify\(/.test(content)) patterns.push('HTTP server');
    if (/createRoot|ReactDOM/.test(content)) patterns.push('React mount');
    if (/listen\(/.test(content)) patterns.push('Port listener');
    return { path: rel, imports, localImports, patterns, lineCount: content.split('\n').length };
  });
}

export function extractHttpRoutes(root) {
  const routes = [];
  const files = walkFiles(root, /\.(controller|routes|router|route)\.(ts|js)$/i, 5);
  for (const f of files.slice(0, 40)) {
    const content = readSafe(path.join(root, f), 4000);
    const controller = content.match(/@Controller\(['"]([^'"]*)['"]\)/);
    const gets = [...content.matchAll(/@Get\(['"]([^'"]*)['"]\)/g)].map((m) => `GET ${controller?.[1] || ''}${m[1]}`);
    const posts = [...content.matchAll(/@Post\(['"]([^'"]*)['"]\)/g)].map((m) => `POST ${controller?.[1] || ''}${m[1]}`);
    const express = [...content.matchAll(/\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/gi)].map(
      (m) => `${m[1].toUpperCase()} ${m[2]}`,
    );
    const found = [...gets, ...posts, ...express];
    if (found.length || controller) {
      routes.push({
        file: f,
        base: controller?.[1] || null,
        endpoints: found.slice(0, 10),
        type: controller ? 'nestjs-controller' : 'express-router',
      });
    }
  }
  return routes;
}

export function extractReactRoutesDeep(root) {
  const routes = [];
  const appFiles = walkFiles(root, /^App\.(tsx|jsx)$/i, 5);
  for (const f of appFiles) {
    const content = readSafe(path.join(root, f), 4000);
    for (const m of content.matchAll(/<Route[^>]+path=["']([^"']+)["']/g)) {
      routes.push({ path: m[1], file: f, type: 'react-route' });
    }
    for (const m of content.matchAll(/path:\s*['"]([^'"]+)['"]/g)) {
      routes.push({ path: m[1], file: f, type: 'route-config' });
    }
  }
  const pageDirs = ['src/pages', 'frontend/src/pages', 'app'];
  for (const d of pageDirs) {
    const full = path.join(root, d);
    if (!exists(full)) continue;
    try {
      for (const e of fs.readdirSync(full, { withFileTypes: true })) {
        if (e.isFile() && /\.(tsx|jsx|vue)$/.test(e.name) && !/\.(test|spec)\./i.test(e.name)) {
          routes.push({ path: `/${e.name.replace(/\.(tsx|jsx|vue)$/, '').toLowerCase()}`, file: `${d}/${e.name}`, type: 'page-file' });
        }
      }
    } catch {
      /* skip */
    }
  }
  return [...new Map(routes.map((r) => [`${r.path}:${r.file}`, r])).values()].slice(0, 25);
}

export function extractDataLayer(root, packages) {
  const layers = [];
  const deps = packages.flatMap((p) => [...(p.dependencies || []), ...(p.devDependencies || [])]);
  if (deps.some((d) => d.includes('prisma'))) layers.push({ type: 'prisma', evidence: 'package dependency' });
  if (deps.some((d) => d === 'pg' || d.includes('postgres'))) layers.push({ type: 'postgresql', evidence: 'pg driver' });
  if (deps.some((d) => d.includes('supabase'))) layers.push({ type: 'supabase', evidence: 'supabase client' });
  if (deps.some((d) => d.includes('mongoose') || d.includes('mongodb'))) layers.push({ type: 'mongodb', evidence: 'mongo driver' });
  if (deps.some((d) => d.includes('redis') || d.includes('ioredis'))) layers.push({ type: 'redis', evidence: 'redis client' });

  const ormFiles = walkFiles(root, /(schema\.prisma|typeorm|sequelize|knexfile)/i, 4);
  for (const f of ormFiles.slice(0, 5)) {
    layers.push({ type: 'orm-config', evidence: f });
  }
  return layers;
}

export function mapEnvVarUsage(root, envKeys) {
  const usage = [];
  const codeFiles = walkFiles(root, /\.(ts|tsx|js|jsx|mjs|cjs|py|go|env)$/i, 5).slice(0, 400);
  for (const key of envKeys.slice(0, 30)) {
    const re = new RegExp(`process\\.env\\.${key}|process\\.env\\[['"]${key}['"]\\]|import\\.meta\\.env\\.${key}|VITE_${key}|os\\.getenv\\(['"]${key}['"]\\)`);
    for (const f of codeFiles) {
      const content = readSafe(path.join(root, f), 6000);
      if (re.test(content)) {
        usage.push({ key, file: f });
        break;
      }
    }
  }
  return usage;
}

export function mapIntegrationUsage(root, externalDeps) {
  const usage = [];
  const seen = new Set();
  for (const { dependency } of externalDeps) {
    const pkg = dependency.replace(/^@/, '').split('/')[0];
    const re = new RegExp(`from ['"]${dependency}|require\\(['"]${dependency}|from ['"]@${pkg}`, 'i');
    const files = walkFiles(root, /\.(ts|tsx|js|jsx)$/i, 5).slice(0, 200);
    for (const f of files) {
      const content = readSafe(path.join(root, f), 4000);
      if (re.test(content) && !seen.has(`${dependency}:${f}`)) {
        seen.add(`${dependency}:${f}`);
        usage.push({ dependency, file: f, context: f.includes('test') || f.includes('spec') ? 'test' : 'runtime' });
        if (usage.filter((u) => u.dependency === dependency).length >= 3) break;
      }
    }
  }
  return usage;
}

export function extractNamingConventions(root) {
  const suffixes = new Map();
  const files = walkFiles(root, /\.(ts|tsx|js|jsx|py|go)$/i, 5);
  for (const f of files) {
    const base = path.basename(f);
    const m = base.match(/(\.[a-z]+)\.(ts|tsx|js|jsx)$/i) || base.match(/(_[a-z]+)\.(py|go)$/i);
    if (m) {
      const suffix = m[1];
      suffixes.set(suffix, (suffixes.get(suffix) || 0) + 1);
    }
  }
  return [...suffixes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([suffix, count]) => ({ suffix, count }));
}

export function extractTestHelpers(root) {
  const helpers = { setup: [], mocks: [], fixtures: [], patterns: [] };
  const setupNames = ['setup.ts', 'setup.js', 'jest.setup.ts', 'test-setup.ts', 'vitest.setup.ts', 'conftest.py'];
  for (const name of setupNames) {
    const found = walkFiles(root, new RegExp(`^${name.replace('.', '\\.')}$`), 5);
    helpers.setup.push(...found);
  }
  helpers.mocks = walkFiles(root, /__mocks__|\.mock\.(ts|js)$/i, 5).slice(0, 15);
  helpers.fixtures = walkFiles(root, /fixtures?|__fixtures__/i, 5).slice(0, 15);

  const testFiles = walkFiles(root, /\.(spec|test)\.(ts|tsx|js|jsx)$/i, 5);
  const describeCount = testFiles.length;
  if (testFiles.some((f) => f.includes('.spec.'))) helpers.patterns.push('*.spec.* (Jest/Nest style)');
  if (testFiles.some((f) => f.includes('.test.'))) helpers.patterns.push('*.test.* (Vitest/Jest style)');
  helpers.testFileCount = describeCount;
  return helpers;
}

export function parseCiDeep(root, ciWorkflows) {
  const details = [];
  for (const wf of ciWorkflows) {
    const content = readSafe(path.join(root, wf), 10000);
    const triggers = [];
    if (/push:/m.test(content)) triggers.push('push');
    if (/pull_request:/m.test(content)) triggers.push('pull_request');
    if (/workflow_dispatch:/m.test(content)) triggers.push('manual');
    const nodeVersion = content.match(/node-version:\s*['"]?([^'"\n]+)/)?.[1];
    const continueOnError = /continue-on-error:\s*true/i.test(content);
    const jobs = [...content.matchAll(/^\s{2}([a-zA-Z0-9_-]+):\s*$/gm)].map((m) => m[1]);
    details.push({
      workflow: wf,
      triggers,
      jobs,
      nodeVersion: nodeVersion || null,
      continueOnError,
      blocking: !continueOnError,
    });
  }
  return details;
}

export function buildArchitectureDiagram(profile, deep) {
  const stacks = profile.detectedStacks || [];
  const hasFrontend = stacks.includes('react') || profile.packages?.some((p) => /frontend|client|web/i.test(p.path));
  const hasBackend = stacks.includes('nestjs') || profile.packages?.some((p) => /backend|api|server/i.test(p.path));
  const dataLayer = deep.dataLayer?.[0]?.type || 'storage';

  if (deep.harness?.isHarnessRepo) {
    return `\`\`\`mermaid
flowchart LR
  Dev[Developer / Agent] --> Handoff[validation-lane:handoff]
  Handoff --> Runners[validation-lane:runner]
  Runners --> Reports[docs/workflow/reports]
  Runners --> Merge[validation-lane:merge]
  Config[workflow.config.md] --> Handoff
  Lane[docs/workflow/lane-commands.json] --> Runners
\`\`\``;
  }
  if (hasFrontend && hasBackend) {
    return `\`\`\`mermaid
flowchart LR
  subgraph client [Frontend]
    UI[React UI]
    Pages[Pages / Routes]
  end
  subgraph server [Backend]
    API[HTTP API]
    Modules[NestJS Modules]
    Auth[Guards / Auth]
  end
  subgraph data [Data]
    DB[(${dataLayer})]
  end
  UI --> Pages
  Pages -->|HTTP| API
  API --> Auth
  Auth --> Modules
  Modules --> DB
\`\`\``;
  }
  if (stacks.includes('nestjs')) {
    const mods = (profile.modules || []).slice(0, 5).map((m) => m.name).join(', ');
    return `\`\`\`mermaid
flowchart TB
  Client --> Gateway[NestJS App]
  Gateway --> Guards[Auth Guards]
  Guards --> Modules["Modules: ${mods || 'app modules'}"]
  Modules --> Data[(${dataLayer})]
\`\`\``;
  }
  if (hasFrontend) {
    return `\`\`\`mermaid
flowchart TB
  Browser --> Router[React Router]
  Router --> Pages[Page Components]
  Pages --> API[Backend API / BaaS]
\`\`\``;
  }
  return `\`\`\`mermaid
flowchart TB
  Entry[Entry Point] --> App[Application Layer]
  App --> Services[Services]
  Services --> Data[(${dataLayer})]
\`\`\``;
}

export function inferDataFlow(profile, deep) {
  const lines = [];
  if (deep.harness?.isHarnessRepo) {
    lines.push('### Harness workflow (detected from repo)');
    lines.push('');
    lines.push('This repo is a **harness pilot** — workflow delivery, not a product API.');
    lines.push('');
    for (const p of deep.harness.patterns) {
      lines.push(`- **${p.type}** — \`${p.path}\`: ${p.role}`);
    }
    if (deep.harness.harnessScripts?.length) {
      lines.push('', '**npm scripts:** ' + deep.harness.harnessScripts.map((s) => `\`${s}\``).join(', '));
    }
    if (deep.harness.agentDocs?.length) {
      lines.push('', '**Agent docs:** ' + deep.harness.agentDocs.map((d) => `\`${d}\``).join(', '));
    }
    lines.push('');
  }
  for (const ep of deep.entryPointAnalysis || []) {
    lines.push(`### \`${ep.path}\``);
    if (ep.patterns.length) lines.push(`- Bootstrap: ${ep.patterns.join(', ')}`);
    if (ep.localImports.length) lines.push(`- Loads: ${ep.localImports.map((i) => `\`${i}\``).join(', ')}`);
    if (ep.imports.length) lines.push(`- External: ${ep.imports.slice(0, 6).map((i) => `\`${i}\``).join(', ')}`);
    lines.push('');
  }
  if (deep.httpRoutes?.length) {
    lines.push('### HTTP routes (from controllers/routers)');
    for (const r of deep.httpRoutes.slice(0, 8)) {
      lines.push(`- \`${r.file}\`${r.base ? ` base \`/${r.base}\`` : ''}: ${r.endpoints.slice(0, 4).join(', ') || 'endpoints in file'}`);
    }
    lines.push('');
  }
  if (deep.reactRoutes?.length) {
    lines.push('### Frontend routes');
    for (const r of deep.reactRoutes.slice(0, 10)) {
      lines.push(`- \`${r.path}\` → \`${r.file}\``);
    }
    lines.push('');
  }
  if (deep.dataLayer?.length) {
    lines.push('### Data layer');
    for (const d of deep.dataLayer) {
      lines.push(`- **${d.type}** — ${d.evidence}`);
    }
  }
  return lines.join('\n') || '_Could not infer data flow from entry points._';
}

export function buildCodeConcerns(root, profile, deep) {
  const rows = [];
  let severity = 0;

  if (!profile.testInventory?.testFileCount) {
    rows.push({ severity: 'High', area: 'Testing', finding: 'No test files detected', initiative: 'Add unit tests for critical paths' });
  } else if (profile.testInventory.testFileCount < 5) {
    rows.push({ severity: 'Medium', area: 'Testing', finding: `Only ${profile.testInventory.testFileCount} test files`, initiative: 'Expand coverage on core modules' });
  }

  if (!profile.ciWorkflows?.length) {
    rows.push({ severity: 'High', area: 'CI', finding: 'No CI workflows', initiative: 'Add GitHub Actions / GitLab CI' });
  } else if (deep.ciDeep?.some((c) => c.continueOnError)) {
    rows.push({ severity: 'Medium', area: 'CI', finding: 'continue-on-error: true in workflow', initiative: 'Make checks blocking on PRs' });
  }

  if (!profile.envFiles?.length) {
    rows.push({ severity: 'Medium', area: 'Config', finding: 'No .env.example', initiative: 'Document required env vars' });
  }

  const hasFrontend = profile.packages?.some((p) => /frontend|client/i.test(p.path));
  const dbInFrontend = deep.integrationUsage?.some(
    (u) => u.context === 'runtime' && /pg|prisma|mongoose|supabase/i.test(u.dependency) && /frontend|client|src\/pages/i.test(u.file),
  );
  if (hasFrontend && dbInFrontend) {
    rows.push({ severity: 'High', area: 'Security', finding: 'DB client import in frontend path', initiative: 'Route data access through backend API' });
  }

  const secretPatterns = walkFiles(root, /\.(ts|js|tsx|jsx|env)$/i, 4).slice(0, 100);
  for (const f of secretPatterns) {
    const c = readSafe(path.join(root, f), 2000);
    if (/password\s*=\s*['"][^'"]+['"]|api_key\s*=\s*['"]sk-/.test(c) && !f.includes('.example')) {
      rows.push({ severity: 'High', area: 'Secrets', finding: `Possible hardcoded secret in \`${f}\``, initiative: 'Move to env vars; rotate if exposed' });
      break;
    }
  }

  if (profile.authHints?.length === 0 && profile.modules?.some((m) => /auth|user/i.test(m.name))) {
    rows.push({ severity: 'Low', area: 'Auth', finding: 'Auth module present but patterns not fully detected', initiative: 'Document auth flow in ARCHITECTURE' });
  }

  return rows.slice(0, 10);
}

export function extractHarnessWorkflow(root, packages) {
  const patterns = [];
  const validationLane = exists(path.join(root, 'scripts', 'validation-lane.mjs'));
  const workflowConfig = exists(path.join(root, 'workflow.config.md'));
  const workflowDocs = exists(path.join(root, 'docs', 'workflow', 'test-lane.md'));
  const laneCommands = exists(path.join(root, 'docs', 'workflow', 'lane-commands.json'));

  if (validationLane) {
    patterns.push({
      type: 'validation-lane',
      path: 'scripts/validation-lane.mjs',
      role: 'Isolated validation runner (handoff → runners → merge)',
    });
  }
  if (workflowConfig) patterns.push({ type: 'workflow-config', path: 'workflow.config.md', role: 'Harness flags and branch strategy' });
  if (workflowDocs) patterns.push({ type: 'test-lane-docs', path: 'docs/workflow/test-lane.md', role: 'Validation lane methodology' });
  if (laneCommands) patterns.push({ type: 'lane-commands', path: 'docs/workflow/lane-commands.json', role: 'Lint/build/unit/e2e command map' });

  const agentDocs = [];
  for (const f of ['AGENTS.md', 'CLAUDE.md']) {
    if (exists(path.join(root, f))) agentDocs.push(f);
  }
  if (exists(path.join(root, '.cursor', 'rules'))) agentDocs.push('.cursor/rules/');
  if (exists(path.join(root, '.claude', 'rules'))) agentDocs.push('.claude/rules/');

  const harnessScripts = (packages[0]?.scripts || []).filter((s) => /validation-lane|specs:refresh/.test(s));

  return { patterns, agentDocs, harnessScripts, isHarnessRepo: patterns.length >= 2 };
}

export function runDeepAnalysis(root, profile) {
  const harness = extractHarnessWorkflow(root, profile.packages || []);
  const readme = parseReadme(root);
  const entryPointAnalysis = analyzeEntryPoints(root, profile.entryPoints || []);
  const annotatedTree = buildAnnotatedTree(root, 3);
  const httpRoutes = extractHttpRoutes(root);
  const reactRoutes = extractReactRoutesDeep(root);
  const dataLayer = extractDataLayer(root, profile.packages || []);
  const envUsage = mapEnvVarUsage(root, profile.envVars || []);
  const integrationUsage = mapIntegrationUsage(root, profile.externalDeps || []);
  const namingConventions = extractNamingConventions(root);
  const testHelpers = extractTestHelpers(root);
  const ciDeep = parseCiDeep(root, profile.ciWorkflows || []);
  const architectureDiagram = buildArchitectureDiagram(profile, { dataLayer, harness });
  const dataFlow = inferDataFlow(profile, { entryPointAnalysis, httpRoutes, reactRoutes, dataLayer, harness });
  const codeConcerns = buildCodeConcerns(root, profile, { ciDeep, integrationUsage });

  const packageRoles = (profile.packages || []).map((pkg) => {
    const dir = path.dirname(pkg.path);
    const label = dir === '.' ? 'root' : dir;
    let role = 'package';
    if (/backend|api|server/i.test(label)) role = 'backend API';
    else if (/frontend|client|web|app/i.test(label)) role = 'frontend UI';
    else if (/shared|common|lib/i.test(label)) role = 'shared library';
    const fw = Object.keys(pkg.mainVersions || {}).join(', ');
    return { path: label, name: pkg.name, role, frameworks: fw || null };
  });

  return {
    readme,
    harness,
    entryPointAnalysis,
    annotatedTree,
    httpRoutes,
    reactRoutes,
    dataLayer,
    envUsage,
    integrationUsage,
    namingConventions,
    testHelpers,
    ciDeep,
    architectureDiagram,
    dataFlow,
    codeConcerns,
    packageRoles,
  };
}
