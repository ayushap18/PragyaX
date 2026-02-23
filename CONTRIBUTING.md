# Contributing to PragyaX

Thank you for your interest in contributing to PragyaX. This document outlines the process for contributing to this project.

---

## Before You Start

PragyaX is a **proprietary project** owned by Ayush Pandey. By contributing, you agree that:

1. All contributions become the intellectual property of the project owner
2. You have the right to submit the contribution (it is your original work)
3. You will not use code from this project in other projects without explicit written permission
4. Your contribution does not contain code copied from other proprietary projects

**Read [LICENSE.md](./LICENSE.md) before contributing.**

---

## How to Contribute

### Step 1: Open an Issue First

**Do NOT submit a pull request without an associated issue.**

Before writing any code, open a GitHub Issue describing:

- **What** you want to change or add
- **Why** it is needed (bug report, feature request, performance improvement)
- **How** you plan to implement it (brief technical approach)

**Issue Templates:**

#### Bug Report
```
Title: [BUG] Short description

**Environment:**
- OS:
- Node version:
- Browser:

**Description:**
What happened vs what was expected.

**Steps to Reproduce:**
1.
2.
3.

**Screenshots (if applicable):**

**Severity:** Critical / High / Medium / Low
```

#### Feature Request
```
Title: [FEATURE] Short description

**Description:**
What feature you want to add and why.

**Proposed Implementation:**
Technical approach (components, stores, APIs affected).

**Files Affected:**
List the files you expect to modify.

**Visual Reference (if UI change):**
Mockup, screenshot, or description of visual outcome.
```

#### Performance Issue
```
Title: [PERF] Short description

**Description:**
What is slow and under what conditions.

**Measurements:**
FPS, load time, memory usage, etc.

**Proposed Fix:**
Technical approach to improve performance.
```

### Step 2: Wait for Approval

The project maintainer will review your issue and either:

- **Approve** it with a `go-ahead` label -- you may proceed to code
- **Request changes** -- modify your proposal based on feedback
- **Decline** -- the change is not needed or conflicts with project direction

**Do NOT start coding until your issue is approved.**

### Step 3: Fork and Branch

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/PragyaX.git
cd PragyaX/worldview

# Create a branch named after your issue
git checkout -b issue-42-add-geofence-layer
```

**Branch naming convention:**
```
issue-{number}-{short-description}
```

Examples:
- `issue-12-fix-satellite-loading`
- `issue-35-add-heat-map-overlay`
- `issue-8-improve-boot-sequence`

### Step 4: Write Code

Follow these rules:

#### Code Style

- **TypeScript** -- All files must be `.ts` or `.tsx`, no `.js`
- **Functional components** -- No class components
- **Zustand** -- All shared state goes through Zustand stores
- **Tailwind CSS** -- Use Tailwind classes, avoid inline styles unless dynamic values require them
- **No external UI libraries** -- No Material UI, Chakra, Ant Design, etc. Everything is custom-built
- **No external chart libraries** -- Charts are canvas-based, hand-rolled
- **Cesium entities** -- Layers return `null` and manage entities via `useCesiumStore`

#### File Organization

| Type | Location | Naming |
|------|----------|--------|
| React components | `src/components/{category}/` | `PascalCase.tsx` |
| Hooks | `src/hooks/` | `useCamelCase.ts` |
| Stores | `src/stores/` | `camelCaseStore.ts` |
| Constants | `src/constants/` | `camelCase.ts` |
| Services | `src/services/` | `camelCaseService.ts` |
| API routes | `src/app/api/{name}/` | `route.ts` |
| Utilities | `src/utils/` | `camelCase.ts` |

#### Component Pattern

```tsx
"use client";

import { useState, useEffect } from "react";
import { useSomeStore } from "@/stores/someStore";

