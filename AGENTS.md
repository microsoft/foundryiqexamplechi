# AGENTS.md - AI Agent Development Guide

> **Purpose:** This document defines strict rules for AI agents (GitHub Copilot, Claude Code, etc.) working on this codebase.
> **Last Updated:** 2025-10-24
> **Project:** Azure AI Search Knowledge Retrieval Demo

---

## 📍 Scope & Location

**Repository Root:** `c:\Dev\azure-ai-search-knowledge-retrieval-demo-main`

**Git Information:**
- Current Branch: `main`
- Main Branch: `main` (use for PRs)
- Repository: `https://github.com/farzad528/azure-ai-search-knowledge-retrieval-demo`

**What This Project Is:**
- Production-ready Next.js application (Foundry IQ Demo) for Azure AI Search Knowledge Retrieval
- Showcases Knowledge Bases (Azure AI Search direct queries) and Azure AI Foundry Agent Service integration
- **No major technical architecture changes** - feature updates only
- Frontend: Next.js 14 + React 18 + TypeScript + TailwindCSS
- Backend: Next.js API Routes with Azure AI Search and Azure AI Foundry integration
- Deployment: Vercel (primary), Azure Static Web Apps, Azure App Service

---

## 🗂️ Project Structure

```
/
├── app/                          # Next.js 14 App Router (✅ MODIFY)
│   ├── api/                      # API routes for Azure services
│   │   ├── agents/              # Knowledge Bases API endpoints
│   │   ├── agentsv2/            # Foundry Agents v2 API (placeholder for future integration)
│   │   │   ├── connections/     # Remote Tool connections management
│   │   │   ├── knowledge-bases/ # Knowledge Bases management for Agents v2
│   │   │   └── responses/       # Single-call response API for Agents v2
│   │   ├── knowledge-bases/     # Knowledge bases endpoints
│   │   ├── knowledge-sources/   # Knowledge source management
│   │   └── index-stats/         # Search index statistics
│   ├── playground/              # Knowledge Bases playground pages
│   ├── agents/                  # Foundry agents playground pages
│   ├── knowledge/               # Knowledge base management pages
│   ├── knowledge-bases/         # Knowledge base list pages
│   ├── knowledge-sources/       # Knowledge source pages
│   ├── agent-builder/           # Agent builder UI
│   ├── test/                    # ⭐ Test playground for direct KB queries on Search resource
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── error.tsx                # Global error boundary
│   └── not-found.tsx            # 404 page
│
├── components/                   # React components (✅ MODIFY)
│   ├── ui/                      # Reusable UI primitives (Button, Input, etc.)
│   ├── forms/                   # Form components (Knowledge Base, Agent forms)
│   ├── shared/                  # Shared components (EmptyState, ErrorState, etc.)
│   └── *.tsx                    # Feature-specific components
│
├── lib/                         # Utility libraries (✅ MODIFY)
│   ├── utils.ts                 # Common utilities (cn, formatDate, etc.)
│   ├── validations.ts           # Zod validation schemas
│   ├── token-manager.ts         # Azure token management
│   ├── api.ts                   # API client functions
│   ├── storage.ts               # Local storage utilities
│   ├── imageProcessing.ts       # Image processing utilities
│   ├── sourceKinds.ts           # Knowledge source type definitions
│   ├── conversationStarters.ts  # Conversation starter templates
│   └── motion.ts                # Framer Motion variants
│
├── types/                       # TypeScript type definitions (✅ MODIFY)
│   ├── knowledge-source-status.ts
│   ├── speech.d.ts
│   └── react-virtuoso.d.ts
│
├── public/                      # Static assets (✅ MODIFY)
│   ├── icons/                   # Icon files
│   └── *                        # Images, fonts, etc.
│
├── infra/                       # Infrastructure as Code (❌ DO NOT MODIFY)
│   ├── main.json                # ARM template
│   └── modules/                 # Bicep modules
│
├── docs/                        # Documentation (❌ DO NOT MODIFY)
├── notebooks/                   # Jupyter notebooks (⚠️ MODIFY WITH CAUTION)
├── test_docs_01/                # Test documents (⚠️ MODIFY WITH CAUTION)
├── scripts/                     # Build/deployment scripts (✅ MODIFY)
├── specs/                       # Specification documents (⚠️ MODIFY WITH CAUTION)
├── messages/                    # Message templates (✅ MODIFY)
├── config/                      # Configuration files (✅ MODIFY)
│   ├── conversation-starters.json        # Conversation starter templates
│   └── conversation-starters.schema.json # JSON schema for starters
│
├── node_modules/                # Dependencies (❌ DO NOT MODIFY)
├── .next/                       # Next.js build output (❌ DO NOT MODIFY)
├── .git/                        # Git internals (❌ DO NOT MODIFY)
├── .devcontainer/               # Dev container config (❌ DO NOT MODIFY)
├── .github/                     # GitHub Actions workflows (⚠️ MODIFY WITH CAUTION)
│
├── package.json                 # Node.js dependencies (✅ MODIFY)
├── tsconfig.json                # TypeScript configuration (⚠️ MODIFY WITH CAUTION)
├── next.config.js               # Next.js configuration (⚠️ MODIFY WITH CAUTION)
├── tailwind.config.js           # TailwindCSS configuration (⚠️ MODIFY WITH CAUTION)
├── postcss.config.js            # PostCSS configuration (⚠️ MODIFY WITH CAUTION)
├── .gitignore                   # Git ignore rules (⚠️ MODIFY WITH CAUTION)
├── .env.example                 # Environment variable template (✅ MODIFY)
├── .env.local                   # Local environment variables (❌ DO NOT COMMIT)
├── README.md                    # Project documentation (⚠️ MODIFY WITH CAUTION)
├── AGENTS.md                    # This file (✅ MODIFY)
├── AZURE_DEPLOYMENT_GUIDE.md    # Azure Static Web Apps deployment guide (✅ MODIFY)
├── VERCEL_DEPLOYMENT.md         # Vercel deployment guide (✅ MODIFY)
├── QUICK_START_VERCEL.md        # Quick start for Vercel (✅ MODIFY)
├── staticwebapp.config.json     # Azure Static Web Apps config (⚠️ MODIFY WITH CAUTION)
├── vercel.json                  # Vercel deployment config (⚠️ MODIFY WITH CAUTION)
├── deploy-to-azure.ps1          # PowerShell deployment script (✅ MODIFY)
└── configure-env-vars.ps1       # Environment configuration script (✅ MODIFY)
```

