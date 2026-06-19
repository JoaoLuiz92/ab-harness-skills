# Feedback Loops

## Loop types

| Loop | When | Who | Replaces formal lane? |
|------|------|-----|------------------------|
| **Fast loop** | During Execute | Implementer | No |
| **Per-task gate** | After each task | Implementer | No |
| **Validate fix** | After feature work | Implementer + checklist | No |
| **Validation lane** | Before merge | Isolated runners | Yes (formal gate) |
| **CI loop** | On push/PR | Automation | Complements lane |
| **Lane retry** | Lane failed | Human + implementer | Re-run full lane |

## Fast loop (during implementation)

Run focused tests while coding:

```bash
# Example — replace with commands from lane-commands.json
npm test -- <pattern>
```

Allowed during development. **Does not** satisfy merge gate.

## Per-task loop (Execute)

For each task:

```
implement → gate check → (fix until green) → commit → next task
```

Sub-loops:

- **RED → GREEN** if TDD: test fails → minimal implementation → pass
- **Gate retry**: non-zero exit → fix → re-run until green
- **Simplify**: if overcomplicated → simplify → re-run gate

## Validate macro loop

After Execute, if acceptance criteria fail:

1. Diagnose (max 3 iterations per issue)
2. Create fix task
3. Return to Execute
4. Re-validate

Cap at 3 diagnostic iterations; escalate to human if unresolved.

## Re-plan loop

If implementation diverges from spec or unexpected architecture appears:

**Stop. Re-plan.** Update spec/design before more code.

## Validation lane retry

Harness is linear (no auto-retry). On failure:

1. Fix code
2. New handoff
3. Re-run all runners
4. Merge again

## What is NOT a loop

- Parallel runners (one shot each)
- Merge (single consolidation)
- Model routing (phase selection, not iteration)
