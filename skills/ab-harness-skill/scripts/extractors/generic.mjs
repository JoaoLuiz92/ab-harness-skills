/**
 * Generic stack-agnostic extractors: env, docker, CI, tests, deps, entry points.
 */
import fs from 'node:fs';
import path from 'node:path';

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

function walkFiles(dir, pattern, maxDepth = 4, depth = 0, base = dir, acc = []) {
  if (depth > maxDepth || !exists(dir)) return acc;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (['node_modules', '.git', 'dist', 'build', 'vendor', '.next'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkFiles(full, pattern, maxDepth, depth + 1, base, acc);
    } else if (pattern.test(e.name)) {
      acc.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return acc;
}

const ENTRY_POINT_NAMES = [
  'main.ts',
  'main.js',
  'index.ts',
  'index.js',
  'app.ts',
  'app.js',
  'server.ts',
  'server.js',
  'Program.cs',
  'main.py',
  'manage.py',
  'main.go',
];

const EXTERNAL_DEP_HINTS = [
  'supabase',
  'stripe',
  'redis',
  'ioredis',
  'postgres',
  'pg',
  'mysql',
  'mongodb',
  'mongoose',
  'prisma',
  '@prisma/client',
  'firebase',
  'aws-sdk',
  '@aws-sdk',
  'openai',
  'twilio',
  'sendgrid',
  '@sendgrid/mail',
  'auth0',
  '@auth0',
  'sentry',
  '@sentry',
];

export function extractLanguages(root) {
  const exts = new Set();
  const samples = walkFiles(root, /\.(ts|tsx|js|jsx|py|go|rs|cs|java|rb|php|vue|svelte)$/i, 3);
  for (const f of samples) {
    const ext = path.extname(f).slice(1).toLowerCase();
    if (ext) exts.add(ext);
  }
  const langs = [];
  if ([...exts].some((e) => ['ts', 'tsx', 'js', 'jsx'].includes(e))) langs.push('javascript/typescript');
  if (exts.has('py')) langs.push('python');
  if (exts.has('go')) langs.push('go');
  if (exts.has('rs')) langs.push('rust');
  if (exts.has('cs')) langs.push('csharp');
  if (exts.has('java')) langs.push('java');
  if (exts.has('rb')) langs.push('ruby');
  if (exts.has('php')) langs.push('php');
  if (exts.has('vue')) langs.push('vue');
  if (exts.has('svelte')) langs.push('svelte');
  return langs;
}

export function extractEntryPoints(root) {
  const found = [];
  for (const name of ENTRY_POINT_NAMES) {
    const matches = walkFiles(root, new RegExp(`^${name.replace('.', '\\.')}$`), 4);
    for (const m of matches) {
      if (!m.includes('node_modules')) found.push(m);
    }
  }
  return [...new Set(found)].slice(0, 20);
}

export function extractEnvVars(root) {
  const envFiles = walkFiles(root, /^\.env(\..+)?$|\.env\.example$|\.env\.sample$/i, 3);
  const keys = new Set();
  for (const rel of envFiles) {
    if (rel.includes('node_modules')) continue;
    const content = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=/);
      if (m) keys.add(m[1]);
    }
  }
  return { files: [...new Set(envFiles)], keys: [...keys] };
}

export function extractDocker(root) {
  const docker = {
    dockerfile: exists(path.join(root, 'Dockerfile')) ? 'Dockerfile' : null,
    compose: [],
    nginx: null,
  };
  for (const f of ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml']) {
    if (exists(path.join(root, f))) docker.compose.push(f);
  }
  const nginx = walkFiles(root, /nginx\.conf$/i, 3);
  if (nginx.length) docker.nginx = nginx[0];
  return docker;
}

export function extractMigrations(root) {
  const paths = [];
  const candidates = [
    'supabase/migrations',
    'prisma/migrations',
    'prisma/schema.prisma',
    'alembic',
    'db/migrate',
    'migrations',
  ];
  for (const c of candidates) {
    if (exists(path.join(root, c))) paths.push(c);
  }
  return paths;
}

function parseYamlJobs(content) {
  const jobs = [];
  const nameRe = /^\s{2}([a-zA-Z0-9_-]+):\s*$/gm;
  let match;
  while ((match = nameRe.exec(content)) !== null) {
    const block = content.slice(match.index, match.index + 800);
    const steps = [];
    if (/npm (run )?test|pytest|go test|cargo test/i.test(block)) steps.push('test');
    if (/npm run lint|eslint|ruff|flake8/i.test(block)) steps.push('lint');
    if (/npm run build|docker build|cargo build/i.test(block)) steps.push('build');
    const triggers = [];
    if (/push:/i.test(block)) triggers.push('push');
    if (/pull_request:/i.test(block)) triggers.push('pull_request');
    jobs.push({ name: match[1], triggers, steps });
  }
  return jobs;
}

export function extractCiJobs(root, ciWorkflows) {
  const jobs = [];
  for (const wf of ciWorkflows) {
    const p = path.join(root, wf);
    if (!exists(p)) continue;
    try {
      const content = fs.readFileSync(p, 'utf8');
      const parsed = parseYamlJobs(content);
      for (const j of parsed) jobs.push({ workflow: wf, ...j });
    } catch {
      jobs.push({ workflow: wf, name: path.basename(wf), triggers: [], steps: [] });
    }
  }
  return jobs;
}