**Legend:**
- ✅ **MODIFY:** Safe to edit for features, fixes, and improvements
- ⚠️ **MODIFY WITH CAUTION:** Only change when absolutely necessary, discuss with team first
- ❌ **DO NOT MODIFY:** Never edit these files/directories

---

## 🛠️ Tech Stack

### **Core Framework**
- **Next.js:** `^14.0.0` (App Router, Server Components, API Routes)
- **React:** `^18.2.0` (Functional components with hooks)
- **TypeScript:** `5.9.2` (strict mode disabled, but type safety encouraged)
- **Node.js:** `18+` (Required)

### **Styling**
- **TailwindCSS:** `^3.3.5` (Utility-first CSS)
- **PostCSS:** `^8.4.31` (CSS processing)
- **Autoprefixer:** `^10.4.16` (Browser compatibility)
- **Framer Motion:** `^12.23.12` (Animations)
- **class-variance-authority:** `^0.7.1` (Component variants)
- **clsx + tailwind-merge:** Conditional class merging

### **UI Libraries**
- **Radix UI:** `@radix-ui/react-switch` (Accessible primitives)
- **Fluent UI:** `@fluentui/react-icons` (Microsoft icons)
- **Lucide React:** `^0.544.0` (Icon library)

### **Forms & Validation**
- **React Hook Form:** `^7.62.0` (Form state management)
- **Zod:** `^4.1.8` (Schema validation)
- **@hookform/resolvers:** `^5.2.1` (Form validation integration)

