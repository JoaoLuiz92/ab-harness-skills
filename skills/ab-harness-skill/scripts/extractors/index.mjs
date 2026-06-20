/**
 * Extractor registry — detectStack() → apply relevant extractors.
 */
import { runGenericExtractors } from './generic.mjs';
import { detectNest, runNestExtractors } from './node-nest.mjs';
import { detectReact, runReactExtractors } from './node-react.mjs';
import { runDeepAnalysis } from './deep-analysis.mjs';

export function detectStack(root, packages) {
  const stacks = [];
  if (detectNest(root, packages)) stacks.push('nestjs');
  if (detectReact(root, packages)) stacks.push('react');
  if (!stacks.length) stacks.push('generic');
  return stacks;
}

function mergeUnique(arrays, keyFn) {
  const seen = new Set();
  const out = [];
  for (const arr of arrays) {
    for (const item of arr) {
      const key = keyFn(item);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function runExtractors(root, ctx) {
  const { packages, ciWorkflows } = ctx;
  const stacks = detectStack(root, packages);
  const generic = runGenericExtractors(root, { packages, ciWorkflows });

  let modules = generic.modules;
  let authHints = generic.authHints;
  let apiPatterns = generic.apiPatterns;
  const detectedStacks = [...stacks];

  let nestResult = null;
  if (stacks.includes('nestjs')) {
    nestResult = runNestExtractors(root);
    if (nestResult.modules.length) modules = nestResult.modules;
    authHints = mergeUnique([nestResult.authHints, authHints], (h) => `${h.label}:${h.file}`);
  }

  if (stacks.includes('react')) {
    const react = runReactExtractors(root, generic.packages || packages);
    modules = mergeUnique([react.modules, modules], (m) => `${m.path}:${m.name}`);
    apiPatterns = mergeUnique([react.apiPatterns, apiPatterns], (p) => `${p.type}:${p.file || p.alias}`);
  }

  const partialProfile = {
    ...generic,
    modules,
    authHints,
    apiPatterns,
    detectedStacks,
    primaryStack: detectedStacks[0] || 'generic',
    packages: generic.packages || packages,
    ciWorkflows,
    entryPoints: generic.entryPoints,
    envVars: generic.envVars,
    externalDeps: generic.externalDeps,
    testInventory: generic.testInventory,
    docker: generic.docker,
    migrations: generic.migrations,
    envFiles: generic.envFiles,
    integrationHints: ctx.integrationHints,
  };

  const deep = runDeepAnalysis(root, partialProfile);

  return {
    ...partialProfile,
    deep,
    controllers: nestResult?.controllers || [],
  };
}

export { runGenericExtractors } from './generic.mjs';
export { detectNest, runNestExtractors } from './node-nest.mjs';
export { detectReact, runReactExtractors } from './node-react.mjs';