export function extractTestInventory(root) {
  const patterns = [
    /\.spec\.(ts|tsx|js|jsx)$/i,
    /\.test\.(ts|tsx|js|jsx)$/i,
    /^test_.*\.py$/i,
    /_test\.go$/i,
  ];
  const files = [];
  for (const pat of patterns) {
    files.push(...walkFiles(root, pat, 5));
  }
  const configs = [];
  for (const c of [
    'jest.config.js',
    'jest.config.ts',
    'vitest.config.ts',
    'vitest.config.js',
    'playwright.config.ts',
    'cypress.config.ts',
    'pytest.ini',
    'pyproject.toml',
  ]) {
    if (exists(path.join(root, c))) configs.push(c);
    for (const sub of ['backend', 'frontend', 'apps', 'packages']) {
      const sp = path.join(root, sub, c);
      if (exists(sp)) configs.push(`${sub}/${c}`);
    }
  }
  return {
    testFiles: [...new Set(files)].slice(0, 50),
    testFileCount: [...new Set(files)].length,
    configs: [...new Set(configs)],
  };
}

export function extractExternalDeps(packages) {
  const external = [];
  for (const pkg of packages) {
    const all = { ...Object.fromEntries((pkg.dependencies || []).map((d) => [d, true])), ...Object.fromEntries((pkg.devDependencies || []).map((d) => [d, true])) };
    const deps = Object.keys(all);
    for (const hint of EXTERNAL_DEP_HINTS) {
      const match = deps.find((d) => d.includes(hint) || d === hint);
      if (match) external.push({ package: pkg.path, dependency: match });
    }
  }
  return external;
}

export function extractModulesFallback(root, packages) {
  const modules = [];
  for (const pkg of packages) {
    const dir = path.dirname(pkg.path);
    if (dir === '.') continue;
    modules.push({ name: path.basename(dir), path: dir, type: 'package' });
  }
  const topDirs = ['src', 'lib', 'app', 'api', 'services'];
  for (const d of topDirs) {
    if (exists(path.join(root, d))) modules.push({ name: d, path: d, type: 'directory' });
  }
  return modules;
}

export function extractAuthHints(root) {
  const hints = [];
  const codeFiles = walkFiles(root, /\.(ts|tsx|js|jsx)$/i, 4).slice(0, 200);
  const patterns = [
    { re: /@Public\(\)/, label: '@Public decorator' },
    { re: /AuthGuard|JwtAuthGuard|UseGuards/, label: 'NestJS guards' },
    { re: /passport|jwt\.sign|jsonwebtoken/i, label: 'JWT/passport' },
    { re: /middleware.*auth|authMiddleware/i, label: 'auth middleware' },
    { re: /supabase\.auth/i, label: 'Supabase auth' },
  ];
  for (const f of codeFiles) {
    if (f.includes('node_modules')) continue;
    let content;
    try {
      content = fs.readFileSync(path.join(root, f), 'utf8');
    } catch {
      continue;
    }
    for (const { re, label } of patterns) {
      if (re.test(content) && !hints.some((h) => h.label === label)) {
        hints.push({ label, file: f });
      }
    }
  }
  return hints;
}

export function extractApiPatterns(root) {
  const patterns = [];
  const codeFiles = walkFiles(root, /\.(ts|tsx|js|jsx)$/i, 4).slice(0, 150);
  for (const f of codeFiles) {
    if (f.includes('node_modules')) continue;
    let content;
    try {
      content = fs.readFileSync(path.join(root, f), 'utf8');
    } catch {
      continue;
    }
    if (/Interceptor|@UseInterceptors/.test(content) && !patterns.some((p) => p.type === 'interceptor')) {
      patterns.push({ type: 'interceptor', file: f });
    }
    if (/{ success:\s*(true|false)|data:\s*\w+,\s*message:/.test(content) && !patterns.some((p) => p.type === 'envelope')) {
      patterns.push({ type: 'response-envelope', file: f });
    }
    if (/@['"]@\//.test(content) || /from ['"]@\//.test(content)) {
      if (!patterns.some((p) => p.type === 'path-alias')) patterns.push({ type: 'path-alias', alias: '@/', file: f });
    }
  }
  return patterns;
}

export function enrichPackages(root, packages) {
  return packages.map((pkg) => {
    const full = path.join(root, pkg.path);
    const raw = readJsonSafe(full);
    if (!raw) return pkg;
    const mainVersions = {};
    for (const [k, v] of Object.entries({ ...raw.dependencies, ...raw.devDependencies })) {
      if (['react', 'vue', '@nestjs/core', 'express', 'fastify', 'next', 'vite'].some((f) => k.includes(f))) {
        mainVersions[k] = v;
      }
    }
    return {
      ...pkg,
      version: raw.version || null,
      mainVersions,
      devScript: raw.scripts?.dev || raw.scripts?.start || null,
      dependencies: Object.keys(raw.dependencies || {}),
      devDependencies: Object.keys(raw.devDependencies || {}),
    };
  });
}

export function runGenericExtractors(root, ctx) {
  const { packages, ciWorkflows } = ctx;
  const env = extractEnvVars(root);
  return {
    languages: extractLanguages(root),
    entryPoints: extractEntryPoints(root),
    envVars: env.keys,
    envFiles: env.files,
    docker: extractDocker(root),
    migrations: extractMigrations(root),
    ciJobs: extractCiJobs(root, ciWorkflows),
    testInventory: extractTestInventory(root),
    externalDeps: extractExternalDeps(packages),
    authHints: extractAuthHints(root),
    apiPatterns: extractApiPatterns(root),
    modules: extractModulesFallback(root, packages),
    packages: enrichPackages(root, packages),
  };
}
