// Initial seed documents for Volvitech Enterprise Knowledge Base

export const seedDocs = [
  {
    id: 'doc-1',
    title: 'Engineering Onboarding & Git Workflow Guidelines',
    category: 'Engineering',
    summary: 'Standard branch naming conventions, pull request review SLAs, and deployment protocols for Volvitech developers.',
    content: `# Engineering Onboarding & Git Workflow Guidelines

Welcome to the Volvitech Engineering team! This document outlines our standard development practices, branching strategies, and pull request workflows.

## 1. Branch Naming Standards
Every feature or bugfix should branch off \`main\` using the following conventions:
- \`feature/feature-name\` (e.g. \`feature/docs-page\`)
- \`fix/issue-description\` (e.g. \`fix/auth-token-refresh\`)
- \`chore/task-name\` (e.g. \`chore/update-dependencies\`)

## 2. Commit Message Guidelines
Follow the Conventional Commits specification:
\`\`\`bash
feat: add searchable docs repository to navbar
fix: resolve modal scrolling overlay issue on mobile
chore: upgrade vite plugins to latest version
docs: update onboarding setup instructions
\`\`\`

## 3. Pull Request & Code Review Process
- **Self-Review:** Always do a pass over your own diff before assigning reviewers.
- **Reviewers:** Tag at least one senior engineer and one domain peer.
- **SLA:** Team members aim to review PRs within **24 business hours**.
- **CI Checks:** All automated linting and unit test suites must pass before merging.

## 4. Local Environment Quickstart
\`\`\`bash
# 1. Clone the repository
git clone https://github.com/volvitech/tracker.git
cd tracker

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
\`\`\`

## 5. Deployment & Releases
Production deployments are triggered automatically upon merging into the \`main\` branch. Staging previews are generated for every active PR.`,
    tags: ['git', 'engineering', 'onboarding', 'best-practices'],
    externalUrl: '',
    authorId: '3',
    authorName: 'Liam Chen',
    authorAvatar: 'https://i.pravatar.cc/150?u=liam',
    authorRole: 'Engineer',
    isPinned: true,
    createdAt: '2026-08-10T09:30:00.000Z',
    updatedAt: '2026-09-01T14:15:00.000Z'
  },
  {
    id: 'doc-2',
    title: 'Volvitech Employee Policy & Leave Guidelines 2026',
    category: 'HR & Policies',
    summary: 'Comprehensive policy covering paid time off, sick leave, core working hours, and remote work stipends.',
    content: `# Volvitech Employee Policy & Leave Guidelines 2026

This handbook sets forth the core employee policies, leave entitlements, and workplace principles at Volvitech.

## 1. Working Hours & Flexibility
- **Core Hours:** 10:00 AM – 4:00 PM local time for team syncs, meetings, and cross-functional collaborations.
- **Flexible Hours:** Total of 40 hours per week. Team members have autonomy over their daily schedules around core hours.

## 2. Leave Entitlements
| Leave Type | Annual Allowance | Carryover Policy |
| :--- | :--- | :--- |
| **Paid Time Off (PTO)** | 20 Days | Up to 5 days carry forward into next calendar year |
| **Sick & Wellness Leave** | 10 Days | Does not carry forward |
| **Parental Leave** | 16 Weeks | Applicable for primary caregivers |
| **Bereavement Leave** | 5 Days | Fully paid |

## 3. Remote Work & Home Office Stipend
- Each full-time team member receives a **$600 annual ergonomic stipend** for monitors, desks, and peripheral upgrades.
- Internet connectivity allowance is subsidized up to **$50 per month**.

## 4. Applying for Leaves
Please submit leave requests through the internal portal at least **10 business days in advance** for planned vacations lasting more than 3 consecutive days.`,
    tags: ['hr', 'leave-policy', 'benefits', 'workplace'],
    externalUrl: '',
    authorId: '1',
    authorName: 'Swastik Kumar',
    authorAvatar: 'https://i.pravatar.cc/150?u=swastik',
    authorRole: 'Admin',
    isPinned: true,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-08-15T11:20:00.000Z'
  },
  {
    id: 'doc-3',
    title: 'Product Design System & Brand Asset Standards',
    category: 'Design',
    summary: 'Design tokens, color palettes, typography standards, and Figma component usage guidelines.',
    content: `# Product Design System & Brand Asset Standards

Our design system ensures visual harmony and intuitive user experiences across all Volvitech enterprise apps.

## 1. Typography Hierarchy
We use **Plus Jakarta Sans** for body typography and **JetBrains Mono** for code references:
- **Headings (H1):** 28px–32px, Bold 700 / ExtraBold 800
- **Section Titles (H2):** 20px–24px, Bold 700
- **Card Headers (H3):** 16px–18px, SemiBold 600
- **Body Regular:** 14px, Font Weight 400
- **Captions & Badges:** 11px–12px, Medium 500 / Bold 700

## 2. Core Color Tokens
- **Primary Brand Blue:** \`#2563EB\` (Blue 600) — Used for primary call-to-actions, focused outlines, and active state highlights.
- **Success Emerald:** \`#10B981\` (Emerald 500) — Used for completed tasks and active systems.
- **Warning Amber:** \`#F59E0B\` (Amber 500) — Used for in-progress statuses.
- **Neutral Background:** \`#FBFBFC\` (Soft Gray) and \`#FFFFFF\` (Pure White Card Canvas).

## 3. Spacing & Border Radius
- Standard Card Radius: \`rounded-xl\` (12px) and \`rounded-2xl\` (16px)
- Standard Buttons: \`rounded-lg\` (8px) with subtle hover scale \`active:scale-[0.98]\`
- Shadow system: Soft ambient shadows (\`shadow-sm\` / \`shadow-xs\`) to maintain clean minimalism.

## 4. Figma UI Kit & Assets
Access our master UI library on Figma: [https://figma.com/@volvitech/design-system](https://figma.com/@volvitech/design-system)`,
    tags: ['design', 'tokens', 'brand', 'figma', 'ui'],
    externalUrl: 'https://figma.com/@volvitech/design-system',
    authorId: '2',
    authorName: 'Amara Patel',
    authorAvatar: 'https://i.pravatar.cc/150?u=amara',
    authorRole: 'Designer',
    isPinned: false,
    createdAt: '2026-07-20T14:00:00.000Z',
    updatedAt: '2026-08-28T16:40:00.000Z'
  },
  {
    id: 'doc-4',
    title: 'API Reference & Neon Cloud Architecture',
    category: 'Engineering',
    summary: 'Documentation on the Neon PostgreSQL cloud database schema, API routes, and direct client queries.',
    content: `# API Reference & Neon Cloud Architecture

Volvitech Tracker utilizes a hybrid serverless architecture with Neon PostgreSQL for real-time cloud data synchronization.

## 1. Architecture Overview
- **Production Environment:** Serverless Node / Express middleware with serverless connection pooling via \`@neondatabase/serverless\`.
- **Local Dev Mode:** Zero-latency browser local storage with option to opt into live DB via \`VITE_ENABLE_LOCAL_DB=true\`.
- **Static Fallback:** Direct browser HTTPS driver via \`src/services/neonDirect.js\` for resilient cloud access.

## 2. Key API Endpoints
\`\`\`http
GET    /api/data            # Fetch complete workspace bootstrap payload
POST   /api/projects        # Create a new project and associated tasks
PUT    /api/projects/:id    # Update existing project attributes
DELETE /api/projects/:id    # Remove project
POST   /api/docs            # Create a new knowledge doc
PUT    /api/docs/:id        # Update knowledge doc
DELETE /api/docs/:id        # Delete knowledge doc
\`\`\`

## 3. Database Schema Overview
The PostgreSQL database consists of 5 core relational tables:
1. \`employees\` — Team credentials, roles, and profiles.
2. \`projects\` — High-level initiatives and completion milestones.
3. \`tasks\` — Project subtasks, assignees, and deadlines.
4. \`meetings\` — Calendar events, attendees, and meeting links.
5. \`docs\` — Enterprise documentation, categories, tags, and rich content.`,
    tags: ['api', 'database', 'neon', 'backend', 'architecture'],
    externalUrl: '',
    authorId: '3',
    authorName: 'Liam Chen',
    authorAvatar: 'https://i.pravatar.cc/150?u=liam',
    authorRole: 'Engineer',
    isPinned: false,
    createdAt: '2026-08-05T12:00:00.000Z',
    updatedAt: '2026-09-10T10:30:00.000Z'
  },
  {
    id: 'doc-5',
    title: 'Standard Operating Procedures: Sprint Planning & Retrospectives',
    category: 'Operations & SOP',
    summary: 'Step-by-step workflow for running bi-weekly agile sprint kickoffs, mid-sprint check-ins, and team retrospectives.',
    content: `# Standard Operating Procedures: Sprint Planning & Retrospectives

This SOP outlines our bi-weekly agile rhythm to maintain momentum and team alignment.

## 1. Sprint Cadence
- **Cycle Duration:** 2 Weeks (Starts Monday 10:00 AM, finishes alternate Friday 5:00 PM).
- **Sprint Planning Meeting:** Every alternate Monday at 10:30 AM (60 minutes).
- **Daily Async Standup:** Posted in Slack \`#daily-standup\` before 10:30 AM daily.
- **Sprint Demo & Retro:** Every alternate Friday at 4:00 PM (45 minutes).

## 2. Sprint Planning Checklist
1. Review the Product Backlog and prioritize top customer items.
2. Ensure every task has acceptance criteria, estimated priority (High, Medium, Low), and an assigned owner.
3. Check team capacity accounting for planned PTO and holidays.
4. Commit to sprint deliverables in Volvitech Planner.

## 3. Retrospective Format
We utilize the **Start / Stop / Continue** framework:
- **What went well?** (Celebrate wins and successful shipping).
- **What slowed us down?** (Identify blockers or tech debt).
- **Action items:** Assign 1-2 concrete process improvements for the next sprint.`,
    tags: ['sop', 'agile', 'sprint', 'operations', 'retrospective'],
    externalUrl: '',
    authorId: '4',
    authorName: 'Noor Hassan',
    authorAvatar: 'https://i.pravatar.cc/150?u=noor',
    authorRole: 'Engineer',
    isPinned: false,
    createdAt: '2026-08-18T15:00:00.000Z',
    updatedAt: '2026-09-05T09:20:00.000Z'
  }
];