export default function MyComponent() {
  // 1. Store subscriptions
  const value = useSomeStore((s) => s.value);

  // 2. Local state
  const [local, setLocal] = useState(false);

  // 3. Effects
  useEffect(() => {
    // ...
  }, []);

  // 4. Render
  return <div>...</div>;
}
```

#### Cesium Layer Pattern

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useCesiumStore } from "@/stores/cesiumStore";
import { useLayerStore } from "@/stores/layerStore";
import { useDataStore } from "@/stores/dataStore";

export default function MyLayer() {
  const viewer = useCesiumStore((s) => s.viewer);
  const enabled = useLayerStore((s) => s.myLayer);
  const data = useDataStore((s) => s.myData);
  const entityIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!viewer || !enabled) {
      // Cleanup entities
      entityIds.current.forEach((id) => {
        const entity = viewer?.entities.getById(id);
        if (entity) viewer.entities.remove(entity);
      });
      entityIds.current.clear();
      return;
    }

    // Create/update entities
    data.forEach((item) => {
      // ... entity management
    });
  }, [viewer, enabled, data]);

  return null; // Layers are headless
}
```

#### CSS Animations

All animations go in `src/app/globals.css` under the appropriate section:

```css
/* Section header format */
/* ═══════════════════════════════════════════
   SECTION NAME
   ═══════════════════════════════════════════ */

@keyframes my-animation {
  0% { ... }
  100% { ... }
}
.animate-my-animation {
  animation: my-animation 2s ease-in-out infinite;
}
```

### Step 5: Test Your Changes

Before submitting:

```bash
# Build must pass with 0 errors
npm run build

# Lint must pass (warnings OK, errors NOT OK)
npx eslint src/

# Manual testing checklist:
# [ ] App boots without errors
# [ ] Boot sequence plays correctly
# [ ] All 7 visual modes render without glitches
# [ ] Chanakya mode activates/deactivates cleanly
# [ ] Your changes work in both WORLDVIEW and CHANAKYA modes
# [ ] No console errors in browser DevTools
# [ ] Performance: FPS stays above 30 with your changes
```

### Step 6: Submit Pull Request

```bash
git add .
git commit -m "feat: add geofence alert system (#42)"
git push origin issue-42-add-geofence-layer
```

Then open a Pull Request on GitHub with this format:

```
Title: feat: short description (#issue-number)

## Summary
- What was added/changed/fixed
- Why it was needed

## Changes
- List of files modified and what changed in each

## Testing
- [ ] Build passes (0 errors)
- [ ] ESLint passes (0 errors)
- [ ] Tested in WORLDVIEW mode
- [ ] Tested in CHANAKYA mode
- [ ] Tested in all 7 visual modes
- [ ] No console errors
- [ ] FPS remains above 30

## Screenshots (if UI change)
Before:
After:

## Related Issue
Closes #42
```

**Commit message prefixes:**
| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `perf:` | Performance improvement |
| `refactor:` | Code restructure (no behavior change) |
| `style:` | CSS/visual change only |
| `docs:` | Documentation update |
| `chore:` | Build config, dependencies |

---

## What NOT to Do

- **Do NOT** submit PRs without an approved issue
- **Do NOT** copy code from other projects (we will check)
- **Do NOT** add external UI component libraries
- **Do NOT** modify the boot sequence without approval
- **Do NOT** change the audio engine tonal profile without approval
- **Do NOT** remove or disable existing features in your PR
- **Do NOT** commit `.env`, API keys, or credentials
- **Do NOT** push directly to `main` -- always use branches and PRs
- **Do NOT** use this codebase in your own projects (see LICENSE.md)

---

## Code Review Process

1. All PRs are reviewed by the project maintainer
2. Expect review within 7 days
3. Address all review comments before merge
4. Squash merge is used -- your commits will be combined into one
5. Branch is deleted after merge

---

## Questions?

Open a GitHub Issue with the `[QUESTION]` prefix if you need clarification on anything.

---

**Copyright 2026 Ayush Pandey. All rights reserved.**
