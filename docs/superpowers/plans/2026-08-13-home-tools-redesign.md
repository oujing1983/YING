# Home and Tools Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Produce a local-only visual preview of the ZWPACK homepage and online-tools column with a more credible industrial B2B design.

**Architecture:** Preserve all existing APIs and routes. Recompose existing React sections, introduce one focused tools teaser component, and reuse static demo screenshots as tool visuals. Do not deploy or change server data.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Framer Motion.

## Global Constraints

- No server deployment or GitHub push before user approval.
- No new runtime dependency.
- Preserve route and CMS interfaces.
- Keep demo geometry code unchanged.

### Task 1: Establish local preview runtime

- Restore package metadata from the existing lockfile dependency set.
- Install with the existing lockfile and verify the current site builds.

### Task 2: Recompose homepage hierarchy

- Refine Hero geometry and remove the decorative scroll cue.
- Convert Products into a one-plus-three asymmetric grid.
- Extract the tools CTA into a dedicated section.
- Convert Advantages into a compact two-column capability list.

### Task 3: Align the tools column

- Replace the simulated tool illustration with real preview screenshots.
- Align typography, radius, spacing, and color with the homepage.

### Task 4: Preview verification

- Build successfully.
- Open local preview at desktop and 375px widths.
- Review page copy, overflow, button contrast, reduced motion, and both tool links.
- Show the preview to the user and stop before deployment.
