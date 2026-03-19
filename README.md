# Meeting Scheduler (Programador de Reuniones)

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

🇪🇸 [Leer en español](./README.es.md)

> A web application for scheduling and managing congregation meeting assignments with fair, algorithm-driven rotation.

---

## Overview

**Meeting Scheduler** is a web application that replaces manual spreadsheets used to schedule weekly assignments for congregation meetings. It handles midweek meetings (Christian Life and Ministry), weekend meetings, and attendant/microphone rotation — all in one place.

The core of the system is a **pure assignment engine** that uses an LRU (Least Recently Used) rotation algorithm to ensure fair distribution of assignments across all eligible publishers. The engine respects eligibility requirements, role-based constraints, and gender rules — producing conflict-free assignment proposals without any side effects.

Whether you manage a small congregation or a large one, Meeting Scheduler gives you automatic assignment with full manual override capability, printable forms (S-140, S-89), assignment history tracking, and CSV import/export for easy migration from existing tools.

## Screenshots

> _Coming soon — screenshots of the dashboard, assignment view, print views, and mobile layout._

## Features

### Publisher Management

- Full CRUD operations for publishers
- Roles: Elder, Ministerial Servant, Baptized Publisher, Unbaptized Publisher
- Gender-based eligibility filtering
- Status management: Active, Absent, Restricted, Inactive
- Eligibility flags: VMC-enabled, Prayer, Reading, Attendant, Microphone
- Temporary absence with end date
- Skip-assignment flag for temporary exclusion
- Free-form notes per publisher
- Soft delete (logical deletion)

### Midweek Meeting (VMC)

- 5 sections: Opening, Treasures from God's Word, Apply Yourself to the Field Ministry, Living as Christians, Closing
- Fixed parts auto-generated (Chairman, Prayers, Treasures Talk, Spiritual Gems, Bible Reading, School Overseer, CBS Conductor & Reader)
- Dynamic parts added manually (Ministry School demonstrations, Christian Life talks)
- Auxiliary classroom support (duplicated reading and demonstrations)
- Week states: Draft, Assigned, Published

### Weekend Meeting

- Chairman, Watchtower conductor, Watchtower reader
- Public talk speaker
- Opening and closing prayers

### Automatic Assignment

- Pure assignment engine (zero side effects, no database access)
- LRU rotation algorithm for fair distribution
- Two modes: Full (regenerate all) and Partial (fill gaps only)
- Priority ordering: most restrictive parts assigned first
- Two-pass system: main assignees first, then helpers
- Deterministic mode with seed for testing

### Manual Override

- Candidate classification: Eligible, Warning, Blocked
- Hard constraints prevent selection (wrong gender, wrong role)
- Soft constraints show warnings but allow selection (already assigned, has notes)
- Candidates sorted by rotation (least recently assigned first)

### Attendant & Microphone Rotation

- 4 roles: Doorman, Attendant, Mic 1, Mic 2
- Separate engine with independent rotation
- Soft constraint: avoids assigning someone who already has a VMC part that week

### History & Metrics

- Full assignment history per publisher
- Workload distribution metrics
- Filters by date, publisher, and part type
- Denormalized records survive week deletion

### Print Views

- **S-140** — Midweek meeting program (single week)
- **S-89** — Individual assignment slip per publisher
- **Weekend program** — Weekend meeting schedule
- **Attendant report** — Attendant and microphone assignments
- **Multi-week S-140** — Range of weeks in a single printable view

### Data Management

- CSV import for Publishers, Assignment History, and Meeting Weeks
- Template download, validation, and preview before import
- Database backup with WAL checkpoint
- Database restore with schema validation
- Full database clear

### Other

- Dark / Light theme
- Responsive mobile design (375px+)
- Internationalization (Spanish + English)
- Password-only JWT authentication

## Tech Stack