### **Azure Integration**
- **@azure/identity:** `^4.12.0` (Azure authentication)
- **Azure AI Search API:** `2025-11-01-preview` (Knowledge Bases)
- **Azure AI Foundry API:** `2025-05-01` (Assistants)
- **Azure OpenAI:** GPT-4o, GPT-4.1, text-embedding-3-small/large

### **State Management**
- **React Context:** For theme (next-themes)
- **Local Storage:** For client-side persistence
- **URL State:** For shareable playground configurations

### **Package Manager**
- **npm:** Default package manager (evidenced by `package-lock.json` presence)

---

## 🚀 Setup & Build

### **Installation**

```bash
# Clone repository
git clone https://github.com/farzad528/azure-ai-search-knowledge-retrieval-demo.git
cd azure-ai-search-knowledge-retrieval-demo

# Install dependencies
npm install
```

### **Environment Setup**

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Azure credentials
# REQUIRED: AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_API_KEY, NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY
# OPTIONAL: FOUNDRY_PROJECT_ENDPOINT, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
```

### **Available Commands**

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run dev` | Start development server (port 3000) | Local development |
| `npm run build` | Build production bundle | Pre-deployment, CI/CD |
| `npm start` | Start production server | Production deployment |
| `npm run vercel-dev` | Start Vercel dev server | Vercel local testing |
| `npm run vercel-deploy` | Deploy to Vercel production | Vercel deployment |

### **Development Workflow**

```bash
# 1. Start development server
npm run dev

# 2. Open browser
# http://localhost:3000

# 3. Make changes (hot reload enabled)

# 4. Build to verify no errors
npm run build

# 5. Commit changes
git add .
git commit -m "feat: add new feature"

# 6. Push to GitHub
git push origin feature-branch
```

### **Testing Commands**

**IMPORTANT:** This project currently has **NO formal test suite** (no Jest, Vitest, Playwright, or Cypress).

**Manual Testing Strategy:**
```bash
# Build project (serves as type-checking and compile-time validation)
npm run build

# If build succeeds, manually test:
# 1. Navigate to http://localhost:3000
# 2. Test direct KB queries on Search resource (/test) ⭐ PRIMARY TEST PLAYGROUND
# 3. Test Knowledge Bases management (/knowledge)
# 4. Test Foundry Agents playground (/agents)
# 5. Test agent creation and configuration
# 6. Verify API routes respond correctly
```

**HTTP Test Files:**
For API testing, the repository includes `.http` files for manual testing with REST clients:
- `agentsv2-test.http` - Test Agents v2 API endpoints
- `ka-demo.http`, `ka-foundry-test.http` - Knowledge Base API tests
- `foundry-knowledge-*.http` - Foundry IQ integration tests (legacy file prefix retained)

---

## 📐 Code Conventions

### **File Naming**
- **Components:** `kebab-case.tsx` (e.g., `knowledge-base-card.tsx`, `agent-avatar.tsx`)
- **Utilities:** `camelCase.ts` (e.g., `utils.ts`, `validations.ts`, `token-manager.ts`)
- **Types:** `kebab-case.ts` or `.d.ts` (e.g., `knowledge-source-status.ts`, `speech.d.ts`)
- **API Routes:** `route.ts` (Next.js App Router convention)
- **Pages:** `page.tsx` (Next.js App Router convention)

### **Variable Naming**
- **React Components:** `PascalCase` (e.g., `Button`, `KnowledgeBaseCard`, `AgentAvatar`)
- **Functions/Variables:** `camelCase` (e.g., `formatDate`, `cleanTextSnippet`, `slugify`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `ENDPOINT`, `API_KEY`, `API_VERSION`)
- **Types/Interfaces:** `PascalCase` (e.g., `ButtonProps`, `CreateKnowledgeBaseFormData`)
- **Zod Schemas:** `camelCase` + `Schema` suffix (e.g., `createKnowledgeBaseSchema`)

### **Code Style**

**TypeScript:**
```typescript
// ✅ Good: Named exports preferred
export function formatDate(date: Date | string): string { ... }
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// ✅ Good: Type inference when obvious
const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

// ✅ Good: Explicit types for function parameters and return values
export function cleanTextSnippet(text: string): string { ... }

// ✅ Good: Zod schema validation
export const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1, 'Knowledge base name is required'),
  // ...
})
```

