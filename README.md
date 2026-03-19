# Meeting Scheduler (Programador de Reuniones)

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> A web application for scheduling and managing congregation meeting assignments with fair, algorithm-driven rotation.

🇪🇸 [Leer en español](#-español)

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

---

## 🇪🇸 Español

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](./LICENSE)

> Aplicación web para programar y gestionar las asignaciones de las reuniones de congregación con rotación justa basada en algoritmo.

🇬🇧 [Read in English](#meeting-scheduler-programador-de-reuniones)

---

### Descripción general

**Programador de Reuniones** es una aplicación web que reemplaza las hojas de cálculo manuales usadas para programar las asignaciones semanales de las reuniones de congregación. Gestiona la reunión de entre semana (Vida y Ministerio Cristiano), la reunión de fin de semana y la rotación de acomodadores y micrófonos, todo en un solo lugar.

El núcleo del sistema es un **motor de asignaciones puro** que utiliza un algoritmo de rotación LRU (Least Recently Used) para garantizar una distribución justa de las asignaciones entre todos los publicadores elegibles. El motor respeta los requisitos de elegibilidad, las restricciones basadas en roles y las reglas de género, produciendo propuestas de asignación sin conflictos y sin efectos secundarios.

Ya sea que gestiones una congregación pequeña o grande, el Programador de Reuniones te ofrece asignación automática con capacidad de modificación manual completa, formularios imprimibles (S-140, S-89), seguimiento de historial de asignaciones e importación/exportación CSV para una fácil migración desde herramientas existentes.

### Capturas de pantalla

> _Próximamente — capturas del dashboard, vista de asignaciones, vistas de impresión y diseño móvil._

### Funcionalidades

#### Gestión de publicadores

- Operaciones CRUD completas para publicadores
- Roles: Anciano, Siervo Ministerial, Publicador Bautizado, Publicador No Bautizado
- Filtrado de elegibilidad basado en género
- Gestión de estados: Activo, Ausente, Restringido, Inactivo
- Flags de elegibilidad: Habilitado VMC, Oración, Lectura, Acomodador, Micrófono
- Ausencia temporal con fecha de fin
- Flag de exclusión temporal de asignación
- Notas libres por publicador
- Borrado lógico (soft delete)

#### Reunión de entre semana (VMC)

- 5 secciones: Apertura, Tesoros de la Palabra de Dios, Seamos Mejores Maestros, Nuestra Vida Cristiana, Cierre
- Partes fijas generadas automáticamente (Presidente, Oraciones, Discurso Tesoros, Perlas Espirituales, Lectura de la Biblia, Encargado de Escuela, Conductor y Lector del Estudio Bíblico)
- Partes dinámicas agregadas manualmente (demostraciones de la Escuela, discursos de Nuestra Vida Cristiana)
- Soporte para sala auxiliar (lectura y demostraciones duplicadas)
- Estados de semana: Borrador, Asignado, Publicado

#### Reunión de fin de semana

- Presidente, conductor del estudio de La Atalaya, lector
- Orador del discurso público
- Oraciones de apertura y cierre

#### Asignación automática

- Motor de asignaciones puro (sin efectos secundarios, sin acceso a base de datos)
- Algoritmo de rotación LRU para distribución justa
- Dos modos: Completo (regenera todo) y Parcial (solo llena huecos)
- Orden de prioridad: las partes más restrictivas se asignan primero
- Sistema de dos pasadas: titulares primero, luego ayudantes
- Modo determinista con semilla para testing

#### Modificación manual

- Clasificación de candidatos: Elegible, Advertencia, Bloqueado
- Las restricciones duras impiden la selección (género incorrecto, rol incorrecto)
- Las restricciones blandas muestran advertencias pero permiten la selección (ya asignado, tiene notas)
- Candidatos ordenados por rotación (el que hace más tiempo que no fue asignado aparece primero)

#### Rotación de acomodadores y micrófonos

- 4 roles: Portero, Acomodador, Micrófono 1, Micrófono 2
- Motor separado con rotación independiente
- Restricción blanda: evita asignar a alguien que ya tiene parte VMC esa semana

#### Historial y métricas

- Historial completo de asignaciones por publicador
- Métricas de distribución de carga de trabajo
- Filtros por fecha, publicador y tipo de parte
- Registros desnormalizados que sobreviven la eliminación de semanas

#### Vistas de impresión

- **S-140** — Programa de la reunión de entre semana (semana individual)
- **S-89** — Hoja de asignación individual por publicador
- **Programa de fin de semana** — Programa de la reunión de fin de semana
- **Reporte de acomodadores** — Asignaciones de acomodadores y micrófonos
- **S-140 multi-semana** — Rango de semanas en una sola vista imprimible

#### Gestión de datos

- Importación CSV para Publicadores, Historial de Asignaciones y Semanas de Reunión
- Descarga de plantilla, validación y vista previa antes de importar
- Respaldo de base de datos con checkpoint WAL
- Restauración de base de datos con validación de esquema
- Limpieza completa de base de datos

#### Otros

- Tema oscuro / claro
- Diseño responsivo para móvil (375px+)
- Internacionalización (Español + Inglés)
- Autenticación JWT con contraseña

### Stack tecnológico

| Tecnología                                    | Versión | Propósito                                 |
| --------------------------------------------- | ------- | ----------------------------------------- |
| [Next.js](https://nextjs.org/)                | 16.2.0  | Framework (App Router, Server Components) |
| [React](https://react.dev/)                   | 19      | Librería de UI                            |
| [TypeScript](https://www.typescriptlang.org/) | 5       | Lenguaje                                  |
| [Prisma](https://www.prisma.io/)              | 7.5     | ORM con adaptador LibSQL                  |
| [LibSQL / SQLite](https://turso.tech/libsql)  | —       | Base de datos                             |
| [next-intl](https://next-intl.dev/)           | 4.8     | Internacionalización (es/en)              |
| [Base UI](https://base-ui.com/)               | 1.3     | Componentes primitivos                    |
| [Tailwind CSS](https://tailwindcss.com/)      | 4.2     | CSS utilitario                            |
| [Zod](https://zod.dev/)                       | 4.3     | Validación de esquemas                    |
| [jose](https://github.com/panva/jose)         | 6.2     | Autenticación JWT                         |
| [Vitest](https://vitest.dev/)                 | 4.1     | Framework de testing                      |

### Inicio rápido

#### Prerrequisitos

- Node.js 22+
- npm, pnpm o bun

#### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/your-username/programador-de-reuniones.git
cd programador-de-reuniones

# Instalar dependencias
pnpm install
```

#### Variables de entorno

Creá un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env
```

| Variable              | Descripción                                              | Ejemplo                                      |
| --------------------- | -------------------------------------------------------- | -------------------------------------------- |
| `DATABASE_URL`        | Cadena de conexión SQLite                                | `file:./prisma/dev.db`                       |
| `JWT_SECRET`          | Clave secreta para firma JWT (HS256, mín. 32 caracteres) | `tu-clave-secreta-aqui-minimo-32-caracteres` |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt de la contraseña de administrador            | `$2a$10$...`                                 |

> **Nota:** Nunca hagas commit de secretos reales. Usá `.env.example` como plantilla con valores de ejemplo.

#### Configuración de base de datos

```bash
# Aplicar el esquema Prisma a la base de datos
pnpm db:push

# (Opcional) Cargar datos de prueba
pnpm db:seed

# (Opcional) Abrir Prisma Studio para inspeccionar la base de datos
pnpm db:studio
```

#### Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Estructura del proyecto

```
src/
├── app/                        # Next.js App Router
│   ├── [locale]/
│   │   ├── (protected)/        # Rutas protegidas (layout con sidebar)
│   │   │   ├── publishers/     # CRUD de publicadores + carga de trabajo
│   │   │   ├── weeks/          # Gestión de semanas + asignaciones
│   │   │   ├── history/        # Historial de asignaciones + métricas
│   │   │   ├── attendants/     # Vista de acomodadores
│   │   │   └── settings/       # Importación CSV + respaldo
│   │   ├── (print)/            # Rutas de impresión (layout mínimo)
│   │   └── login/              # Autenticación
│   └── api/                    # Endpoints REST
├── components/
│   ├── layout/                 # Sidebar, Header
│   ├── publishers/             # Componentes de publicadores
│   ├── weeks/                  # Componentes de semanas y asignaciones
│   ├── history/                # Historial y métricas
│   ├── settings/               # Paneles de importación y respaldo
│   ├── print/                  # Componentes optimizados para impresión
│   └── ui/                     # 21 componentes base de UI
├── data/                       # Capa de acceso a datos (queries Prisma)
├── lib/
│   ├── assignment-engine/      # Motor de asignaciones VMC puro (testeado)
│   │   ├── index.ts            # Punto de entrada generateAssignments()
│   │   ├── eligibility.ts      # Matriz de elegibilidad
│   │   ├── constraints.ts      # Restricciones duras (por reunión)
│   │   ├── selector.ts         # Selector LRU con desempate aleatorio
│   │   ├── order.ts            # Orden de prioridad de asignación
│   │   ├── manual-constraints.ts  # Clasificación para override manual
│   │   └── types.ts            # Tipos del motor
│   ├── attendant-engine.ts     # Motor de rotación de acomodadores
│   ├── weekend-engine.ts       # Motor de asignación de fin de semana
│   ├── schemas/                # Esquemas de validación Zod
│   └── auth.ts                 # Utilidades JWT + bcrypt
├── i18n/                       # Configuración de internacionalización
└── hooks/                      # React hooks
messages/
├── es/                         # Traducciones en español
└── en/                         # Traducciones en inglés
prisma/
├── schema.prisma               # Modelo de datos
└── seed.ts                     # Script de seed
```

### Arquitectura

#### Server Components vs Client Components

La aplicación usa Next.js App Router con React Server Components por defecto. Los Client Components se usan solo donde se requiere interactividad (formularios, modales, dropdowns). La obtención de datos ocurre a nivel del Server Component, y los Client Components reciben datos como props.

#### Server Actions

Todas las mutaciones de datos (crear, actualizar, eliminar) se manejan a través de Server Actions de Next.js. Esto elimina la necesidad de la mayoría de las rutas API y provee lógica server-side co-ubicada y con tipos seguros, con revalidación automática.

#### Motor de asignaciones

El motor de asignaciones es el núcleo de la aplicación. Consiste en **3 motores puros** — cada uno sin efectos secundarios, sin acceso a base de datos y con cobertura completa de tests:

##### Motor VMC (`lib/assignment-engine/`)

Maneja las asignaciones de la reunión de entre semana. El flujo:

```
Clic en "Asignar" (UI)
  → Cargar partes de la reunión (DB)
  → Cargar publicadores elegibles (DB)
  → Cargar mapa de rotación por publicador (DB: historial)
  → Cargar asignaciones existentes (DB, solo modo parcial)
  → generateAssignments(...) [FUNCIÓN PURA]
  → Guardar resultados en la base de datos (DB)
```

**Algoritmo de rotación LRU:**

1. Para cada candidato que pasa elegibilidad + restricciones, buscar su última fecha de asignación para ese **tipo de parte** (`eligibilityKey`) en el mapa de rotación
2. Si nunca fue asignado para ese tipo de parte, usar fecha epoch 0 (prioridad máxima)
3. Ordenar ascendente por fecha (el más antiguo primero = mayor prioridad)
4. Desempatar aleatoriamente (determinista con semilla para tests, usando PRNG mulberry32)

**Matriz de elegibilidad:**

El motor usa una matriz de elegibilidad que mapea claves de parte a funciones filtro. Todo publicador debe primero pasar tres prerrequisitos: Habilitado VMC, Estado Activo y flag de exclusión desactivado. Luego se aplican las reglas específicas de cada parte:

| Parte                         | Requisito                                                  |
| ----------------------------- | ---------------------------------------------------------- |
| Presidente                    | Anciano varón                                              |
| Encargado de escuela          | Anciano varón                                              |
| Discurso Tesoros              | Anciano o Siervo Ministerial                               |
| Perlas Espirituales           | Anciano o Siervo Ministerial                               |
| Conductor del Estudio Bíblico | Anciano o Siervo Ministerial                               |
| Oraciones                     | Flag de oración habilitado                                 |
| Lector del Estudio Bíblico    | Flag de lectura habilitado                                 |
| Lectura de la Biblia          | Varón (cualquier rol)                                      |
| Demostraciones SMM (titular)  | Cualquier publicador elegible                              |
| Demostraciones SMM (ayudante) | Mismo género que el titular, cualquier publicador elegible |
| Discursos SMM                 | Varón                                                      |
| Discursos NVC (dinámicos)     | Varón bautizado (Anciano, SM o Publicador Bautizado)       |

**Restricciones duras (por reunión):**

1. Máximo 1 asignación por persona por reunión
2. Roles exclusivos — Presidente/Encargado de escuela no pueden tener otras partes
3. Sin conflicto de sala — no puede tener la misma parte lógica en sala principal y auxiliar
4. No puede ser titular y ayudante simultáneamente

**Orden de prioridad:**

Las partes se asignan de más restrictiva a menos para no consumir candidatos escasos:

| Prioridad | Parte                                          |
| --------- | ---------------------------------------------- |
| 0         | Presidente                                     |
| 1         | Encargado de escuela (principal + auxiliar)    |
| 2         | Oración de apertura                            |
| 3         | Discurso Tesoros, Perlas Espirituales          |
| 4         | Discursos Nuestra Vida Cristiana (dinámicos)   |
| 5         | Conductor del Estudio Bíblico                  |
| 6         | Lector del Estudio Bíblico                     |
| 7         | Lectura de la Biblia (principal + auxiliar)    |
| 8–9       | Demostraciones SMM (principal, luego auxiliar) |
| 12        | Oración de cierre                              |

**Sistema de dos pasadas:**

1. Primera pasada — asigna titulares para todas las partes en orden de prioridad
2. Segunda pasada — para partes que requieren ayudante, busca un ayudante que pase prerrequisitos, sea del mismo género que el titular (para demostraciones) y no esté ya asignado

**Modos:** Completo (regenera todo) o Parcial (llena huecos, preservando asignaciones existentes).

##### Motor de fin de semana (`lib/weekend-engine.ts`)

Maneja los roles de la reunión de fin de semana: presidente, conductor de La Atalaya, lector y oraciones. Usa el mismo enfoque de rotación LRU con elegibilidad específica por rol.

##### Motor de acomodadores (`lib/attendant-engine.ts`)

Maneja 4 roles: Portero, Acomodador, Micrófono 1, Micrófono 2. Cada rol tiene su propio flag de habilitación y rotación LRU independiente. Aplica una restricción blanda para evitar asignar a alguien que ya tiene parte VMC esa semana.

#### Modelo de datos

La aplicación usa 7 modelos de Prisma:

| Modelo                  | Descripción                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **Publisher**           | Miembros con roles, género, estado y flags de elegibilidad                              |
| **MeetingWeek**         | Contenedor semanal (fechas, canciones, lectura semanal)                                 |
| **MeetingPart**         | Secciones individuales de la reunión (tipo, sección, duración, sala)                    |
| **Assignment**          | Vincula un publicador (+ ayudante opcional) a una parte                                 |
| **AssignmentHistory**   | Registro histórico desnormalizado (sobrevive eliminación de semanas)                    |
| **WeekendMeeting**      | Roles de la reunión de fin de semana (presidente, conductor, lector, oraciones, orador) |
| **AttendantAssignment** | Roles de acomodador y micrófono por fecha de reunión                                    |

El esquema completo está en `prisma/schema.prisma`.

### Scripts

| Script              | Descripción                                |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | Iniciar servidor de desarrollo (Turbopack) |
| `pnpm build`        | Build de producción                        |
| `pnpm start`        | Iniciar servidor de producción             |
| `pnpm lint`         | Ejecutar ESLint                            |
| `pnpm format`       | Formatear código con Prettier              |
| `pnpm format:check` | Verificar formateo del código              |
| `pnpm db:push`      | Aplicar esquema Prisma a la base de datos  |
| `pnpm db:seed`      | Cargar datos de prueba                     |
| `pnpm db:studio`    | Abrir Prisma Studio                        |
| `pnpm test`         | Ejecutar tests una vez                     |
| `pnpm test:watch`   | Ejecutar tests en modo watch               |

### Vistas de impresión

La aplicación genera formularios imprimibles optimizados para papel A4:

| Vista             | Ruta                                | Descripción                                                 |
| ----------------- | ----------------------------------- | ----------------------------------------------------------- |
| **S-140**         | `/weeks/[id]/print/s140`            | Programa de la reunión de entre semana (formulario oficial) |
| **S-89**          | `/weeks/[id]/print/s89`             | Hoja de asignación individual por publicador                |
| **Fin de semana** | `/weeks/[id]/print/weekend`         | Programa de la reunión de fin de semana                     |
| **Acomodadores**  | `/weeks/[id]/print/attendants`      | Reporte de acomodadores y micrófonos                        |
| **Multi-semana**  | `/weeks/print/s140?from=...&to=...` | S-140 para un rango de semanas                              |

Las rutas de impresión usan un layout mínimo (sin sidebar, sin navegación) diseñado específicamente para imprimir.

### Internacionalización

La aplicación soporta **Español** (idioma principal) e **Inglés** usando [next-intl](https://next-intl.dev/).

- Los archivos de traducción están en `messages/es/` y `messages/en/`, organizados por módulo: `common`, `nav`, `publishers`, `meetings`, `history`, `attendants`, `settings`, `auth`, `dashboard`
- El idioma se determina por el prefijo de la URL: `/es/...` o `/en/...`
- El middleware maneja la detección de idioma y las redirecciones

**Para agregar un nuevo idioma:**

1. Creá un nuevo directorio en `messages/` (ej: `messages/pt/`)
2. Copiá todos los archivos JSON de `messages/en/` y traducilos
3. Agregá el idioma a la lista de idiomas soportados en `src/i18n/`
4. El routing y el middleware lo detectarán automáticamente

### Importación CSV

La aplicación soporta 3 módulos de importación CSV para migrar datos desde herramientas externas:

| Módulo           | Qué importa                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| **Publicadores** | Registros de publicadores con roles, género, flags de elegibilidad y estado |
| **Historial**    | Registros de historial de asignaciones (desnormalizados)                    |
| **Semanas**      | Semanas de reunión con partes y asignaciones                                |

**Flujo de importación:**

1. Descargá la plantilla CSV del módulo
2. Completá tus datos siguiendo el formato de la plantilla
3. Subí el archivo — el sistema valida todas las filas contra esquemas Zod
4. Previsualizá los datos parseados y revisá errores de validación
5. Confirmá para importar — los registros se crean en la base de datos

### Respaldo y restauración

| Acción        | Descripción                                                                         |
| ------------- | ----------------------------------------------------------------------------------- |
| **Respaldo**  | Descarga una copia completa de la base de datos (archivo SQLite con checkpoint WAL) |
| **Restaurar** | Sube un archivo de respaldo, valida el esquema y reemplaza la base de datos actual  |
| **Limpiar**   | Borra todos los datos de la base de datos (irreversible — ¡hacé respaldo primero!)  |

El respaldo y la restauración están disponibles en **Configuración** y operan sobre el archivo SQLite completo.

### Tests

Los motores de asignación tienen tests unitarios completos que cubren:

- Elegibilidad — cada tipo de parte con cada combinación de rol/género
- Restricciones — una parte por reunión, roles exclusivos, conflictos de sala
- Selector LRU — rotación, desempate, semilla determinista
- Orden de prioridad
- Restricciones manuales — clasificación de candidatos (elegible/advertencia/bloqueado)
- Integración completa del motor — flujo completo, modo parcial

```bash
# Ejecutar todos los tests una vez
pnpm test

# Ejecutar tests en modo watch
pnpm test:watch
```

### Licencia

Licencia MIT — Copyright (c) 2026 Cesar Ortiz

Consultá [LICENSE](./LICENSE) para más detalles.
