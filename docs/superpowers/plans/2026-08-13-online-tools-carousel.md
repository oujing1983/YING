# Online Tools Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an independent online-tools column that showcases the carton dieline and EPE designer demos in a carousel and opens each demo in a dedicated full-screen route.

**Architecture:** Keep both demos as isolated static applications under `website/public/tools`. Add a Next.js tools landing route for discovery and two thin full-screen wrapper routes. Update existing navigation and the homepage advantage entry to point to the tools column, without changing the CMS schema or homepage content data.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Framer Motion, static HTML/CSS/JavaScript demos.

## Global Constraints

- Do not change the existing homepage CMS data model.
- Do not embed the editors directly in the carousel.
- Preserve the production-warning text on both demo pages.
- Keep each static demo independently removable and deployable.
- Verify desktop and mobile navigation, carousel controls, and both iframe routes before deployment.

---

### Task 1: Publish both static demo bundles

**Files:**
- Sync: `outputs/zwpack-0201-demo/*` to `website/public/tools/carton-dieline/`
- Create: `website/public/tools/epe-designer/*`

- [ ] Copy the reviewed static bundles without modifying their geometry logic.
- [ ] Confirm all relative assets referenced by both `index.html` files exist.

### Task 2: Add the tools column and full-screen routes

**Files:**
- Create: `website/src/app/tools/page.tsx`
- Create: `website/src/components/tools/ToolsCarousel.tsx`
- Create: `website/src/app/tools/epe-designer/page.tsx`
- Modify: `website/src/app/tools/carton-dieline/page.tsx`

- [ ] Build a two-slide accessible carousel with previous, next, dots, and direct launch actions.
- [ ] Add dedicated iframe wrappers with consistent header, inquiry action, return-to-tools action, and production disclaimer.
- [ ] Ensure the carousel stacks cleanly at 375 px and presents both tools without requiring autoplay.

### Task 3: Connect discovery surfaces

**Files:**
- Modify: `website/src/components/layout/Header.tsx`
- Modify: `website/src/components/home/Advantages.tsx`

- [ ] Rename the existing navigation entry to `在线工具` and link it to `/tools`.
- [ ] Change the homepage advantage CTA to enter the tools column while preserving the existing advantage content structure.

### Task 4: Verify and deploy

**Files:**
- No source additions.

- [ ] Run the available website build or TypeScript verification.
- [ ] Serve the production build or development site locally and test `/tools`, `/tools/carton-dieline`, and `/tools/epe-designer` in the browser.
- [ ] Check the 375 px and desktop layouts.
- [ ] Back up or commit the deployable state, then deploy with the site's existing server procedure.
- [ ] Verify the three public routes over HTTPS and retain the previous build for rollback.