**React Components:**
```tsx
// ✅ Good: Functional components with forwardRef when needed
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

// ✅ Good: Use class-variance-authority for variants
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", destructive: "..." },
      size: { sm: "...", lg: "..." },
    },
  }
)

// ✅ Good: Destructure props, use cn() for className merging
export function KnowledgeBaseCard({ name, description, className }: Props) {
  return <div className={cn("base-classes", className)}>...</div>
}
```

**API Routes:**
```typescript
// ✅ Good: Use Next.js 14 App Router conventions
export async function GET() {
  try {
    const response = await fetch(`${ENDPOINT}/path?api-version=${API_VERSION}`, {
      headers: { 'api-key': API_KEY! },
      cache: 'no-store'
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Message' }, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ✅ Good: Use NextResponse for responses
// ✅ Good: Handle errors gracefully with try/catch
```

**Import Order:**
```typescript
// 1. External libraries
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

// 2. Internal utilities (using @ alias)
import { cn } from "@/lib/utils"

// 3. Types
import type { ButtonProps } from "./types"

// 4. Styles (if any)
```

### **Comments & Documentation**
```typescript
// ✅ Good: JSDoc comments for exported functions
/**
 * Clean and format text for display by removing HTML markup,
 * normalizing whitespace, and handling common formatting issues
 */
export function cleanTextSnippet(text: string): string { ... }

// ✅ Good: Inline comments for complex logic
// Remove HTML entities (convert common ones, remove others)
.replace(/&nbsp;/g, ' ')
```

---

## 🧪 Testing

### **Current State**
- **Test Framework:** ❌ None installed
- **Test Files:** ❌ None exist
- **Coverage Target:** 80% (aspirational)

### **Testing Strategy (If Implementing Tests)**

**Recommended Stack:**
- **Unit Testing:** Vitest (fast, Vite-compatible)
- **Component Testing:** React Testing Library
- **E2E Testing:** Playwright (Azure-compatible)

**Installation (when ready):**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
npm install -D @playwright/test
```

**Test File Naming:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

**Test Commands (future):**
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

**Coverage Requirements:**
- Minimum: 80% code coverage for `/lib`, `/components`, `/app/api`
- Exclude: `*.config.js`, `next.config.js`, `tailwind.config.js`

---

## ✅ Pre-Commit Validation

**CRITICAL:** Before committing ANY code, agents MUST execute these steps in order:

### **1. Type Check (via Build)**
```bash
npm run build
```
**Expected:** Exit code 0, no TypeScript errors.
**If Failed:** STOP. Fix TypeScript errors before proceeding.

### **2. Format Check (Manual)**
**IMPORTANT:** No formatter (Prettier) is configured. Follow existing code style manually.

**Manual checks:**
- Indentation: 2 spaces (TSX/TS), verify alignment with existing files
- Single quotes for strings (unless JSX attributes)
- Semicolons at end of statements
- Trailing commas in multi-line objects/arrays

### **3. Lint Check (Manual)**
**IMPORTANT:** No linter (ESLint) is configured. Follow TypeScript compiler warnings.

**Manual checks:**
- No unused imports
- No unused variables
- No console.log() statements in production code (use for debugging only)
- Proper error handling (try/catch in async functions)

### **4. Manual Testing**
```bash
# Start dev server
npm run dev