| Technology                                    | Version | Purpose                                   |
| --------------------------------------------- | ------- | ----------------------------------------- |
| [Next.js](https://nextjs.org/)                | 16.2.0  | Framework (App Router, Server Components) |
| [React](https://react.dev/)                   | 19      | UI library                                |
| [TypeScript](https://www.typescriptlang.org/) | 5       | Language                                  |
| [Prisma](https://www.prisma.io/)              | 7.5     | ORM with LibSQL adapter                   |
| [LibSQL / SQLite](https://turso.tech/libsql)  | —       | Database                                  |
| [next-intl](https://next-intl.dev/)           | 4.8     | Internationalization (es/en)              |
| [Base UI](https://base-ui.com/)               | 1.3     | Component primitives                      |
| [Tailwind CSS](https://tailwindcss.com/)      | 4.2     | Utility-first CSS                         |
| [Zod](https://zod.dev/)                       | 4.3     | Schema validation                         |
| [jose](https://github.com/panva/jose)         | 6.2     | JWT authentication                        |
| [Vitest](https://vitest.dev/)                 | 4.1     | Testing framework                         |

## Getting Started

### Prerequisites

- Node.js 22+
- npm, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/programador-de-reuniones.git
cd programador-de-reuniones

# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

| Variable              | Description                                      | Example                                  |
| --------------------- | ------------------------------------------------ | ---------------------------------------- |
| `DATABASE_URL`        | SQLite connection string                         | `file:./prisma/dev.db`                   |
| `JWT_SECRET`          | Secret key for JWT signing (HS256, min 32 chars) | `your-secret-key-here-min-32-characters` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password                | `$2a$10$...`                             |

> **Note:** Never commit real secrets. Use `.env.example` as a template with placeholder values.

### Database Setup

```bash
# Push the Prisma schema to the database
pnpm db:push

# (Optional) Seed the database with sample data
pnpm db:seed

# (Optional) Open Prisma Studio to inspect the database
pnpm db:studio
```

### Development

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── [locale]/
│   │   ├── (protected)/        # Auth-required routes (sidebar layout)
│   │   │   ├── publishers/     # Publisher CRUD + workload
│   │   │   ├── weeks/          # Week management + assignments
│   │   │   ├── history/        # Assignment history + metrics
│   │   │   ├── attendants/     # Attendant overview
│   │   │   └── settings/       # CSV import + backup
│   │   ├── (print)/            # Print routes (minimal layout)
│   │   └── login/              # Authentication
│   └── api/                    # REST endpoints
├── components/
│   ├── layout/                 # Sidebar, Header
│   ├── publishers/             # Publisher components
│   ├── weeks/                  # Week & assignment components
│   ├── history/                # History & metrics
│   ├── settings/               # Import & backup panels
│   ├── print/                  # Print-optimized components
│   └── ui/                     # 21 base UI components
├── data/                       # Data access layer (Prisma queries)
├── lib/
│   ├── assignment-engine/      # Pure VMC assignment engine (tested)
│   │   ├── index.ts            # generateAssignments() entry point
│   │   ├── eligibility.ts      # Eligibility matrix
│   │   ├── constraints.ts      # Hard constraints (per meeting)
│   │   ├── selector.ts         # LRU selector with random tiebreak
│   │   ├── order.ts            # Assignment priority ordering
│   │   ├── manual-constraints.ts  # Manual override classification
│   │   └── types.ts            # Engine types
│   ├── attendant-engine.ts     # Attendant rotation engine
│   ├── weekend-engine.ts       # Weekend assignment engine
│   ├── schemas/                # Zod validation schemas
│   └── auth.ts                 # JWT + bcrypt utilities
├── i18n/                       # Internationalization config
└── hooks/                      # React hooks
messages/
├── es/                         # Spanish translations
└── en/                         # English translations
prisma/
├── schema.prisma               # Data model
└── seed.ts                     # Seed script
```

## Architecture

### Server Components vs Client Components

The application uses Next.js App Router with React Server Components by default. Client components are used only where interactivity is required (forms, modals, dropdowns). Data fetching happens at the server component level, and client components receive data as props.

### Server Actions

All data mutations (create, update, delete) are handled through Next.js Server Actions. This eliminates the need for most API routes and provides type-safe, co-located server-side logic with automatic revalidation.

### Assignment Engine

The assignment engine is the core of the application. It consists of **3 pure engines** — each with zero side effects, no database access, and full test coverage:

#### VMC Engine (`lib/assignment-engine/`)

Handles midweek meeting assignments. The flow:

```
UI click "Assign"
  → Load meeting parts (DB)
  → Load eligible publishers (DB)
  → Load rotation map per publisher (DB: history)
  → Load existing assignments (DB, partial mode only)
  → generateAssignments(...) [PURE FUNCTION]
  → Save results to database (DB)
```

**LRU Rotation Algorithm:**

1. For each candidate that passes eligibility + constraints, look up their last assignment date for that **part type** (`eligibilityKey`) in the rotation map
2. If never assigned for that part type, use epoch 0 (maximum priority)
3. Sort ascending by date (oldest first = highest priority)
4. Break ties randomly (deterministic with seed for tests, using mulberry32 PRNG)

**Eligibility Matrix:**

The engine uses an eligibility matrix that maps part keys to filter functions. Every publisher must first pass three prerequisites: VMC-enabled, Active status, and skip-assignment disabled. Then part-specific rules apply:

| Part                           | Requirement                                      |
| ------------------------------ | ------------------------------------------------ |
| Chairman                       | Male Elder                                       |
| School Overseer                | Male Elder                                       |
| Treasures Talk                 | Elder or Ministerial Servant                     |
| Spiritual Gems                 | Elder or Ministerial Servant                     |
| CBS Conductor                  | Elder or Ministerial Servant                     |
| Prayers                        | Prayer-enabled flag                              |
| CBS Reader                     | Reading-enabled flag                             |
| Bible Reading                  | Male (any role)                                  |
| Ministry School demos (main)   | Any eligible publisher                           |
| Ministry School demos (helper) | Same gender as main, any eligible publisher      |
| Ministry School talks          | Male                                             |
| Christian Life talks           | Baptized male (Elder, MS, or Baptized Publisher) |

**Hard Constraints (per meeting):**

1. Max 1 assignment per person per meeting
2. Exclusive roles — Chairman/School Overseer cannot have other parts
3. No room conflicts — cannot have same logical part in main + auxiliary room
4. Cannot be main assignee and helper simultaneously

**Priority Ordering:**

Parts are assigned most-restrictive first to avoid consuming scarce candidates:

| Priority | Part                                         |
| -------- | -------------------------------------------- |
| 0        | Chairman                                     |
| 1        | School Overseer (main + auxiliary)           |
| 2        | Opening Prayer                               |
| 3        | Treasures Talk, Spiritual Gems               |
| 4        | Christian Life talks (dynamic)               |
| 5        | CBS Conductor                                |
| 6        | CBS Reader                                   |
| 7        | Bible Reading (main + auxiliary)             |
| 8–9      | Ministry School demos (main, then auxiliary) |
| 12       | Closing Prayer                               |

**Two-Pass System:**

1. First pass — assign main assignees for all parts in priority order
2. Second pass — for parts requiring a helper, find a helper who passes prerequisites, is the same gender as the main (for demos), and is not already assigned

**Modes:** Full (regenerate everything) or Partial (fill gaps, preserving existing assignments).

#### Weekend Engine (`lib/weekend-engine.ts`)

Handles weekend meeting roles: chairman, Watchtower conductor, reader, and prayers. Uses the same LRU rotation approach with role-specific eligibility.

#### Attendant Engine (`lib/attendant-engine.ts`)

Handles 4 roles: Doorman, Attendant, Mic 1, Mic 2. Each role has its own enablement flag and independent LRU rotation. Applies a soft constraint to avoid assigning someone who already has a VMC part that week.

### Data Model

The application uses 7 Prisma models:

| Model                   | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| **Publisher**           | Members with roles, gender, status, and eligibility flags             |
| **MeetingWeek**         | Weekly meeting container (dates, songs, weekly reading)               |
| **MeetingPart**         | Individual meeting sections (type, section, duration, room)           |
| **Assignment**          | Links a publisher (+ optional helper) to a meeting part               |
| **AssignmentHistory**   | Denormalized historical record (survives week deletion)               |
| **WeekendMeeting**      | Weekend meeting roles (chairman, conductor, reader, prayers, speaker) |
| **AttendantAssignment** | Attendant and microphone roles per meeting date                       |

The full schema is in `prisma/schema.prisma`.

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `pnpm dev`          | Start development server (Turbopack) |
| `pnpm build`        | Production build                     |
| `pnpm start`        | Start production server              |
| `pnpm lint`         | Run ESLint                           |
| `pnpm format`       | Format code with Prettier            |
| `pnpm format:check` | Check code formatting                |
| `pnpm db:push`      | Push Prisma schema to database       |
| `pnpm db:seed`      | Seed database with sample data       |
| `pnpm db:studio`    | Open Prisma Studio                   |
| `pnpm test`         | Run tests once                       |
| `pnpm test:watch`   | Run tests in watch mode              |

## Print Views

The application generates printable forms optimized for A4 paper:

| View           | Route                               | Description                              |
| -------------- | ----------------------------------- | ---------------------------------------- |
| **S-140**      | `/weeks/[id]/print/s140`            | Midweek meeting program (official form)  |
| **S-89**       | `/weeks/[id]/print/s89`             | Individual assignment slip per publisher |
| **Weekend**    | `/weeks/[id]/print/weekend`         | Weekend meeting program                  |
| **Attendant**  | `/weeks/[id]/print/attendants`      | Attendant and microphone report          |
| **Multi-week** | `/weeks/print/s140?from=...&to=...` | S-140 for a range of weeks               |

Print routes use a minimal layout (no sidebar, no navigation) designed specifically for printing.

## Internationalization

The application supports **Spanish** (default) and **English** using [next-intl](https://next-intl.dev/).

- Translation files are in `messages/es/` and `messages/en/`, organized by module: `common`, `nav`, `publishers`, `meetings`, `history`, `attendants`, `settings`, `auth`, `dashboard`
- Locale is determined by the URL prefix: `/es/...` or `/en/...`
- The middleware handles locale detection and redirects

**To add a new locale:**

1. Create a new directory under `messages/` (e.g., `messages/pt/`)
2. Copy all JSON files from `messages/en/` and translate them
3. Add the locale to the supported locales list in `src/i18n/`
4. The routing and middleware will pick it up automatically

## CSV Import

The application supports 3 CSV import modules for migrating data from external tools:

| Module         | What it imports                                                     |
| -------------- | ------------------------------------------------------------------- |
| **Publishers** | Publisher records with roles, gender, eligibility flags, and status |
| **History**    | Assignment history records (denormalized)                           |
| **Weeks**      | Meeting weeks with parts and assignments                            |

**Import flow:**

1. Download the CSV template for the module
2. Fill in your data following the template format
3. Upload the file — the system validates all rows against Zod schemas
4. Preview the parsed data and review any validation errors
5. Confirm to import — records are created in the database

## Backup & Restore

| Action      | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| **Backup**  | Downloads a full database snapshot (SQLite file with WAL checkpoint)           |
| **Restore** | Uploads a backup file, validates the schema, and replaces the current database |
| **Clear**   | Wipes all data from the database (irreversible — backup first!)                |

Backup and restore are available in **Settings** and operate on the full SQLite database file.

## Testing

The assignment engines have comprehensive unit tests covering:

- Eligibility — every part type with every role/gender combination
- Constraints — one part per meeting, exclusive roles, room conflicts
- LRU Selector — rotation, tiebreak, deterministic seed
- Priority ordering
- Manual constraints — candidate classification (eligible/warning/blocked)
- Full engine integration — complete flow, partial mode

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## License

MIT License — Copyright (c) 2026 Cesar Ortiz

See [LICENSE](./LICENSE) for details.
