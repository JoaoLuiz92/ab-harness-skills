/**
 * NestJS-specific extractors: modules, guards, controllers.
 */
import fs from 'node:fs';
import path from 'node:path';

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

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8').slice(0, 4000);
  } catch {
    return '';
  }
}

export function detectNest(root, packages) {
  const hasNestDep = packages.some(
    (p) =>
      (p.dependencies || []).some((d) => d.includes('@nestjs')) ||
      (p.devDependencies || []).some((d) => d.includes('@nestjs')),
  );
  const hasModuleFiles = walkFiles(root, /\.module\.(ts|js)$/, 4).length > 0;
  return hasNestDep || hasModuleFiles;
}

export function extractNestModules(root) {
  const moduleFiles = walkFiles(root, /\.module\.(ts|js)$/, 5);
  const modules = [];
  for (const f of moduleFiles) {
    if (f.includes('node_modules')) continue;
    const content = readSafe(path.join(root, f));
    const classMatch = content.match(/export class (\w+Module)/);
    const imports = [...content.matchAll(/imports:\s*\[([^\]]+)\]/gs)].flatMap((m) =>
      [...m[1].matchAll(/(\w+Module)/g)].map((x) => x[1]),
    );
    const controllers = [...content.matchAll(/(\w+Controller)/g)].map((m) => m[1]);
    const providers = [...content.matchAll(/providers:\s*\[([^\]]+)\]/gs)].flatMap((m) =>
      [...m[1].matchAll(/(\w+Service|\w+Provider)/g)].map((x) => x[1]),
    );
    const name = classMatch ? classMatch[1] : path.basename(f, path.extname(f));
    modules.push({
      name,
      path: f,
      type: 'nestjs-module',
      imports: imports.slice(0, 6),
      controllers: controllers.slice(0, 4),
      providers: providers.slice(0, 4),
    });
  }
  return modules;
}

export function extractNestControllers(root) {
  const files = walkFiles(root, /\.controller\.(ts|js)$/, 5);
  return files.map((f) => {
    const content = readSafe(path.join(root, f));
    const base = content.match(/@Controller\(['"]([^'"]*)['"]\)/)?.[1] || '';
    const endpoints = [
      ...[...content.matchAll(/@(Get|Post|Put|Delete|Patch)\(['"]?([^'")\s]*)['"]?\)/g)].map(
        (m) => `${m[1].toUpperCase()} /${base}${m[2]}`,
      ),
    ];
    return { file: f, base, endpoints: endpoints.slice(0, 8) };
  });
}

export function extractNestAuthHints(root) {
  const hints = [];
  const guards = walkFiles(root, /\.guard\.(ts|js)$/, 5);
  for (const f of guards) {
    const content = readSafe(path.join(root, f));
    const name = content.match(/export class (\w+)/)?.[1] || path.basename(f);
    hints.push({ label: `Guard: ${name}`, file: f });
  }
  const files = walkFiles(root, /\.(ts|js)$/, 5).slice(0, 80);
  for (const f of files) {
    if (f.includes('node_modules')) continue;
    const content = readSafe(path.join(root, f));
    if (/@Public\(\)/.test(content)) hints.push({ label: '@Public() — skip auth', file: f });
    if (/@UseGuards\(/.test(content) && !hints.some((h) => h.file === f)) {
      hints.push({ label: '@UseGuards applied', file: f });
    }
  }
  return hints;
}

export function runNestExtractors(root) {
  return {
    modules: extractNestModules(root),
    controllers: extractNestControllers(root),
    authHints: extractNestAuthHints(root),
    stack: 'nestjs',
  };
}