# Test affected features manually:
# - Navigate to http://localhost:3000
# - Verify UI renders correctly
# - Test API endpoints with actual requests
# - Check browser console for errors
```

### **5. Git Commit**
```bash
# Only proceed if ALL above steps pass
git add <files>
git commit -m "type: description"
```

**IF ANY STEP FAILS:**
1. ❌ **STOP IMMEDIATELY**
2. Fix the errors
3. Re-run validation from step 1
4. **DO NOT** commit until all checks pass

---

## 📝 File Modification Rules

### **✅ ALLOWED TO MODIFY**

**Source Code:**
- `/app/**/*.{ts,tsx}` - Application code (pages, API routes)
- `/components/**/*.{ts,tsx}` - React components
- `/lib/**/*.ts` - Utility functions
- `/types/**/*.{ts,d.ts}` - Type definitions
- `/public/**/*` - Static assets

**Configuration (with caution):**
- `package.json` - Dependencies (document reason in PR)
- `.env.example` - Environment variable template
- `AGENTS.md` - This file

**Scripts:**
- `/scripts/**/*` - Build/deployment scripts

### **❌ FORBIDDEN TO MODIFY**

**Build Output:**
- `/.next/**` - Generated by Next.js build
- `/node_modules/**` - Generated by npm install
- `*.tsbuildinfo` - TypeScript build cache
- `next-env.d.ts` - Generated by Next.js

**Infrastructure:**
- `/infra/**` - Managed by Azure deployment team
- `/.git/**` - Git internals

**Documentation (without approval):**
- `/docs/**` - Managed by documentation team
- `README.md` - Requires review before changes

**Environment Files (never commit):**
- `.env.local`
- `.env`
- `.env.production`
- Any file containing secrets or API keys

**IDE/System:**
- `.vscode/`
- `.idea/`
- `.DS_Store`
- `Thumbs.db`

### **⚠️ MODIFY WITH EXTREME CAUTION**

**Critical Configuration:**
- `tsconfig.json` - Breaking changes affect entire project
- `next.config.js` - Can break build/deployment
- `tailwind.config.js` - Affects all styling
- `.gitignore` - Can accidentally commit secrets

**Rule:** Discuss with team lead before modifying these files.

---

## 🔀 PR Format

### **Branch Naming Convention**
```
agent/<type>/<short-description>

Examples:
agent/feat/add-dark-mode-toggle
agent/fix/knowledge-base-loading-error
agent/refactor/simplify-api-routes
agent/docs/update-setup-instructions
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring (no behavior change)
- `perf` - Performance improvement
- `docs` - Documentation update
- `test` - Add/update tests
- `chore` - Maintenance (deps, config)

### **PR Title Format**
```
[agent] <type>: <description>

Examples:
[agent] feat: add dark mode toggle to settings
[agent] fix: resolve knowledge base loading error on page refresh
[agent] refactor: simplify API route error handling
```

### **PR Description Template**

```markdown
## Summary
<!-- 1-2 sentences describing what this PR does -->

## Changes
<!-- Bullet list of changes -->
- Added dark mode toggle component
- Updated theme context to persist user preference
- Modified layout to respect dark mode setting

## Testing
<!-- How was this tested? -->
- [ ] `npm run build` passes with no errors
- [ ] Manually tested on Chrome, Firefox, Safari
- [ ] Verified dark mode persists on page refresh
- [ ] Verified all pages respect dark mode setting

## Screenshots (if UI changes)
<!-- Add screenshots here -->

## Related Issues
<!-- Link to related issues -->
Closes #123

## Pre-Commit Checklist
- [ ] Type check passed (`npm run build`)
- [ ] Code follows existing style conventions
- [ ] No console.log() in production code
- [ ] Manual testing completed
- [ ] No sensitive data (keys, tokens) committed
- [ ] Updated documentation if needed
```

### **PR Merge Requirements**
1. All checkboxes in "Pre-Commit Checklist" checked
2. Build passes (`npm run build`)
3. Manual testing documented
4. Approved by at least one human reviewer
5. No merge conflicts with `main`

---

## 🤖 Agent Behavior

### **MUST DO**

1. **READ FIRST:**
   - ALWAYS read this `AGENTS.md` file before making changes
   - Review existing code in the affected area to match style
   - Check recent commits for context: `git log --oneline -10`

2. **VALIDATE EVERYTHING:**
   - Run `npm run build` after EVERY code change
   - Manually test affected features (no automated tests exist)
   - Verify TypeScript types are correct (no `any` types unless necessary)

3. **FOLLOW CONVENTIONS:**
   - Use existing file naming patterns (kebab-case for components)
   - Match indentation/spacing of surrounding code (2 spaces)
   - Import from `@/` alias for internal modules
   - Use `cn()` utility for className merging

4. **COMMUNICATE CLEARLY:**
   - Write descriptive commit messages: `type: description`
   - Document complex logic with comments
   - Update `AGENTS.md` if adding new conventions
   - Ask for clarification if requirements are ambiguous

5. **HANDLE ERRORS:**
   - Wrap async operations in try/catch
   - Return proper HTTP status codes in API routes
   - Show user-friendly error messages in UI
   - Log errors to console in development only

6. **RESPECT BOUNDARIES:**
   - NEVER modify `/infra`, `/.next`, `/node_modules`, `/docs`
   - NEVER commit `.env.local` or files with secrets
   - NEVER force-push to `main` branch
   - NEVER skip pre-commit validation steps

### **MUST NOT DO**

1. **❌ DO NOT bypass validation:**
   - Skip `npm run build` before committing
   - Commit code with TypeScript errors
   - Ignore build warnings without investigation
   - Deploy without manual testing

2. **❌ DO NOT introduce breaking changes without approval:**
   - Modify `tsconfig.json`, `next.config.js`, `tailwind.config.js`
   - Change API response formats without versioning
   - Rename exported functions/components used elsewhere
   - Remove environment variables referenced in docs

3. **❌ DO NOT compromise security:**
   - Commit API keys, bearer tokens, or secrets
   - Disable CORS without reason
   - Remove input validation from API routes
   - Expose sensitive data in client-side code

4. **❌ DO NOT degrade user experience:**
   - Remove loading states or error boundaries
   - Introduce console errors visible to users
   - Break mobile responsiveness
   - Remove accessibility features (ARIA labels, keyboard nav)

5. **❌ DO NOT ignore existing patterns:**
   - Create components without following CVA variant pattern
   - Use inline styles instead of TailwindCSS classes
   - Add new dependencies without justification
   - Create new folder structures not documented here

6. **❌ DO NOT assume:**
   - Tests exist (they don't - manual testing required)
   - Linters will catch issues (none configured)
   - CI/CD will validate (may not be configured)
   - Other agents read your commit messages (write for humans)

### **Decision-Making Hierarchy**

When in doubt, follow this order:

1. **This `AGENTS.md` file** - Source of truth for agent behavior
2. **Existing code patterns** - Match what's already there
3. **Next.js 14 docs** - Framework best practices
4. **TypeScript best practices** - Type safety when reasonable
5. **Human judgment** - Ask for clarification if unclear

---

## 🚨 Emergency Procedures

### **If Build Fails After Your Changes**

```bash
# 1. Identify the error
npm run build 2>&1 | tee build-error.log

# 2. Revert your changes
git diff HEAD > my-changes.patch  # Save work
git reset --hard HEAD~1           # Undo last commit

# 3. Verify build works
npm run build

# 4. Re-apply changes incrementally
git apply my-changes.patch
# OR manually re-apply small portions

# 5. Test after each change
npm run build
```

### **If You Committed Secrets**

```bash
# 1. IMMEDIATELY revoke the exposed credential in Azure Portal

# 2. Remove from Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret-file" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (only if necessary)
git push origin --force --all

# 4. Rotate all secrets in .env.local
```

### **If Deployment Fails**

```bash
# 1. Check Vercel/Azure logs
# Vercel: https://vercel.com/[team]/[project]/deployments
# Azure: az webapp log tail --name [app-name] --resource-group [rg]

# 2. Verify environment variables match .env.example
# 3. Test build locally
npm run build && npm start

# 4. Rollback if needed
# Vercel: Rollback via dashboard
# Azure: az webapp deployment list --name [app] --resource-group [rg]
```

---

## 📚 Additional Resources

**Project Documentation:**
- `README.md` - Setup guide, deployment instructions, API reference
- `.env.example` - Required environment variables
- `infra/` - Azure infrastructure templates

**External Documentation:**
- [Next.js 14 Docs](https://nextjs.org/docs)
- [React 18 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Azure AI Search Docs](https://learn.microsoft.com/azure/search/)
- [Azure AI Foundry Docs](https://learn.microsoft.com/azure/ai-services/agents/)

**Getting Help:**
- GitHub Issues: https://github.com/farzad528/azure-ai-search-knowledge-retrieval-demo/issues
- GitHub Discussions: https://github.com/farzad528/azure-ai-search-knowledge-retrieval-demo/discussions

---

## 🎯 Key Features & Routes

### **1. Test Playground (`/test`) ⭐ PRIMARY FEATURE**
Direct Knowledge Base queries against Azure AI Search resource without Foundry integration.

**Purpose:** Test and query knowledge bases directly on the Search resource for rapid experimentation and debugging.

**Key Capabilities:**
- Industry-specific knowledge base selection
- Direct Azure AI Search queries (no Foundry layer)
- Real-time query testing with configurable parameters
- Citation and source document viewing

**Use when:** You need to test knowledge bases directly, debug retrieval issues, or demonstrate pure Azure AI Search capabilities.

### **2. Knowledge Management (`/knowledge`)**
Manage knowledge bases from your Azure AI Search resource.

**Key Capabilities:**
- View all knowledge bases
- Create new knowledge bases with diverse sources:
  - Azure Blob Storage
  - Azure AI Search Index
  - Web URLs
  - SharePoint (indexed and remote)
  - OneLake
- Update and configure knowledge base settings
- Admin mode for advanced operations

**Use when:** You need to manage knowledge bases and configure data sources.

### **3. Playground (`/playground`)**
Interactive playground for querying knowledge bases with full control over runtime settings.

**Key Capabilities:**
- Advanced RAG experimentation
- Configurable retrieval parameters (reasoning effort, output mode)
- Source-specific parameter tuning
- Reranker threshold adjustments
- Real-time query refinement

**Use when:** You want advanced RAG experimentation, testing different retrieval strategies, or adjusting query behavior.

### **4. Foundry Agents (`/agents`)**
Azure AI Foundry Agent Service integration (production-ready managed service).

**Key Capabilities:**
- Multi-turn conversations with context retention
- Built-in orchestration for diverse knowledge sources
- Managed agent lifecycle
- Production-ready scalability

**Use when:** You need a production-ready managed agent service with enterprise-grade orchestration.

### **5. Agents v2 API (`/api/agentsv2`) 🚧 PLACEHOLDER**
**Status:** Placeholder for future Foundry Agents v2 integration with Knowledge Bases.

**Endpoints:**
- `/api/agentsv2/responses` - Single-call response API
- `/api/agentsv2/connections` - Remote Tool connections management
- `/api/agentsv2/knowledge-bases` - Knowledge Bases management for Agents v2

**Note:** This is a **placeholder structure** for future integration. Not currently active in production.

---

## 📦 Deployment Options

This application supports three deployment targets:

### **1. Vercel (Primary) ✅ RECOMMENDED**
- **Guide:** `VERCEL_DEPLOYMENT.md`, `QUICK_START_VERCEL.md`
- **Features:** Automatic deployments, edge functions, global CDN
- **Authentication:** Service Principal with automatic bearer token refresh
- **Best for:** Quick deployments, global distribution, serverless scaling

### **2. Azure Static Web Apps**
- **Guide:** `AZURE_DEPLOYMENT_GUIDE.md`
- **Script:** `deploy-to-azure.ps1` (PowerShell)
- **Features:** Managed Identity, automatic token refresh, free SSL/HTTPS
- **Best for:** Azure-native deployments, Managed Identity authentication

### **3. Azure App Service**
- **Guide:** Documented in `README.md`
- **Features:** Full control, VM-based hosting, custom domains
- **Best for:** Enterprise deployments requiring specific configurations

**Deployment Helper Scripts:**
- `deploy-to-azure.ps1` - Automated Azure Static Web Apps deployment
- `configure-env-vars.ps1` - Environment variable configuration helper

---

## ✍️ Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-03 | 1.1.0 | Updated for agentsv2 placeholder, deployment guides, /test playground emphasis |
| 2025-10-24 | 1.0.0 | Initial AGENTS.md creation |

---

**END OF DOCUMENT**

*This file is the authoritative source for AI agent behavior in this repository. When this file conflicts with other documentation, this file takes precedence for agent-related decisions.*
