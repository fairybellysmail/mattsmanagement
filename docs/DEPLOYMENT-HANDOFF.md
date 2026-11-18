# Project AUREL — Reusable Deployment & CI/CD Handoff Guide

## 1. Executive Summary & Architecture

This guide provides an end-to-end operational runbook for deploying and maintaining the **Project AUREL** frontend application repository (`fairybellysmail/mattsmanagement`).

### Technical Specifications
- **Stack**: Vite 6 multi-page static application (Vanilla ES Modules, modern CSS custom properties).
- **Runtime Standard**: **Node.js 24** across all automated workflows (`actions/setup-node@v4` with `node-version: 24`).
- **Primary Hosting Target**: **GitHub Pages** (Active & Live: [https://fairybellysmail.github.io/mattsmanagement/](https://fairybellysmail.github.io/mattsmanagement/)).
- **Secondary Hosting Target**: **Vercel** (Integrated dual-target deployment workflow supporting Preview and Production environments).
- **Testing Standard**: Native Node.js test runner for unit tests, Vite production build validation, and multi-browser Playwright end-to-end tests across Chromium, Firefox, and WebKit (Safari engine).

---

## 2. CI/CD Workflow Catalog

The repository includes four specialized GitHub Actions workflows located in `.github/workflows/`:

| Workflow File | Name | Trigger Events | Purpose |
| :--- | :--- | :--- | :--- |
| `test.yml` | **Test Suite (Unit, Build, Playwright)** | Push & PR to `main` and `aurel/**`, manual `workflow_dispatch` | Comprehensive CI pipeline running unit tests, production build, and multi-browser Playwright end-to-end tests. |
| `deploy-github-pages.yml` | **Deploy to GitHub Pages** | Manual `workflow_dispatch` | Dedicated zero-dependency pipeline building static artifacts and deploying to GitHub Pages via official GitHub Actions. |
| `deploy-vercel.yml` | **Deploy to Vercel** | Manual `workflow_dispatch` (inputs: `environment`) | Dedicated pipeline building and deploying to Vercel Preview or Production using `vercel` CLI with repository secrets. |
| `deploy.yml` | **Deploy (Auto-Determine or Select Target)** | Manual `workflow_dispatch` (inputs: `target`, `environment`) | Unified intelligent dispatcher that evaluates credentials and auto-selects Vercel or GitHub Pages, or executes manual target choice. |

---

## 3. GitHub Pages Deployment Runbook

### Prerequisites
1. **GitHub Pages Source Configuration**:
   - Navigate to **Repository Settings** > **Pages**.
   - Under **Build and deployment**, ensure **Source** is set to **GitHub Actions** (`build_type: workflow`).
2. **Workflow Permissions**:
   - Workflows include required granular permissions:
     ```yaml
     permissions:
       contents: read
       pages: write
       id-token: write
     ```

### Execution Methods

#### Method A: GitHub Web Interface (Recommended)
1. Navigate to the repository on GitHub: `https://github.com/fairybellysmail/mattsmanagement`.
2. Click the **Actions** tab.
3. Select **Deploy to GitHub Pages** from the left workflow menu.
4. Click the **Run workflow** dropdown on the right.
5. Select branch **`main`**.
6. Click the green **Run workflow** button.
7. Monitor the workflow execution:
   - **Job: Build & Deploy to GitHub Pages**
     - Step 1: Checkout repository (`actions/checkout@v4`)
     - Step 2: Setup Node.js 24 (`actions/setup-node@v4`)
     - Step 3: Install dependencies (`npm ci`)
     - Step 4: Configure GitHub Pages (`actions/configure-pages@v5`)
     - Step 5: Build static distribution (`npm run build`)
     - Step 6: Upload Pages artifact (`actions/upload-pages-artifact@v3`)
     - Step 7: Deploy to GitHub Pages (`actions/deploy-pages@v4`)

#### Method B: GitHub CLI (`gh`)
```bash
# Trigger dedicated GitHub Pages deployment
gh workflow run deploy-github-pages.yml --ref main

# Or trigger using the intelligent unified dispatcher
gh workflow run deploy.yml --ref main -f target=github-pages -f environment=production
```

#### Method C: GitHub REST API
```bash
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR_GITHUB_PAT>" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/fairybellysmail/mattsmanagement/actions/workflows/deploy-github-pages.yml/dispatches \
  -d '{"ref":"main"}'
```

### Post-Deployment Verification Checklist
Run these smoke tests immediately after deployment completion:

1. **HTTP Status Code Verification**:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://fairybellysmail.github.io/mattsmanagement/
   # Expected output: 200
   ```

2. **Core Pages & Experience Routes**:
   - Home: `https://fairybellysmail.github.io/mattsmanagement/`
   - Fan Memberships: `https://fairybellysmail.github.io/mattsmanagement/experiences/fan-memberships.html`
   - Academy Courses: `https://fairybellysmail.github.io/mattsmanagement/experiences/academy-courses.html`
   - Celebrity Access: `https://fairybellysmail.github.io/mattsmanagement/experiences/celebrity-access.html`

3. **Asset Integrity Check**:
   - Verify bundled JavaScript loads: `/mattsmanagement/assets/main-[hash].js`
   - Verify bundled CSS loads: `/mattsmanagement/assets/main-[hash].css`
   - Verify all navigation links use relative or repository subpath (`/mattsmanagement/`) to prevent 404 broken routes.

---

## 4. Vercel Deployment Runbook

### Prerequisites & Secrets Setup
Before deploying to Vercel, configure the following secrets in **Repository Settings** > **Secrets and variables** > **Actions**:

| Secret Name | Description | Where to Find |
| :--- | :--- | :--- |
| `VERCEL_TOKEN` | Vercel Personal Access Token | Vercel Dashboard > Account Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel Team or User ID | Run `vercel link` locally, or check Team Settings in Vercel |
| `VERCEL_PROJECT_ID` | Vercel Project Identifier | Vercel Project Settings > General > Project ID |

### Execution Methods

#### Method A: GitHub Web Interface
1. In the **Actions** tab, select **Deploy to Vercel**.
2. Click **Run workflow**.
3. Choose branch **`main`** and target environment:
   - `preview`: Creates an ephemeral preview URL.
   - `production`: Promotes the build to the live production domain.
4. Click **Run workflow**.

#### Method B: GitHub CLI (`gh`)
```bash
# Preview deployment
gh workflow run deploy-vercel.yml --ref main -f environment=preview

# Production deployment
gh workflow run deploy-vercel.yml --ref main -f environment=production
```

---

## 5. Quality Assurance & Testing Pipeline

Automated tests run on every push and pull request to `main` and `aurel/**` feature branches.

### Testing Stages
1. **Unit Test Suite**:
   - Command: `npm test`
   - Framework: Native Node.js test runner (`node --test tests/unit/*.test.js`).
   - Scope: Configuration validation, base path handling, client-only demo form assertions.
2. **Build Verification**:
   - Command: `npm run build`
   - Framework: Vite 6 with multi-page entrypoints (`index.html` and `experiences/*.html`).
   - Scope: Asset bundling, module resolution, CSS minification.
3. **End-to-End Browser Tests**:
   - Command: `npx playwright install --with-deps && npm run test:browser`
   - Framework: Playwright (`@playwright/test`).
   - Browsers: Chromium (Desktop), Firefox (Desktop), WebKit (Safari engine).
   - Test Cases:
     - Navigation visibility across viewports (desktop bar & mobile hamburger drawer).
     - Page accessibility landmarks (`main`, `nav`, `h1`).
     - Interactive components (enquiry form mock validation, tab stops, ARIA labels).

### Inspecting Test Artifacts
If Playwright tests fail in CI:
1. Open the failed run under the **Actions** tab.
2. Scroll to the **Artifacts** section at the bottom.
3. Download `playwright-report.zip`.
4. Extract and open `index.html` locally to view trace logs, DOM snapshots, and console outputs.

---

## 6. Runtime Maintenance & Operational Best Practices

### Node.js 24 Standardization
- All GitHub Actions workflows explicitly target **Node.js 24** (`node-version: 24`).
- **Compatibility**:
  - `actions/checkout@v4`: Native runner compatibility.
  - `actions/setup-node@v4`: Full support for Node 24 runtime and npm cache.
  - `actions/upload-artifact@v4`: Artifact compression and upload compatibility.
  - `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`: Verified clean execution without Node runtime deprecation warnings.

### Concurrency Controls
- **Test Workflow (`test.yml`)**: Configured with `cancel-in-progress: true` to prevent redundant runner usage when commits are rapidly pushed to a branch.
- **Deployment Workflows (`deploy*.yml`)**: Configured with `cancel-in-progress: false` to ensure in-flight production releases complete without corruption or partial deployments.

### Rollback Procedures
If a regression is identified post-deployment:
1. Revert the problematic commit on `main` or check out the last known healthy commit:
   ```bash
   git checkout main
   git revert HEAD
   git push origin main
   ```
2. Trigger the deployment workflow (`deploy-github-pages.yml` or `deploy-vercel.yml`) on `main`.
3. Verify the deployment restores the previous working state.
