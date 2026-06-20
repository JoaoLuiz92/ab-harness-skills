/**
 * React/Vite-specific extractors: routes, path aliases.
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

function walkFiles(dir, pattern, maxDepth = 5, depth = 0, base = dir, acc = []) {
  if (depth > maxDepth) return acc;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (['node_modules', 'dist', '.git'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkFiles(full, pattern, maxDepth, depth + 1, base, acc);
    } else if (pattern.test(e.name)) {
      acc.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return acc;
}

export function detectReact(root, packages) {
  const hasReact = packages.some(
    (p) =>
      (p.dependencies || []).some((d) => d === 'react' || d.startsWith('react-')) ||
      (p.devDependencies || []).some((d) => d === 'react' || d.startsWith('@vitejs')),
  );
  const hasApp = exists(path.join(root, 'src', 'App.tsx')) || exists(path.join(root, 'src', 'App.jsx'));
  return hasReact || hasApp;
}

export function extractReactRoutes(root) {
  const routes = [];
  const pagesDir = ['src/pages', 'src/routes', 'src/views', 'frontend/src/pages'];
  for (const d of pagesDir) {
    const full = path.join(root, d);
    if (!exists(full)) continue;
    try {
      for (const e of fs.readdirSync(full, { withFileTypes: true })) {
        if (e.isFile() && /\.(tsx|jsx|vue)$/.test(e.name)) {
          routes.push({ name: e.name.replace(/\.(tsx|jsx|vue)$/, ''), path: `${d}/${e.name}`, type: 'page' });
        } else if (e.isDirectory()) {
          routes.push({ name: e.name, path: `${d}/${e.name}`, type: 'route-group' });
        }
      }
    } catch {
      /* skip */
    }
  }
  const appFiles = ['src/App.tsx', 'src/App.jsx', 'frontend/src/App.tsx'];
  for (const f of appFiles) {
    if (!exists(path.join(root, f))) continue;
    const content = fs.readFileSync(path.join(root, f), 'utf8');
    const routeMatches = content.matchAll(/<Route[^>]+path=["']([^"']+)["']/g);
    for (const m of routeMatches) {
      routes.push({ name: m[1], path: f, type: 'react-route' });
    }
  }
  return routes;
}

export function extractViteAliases(root, packages) {
  const aliases = [];
  const configs = walkFiles(root, /^vite\.config\.(ts|js|mjs)$/, 3);
  for (const cfg of configs) {
    const raw = fs.readFileSync(path.join(root, cfg), 'utf8');
    const aliasMatch = raw.match(/alias:\s*\{([^}]+)\}/s);
    if (aliasMatch) {
      const pairs = aliasMatch[1].matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g);
      for (const p of pairs) aliases.push({ alias: p[1], target: p[2], config: cfg });
    }
  }
  for (const pkg of packages) {
    const dir = path.dirname(pkg.path);
    const tsconfig = path.join(root, dir === '.' ? 'tsconfig.json' : `${dir}/tsconfig.json`);
    const ts = readJsonSafe(tsconfig);
    const paths = ts?.compilerOptions?.paths;
    if (paths) {
      for (const [alias, targets] of Object.entries(paths)) {
        aliases.push({ alias, target: targets[0], config: path.relative(root, tsconfig) });
      }
    }
  }
  return aliases;
}

export function runReactExtractors(root, packages) {
  return {
    modules: extractReactRoutes(root).map((r) => ({ ...r, type: r.type || 'react-route' })),
    apiPatterns: extractViteAliases(root, packages).map((a) => ({
      type: 'path-alias',
      alias: a.alias,
      target: a.target,
      file: a.config,
    })),
    stack: 'react',
  };
}
