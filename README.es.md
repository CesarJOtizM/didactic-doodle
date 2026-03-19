# Programador de Reuniones

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](./LICENSE)

🇬🇧 [Read in English](./README.md)

> Aplicación web para programar y gestionar las asignaciones de las reuniones de congregación con rotación justa basada en algoritmo.

---

## Descripción general

**Programador de Reuniones** es una aplicación web que reemplaza las hojas de cálculo manuales usadas para programar las asignaciones semanales de las reuniones de congregación. Gestiona la reunión de entre semana (Vida y Ministerio Cristiano), la reunión de fin de semana y la rotación de acomodadores y micrófonos, todo en un solo lugar.

El núcleo del sistema es un **motor de asignaciones puro** que utiliza un algoritmo de rotación LRU (Least Recently Used) para garantizar una distribución justa de las asignaciones entre todos los publicadores elegibles. El motor respeta los requisitos de elegibilidad, las restricciones basadas en roles y las reglas de género, produciendo propuestas de asignación sin conflictos y sin efectos secundarios.

Ya sea que gestiones una congregación pequeña o grande, el Programador de Reuniones te ofrece asignación automática con capacidad de modificación manual completa, formularios imprimibles (S-140, S-89), seguimiento de historial de asignaciones e importación/exportación CSV para una fácil migración desde herramientas existentes.

## Capturas de pantalla

> _Próximamente — capturas del dashboard, vista de asignaciones, vistas de impresión y diseño móvil._

## Funcionalidades

### Gestión de publicadores

- Operaciones CRUD completas para publicadores
- Roles: Anciano, Siervo Ministerial, Publicador Bautizado, Publicador No Bautizado
- Filtrado de elegibilidad basado en género
- Gestión de estados: Activo, Ausente, Restringido, Inactivo
- Flags de elegibilidad: Habilitado VMC, Oración, Lectura, Acomodador, Micrófono
- Ausencia temporal con fecha de fin
- Flag de exclusión temporal de asignación
- Notas libres por publicador
- Borrado lógico (soft delete)

### Reunión de entre semana (VMC)

- 5 secciones: Apertura, Tesoros de la Palabra de Dios, Seamos Mejores Maestros, Nuestra Vida Cristiana, Cierre
- Partes fijas generadas automáticamente (Presidente, Oraciones, Discurso Tesoros, Perlas Espirituales, Lectura de la Biblia, Encargado de Escuela, Conductor y Lector del Estudio Bíblico)
- Partes dinámicas agregadas manualmente (demostraciones de la Escuela, discursos de Nuestra Vida Cristiana)
- Soporte para sala auxiliar (lectura y demostraciones duplicadas)
- Estados de semana: Borrador, Asignado, Publicado

### Reunión de fin de semana

- Presidente, conductor del estudio de La Atalaya, lector
- Orador del discurso público
- Oraciones de apertura y cierre

### Asignación automática

- Motor de asignaciones puro (sin efectos secundarios, sin acceso a base de datos)
- Algoritmo de rotación LRU para distribución justa
- Dos modos: Completo (regenera todo) y Parcial (solo llena huecos)
- Orden de prioridad: las partes más restrictivas se asignan primero
- Sistema de dos pasadas: titulares primero, luego ayudantes
- Modo determinista con semilla para testing

### Modificación manual

- Clasificación de candidatos: Elegible, Advertencia, Bloqueado
- Las restricciones duras impiden la selección (género incorrecto, rol incorrecto)
- Las restricciones blandas muestran advertencias pero permiten la selección (ya asignado, tiene notas)
- Candidatos ordenados por rotación (el que hace más tiempo que no fue asignado aparece primero)

### Rotación de acomodadores y micrófonos

- 4 roles: Portero, Acomodador, Micrófono 1, Micrófono 2
- Motor separado con rotación independiente
- Restricción blanda: evita asignar a alguien que ya tiene parte VMC esa semana

### Historial y métricas

- Historial completo de asignaciones por publicador
- Métricas de distribución de carga de trabajo
- Filtros por fecha, publicador y tipo de parte
- Registros desnormalizados que sobreviven la eliminación de semanas

### Vistas de impresión

- **S-140** — Programa de la reunión de entre semana (semana individual)
- **S-89** — Hoja de asignación individual por publicador
- **Programa de fin de semana** — Programa de la reunión de fin de semana
- **Reporte de acomodadores** — Asignaciones de acomodadores y micrófonos
- **S-140 multi-semana** — Rango de semanas en una sola vista imprimible

### Gestión de datos

- Importación CSV para Publicadores, Historial de Asignaciones y Semanas de Reunión
- Descarga de plantilla, validación y vista previa antes de importar
- Respaldo de base de datos con checkpoint WAL
- Restauración de base de datos con validación de esquema
- Limpieza completa de base de datos

### Otros

- Tema oscuro / claro
- Diseño responsivo para móvil (375px+)
- Internacionalización (Español + Inglés)
- Autenticación JWT con contraseña

## Stack tecnológico

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

## Inicio rápido

### Prerrequisitos

- Node.js 22+
- npm, pnpm o bun

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/your-username/programador-de-reuniones.git
cd programador-de-reuniones

# Instalar dependencias
pnpm install
```

### Variables de entorno

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

### Configuración de base de datos

```bash
# Aplicar el esquema Prisma a la base de datos
pnpm db:push

# (Opcional) Cargar datos de prueba
pnpm db:seed

# (Opcional) Abrir Prisma Studio para inspeccionar la base de datos
pnpm db:studio
```

### Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Estructura del proyecto

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

## Arquitectura

### Server Components vs Client Components

La aplicación usa Next.js App Router con React Server Components por defecto. Los Client Components se usan solo donde se requiere interactividad (formularios, modales, dropdowns). La obtención de datos ocurre a nivel del Server Component, y los Client Components reciben datos como props.

### Server Actions

Todas las mutaciones de datos (crear, actualizar, eliminar) se manejan a través de Server Actions de Next.js. Esto elimina la necesidad de la mayoría de las rutas API y provee lógica server-side co-ubicada y con tipos seguros, con revalidación automática.

### Motor de asignaciones

El motor de asignaciones es el núcleo de la aplicación. Consiste en **3 motores puros** — cada uno sin efectos secundarios, sin acceso a base de datos y con cobertura completa de tests:

#### Motor VMC (`lib/assignment-engine/`)

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

#### Motor de fin de semana (`lib/weekend-engine.ts`)

Maneja los roles de la reunión de fin de semana: presidente, conductor de La Atalaya, lector y oraciones. Usa el mismo enfoque de rotación LRU con elegibilidad específica por rol.

#### Motor de acomodadores (`lib/attendant-engine.ts`)

Maneja 4 roles: Portero, Acomodador, Micrófono 1, Micrófono 2. Cada rol tiene su propio flag de habilitación y rotación LRU independiente. Aplica una restricción blanda para evitar asignar a alguien que ya tiene parte VMC esa semana.

### Modelo de datos

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

## Scripts

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

## Vistas de impresión

La aplicación genera formularios imprimibles optimizados para papel A4:

| Vista             | Ruta                                | Descripción                                                 |
| ----------------- | ----------------------------------- | ----------------------------------------------------------- |
| **S-140**         | `/weeks/[id]/print/s140`            | Programa de la reunión de entre semana (formulario oficial) |
| **S-89**          | `/weeks/[id]/print/s89`             | Hoja de asignación individual por publicador                |
| **Fin de semana** | `/weeks/[id]/print/weekend`         | Programa de la reunión de fin de semana                     |
| **Acomodadores**  | `/weeks/[id]/print/attendants`      | Reporte de acomodadores y micrófonos                        |
| **Multi-semana**  | `/weeks/print/s140?from=...&to=...` | S-140 para un rango de semanas                              |

Las rutas de impresión usan un layout mínimo (sin sidebar, sin navegación) diseñado específicamente para imprimir.

## Internacionalización

La aplicación soporta **Español** (idioma principal) e **Inglés** usando [next-intl](https://next-intl.dev/).

- Los archivos de traducción están en `messages/es/` y `messages/en/`, organizados por módulo: `common`, `nav`, `publishers`, `meetings`, `history`, `attendants`, `settings`, `auth`, `dashboard`
- El idioma se determina por el prefijo de la URL: `/es/...` o `/en/...`
- El middleware maneja la detección de idioma y las redirecciones

**Para agregar un nuevo idioma:**

1. Creá un nuevo directorio en `messages/` (ej: `messages/pt/`)
2. Copiá todos los archivos JSON de `messages/en/` y traducilos
3. Agregá el idioma a la lista de idiomas soportados en `src/i18n/`
4. El routing y el middleware lo detectarán automáticamente

## Importación CSV

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

## Respaldo y restauración

| Acción        | Descripción                                                                         |
| ------------- | ----------------------------------------------------------------------------------- |
| **Respaldo**  | Descarga una copia completa de la base de datos (archivo SQLite con checkpoint WAL) |
| **Restaurar** | Sube un archivo de respaldo, valida el esquema y reemplaza la base de datos actual  |
| **Limpiar**   | Borra todos los datos de la base de datos (irreversible — ¡hacé respaldo primero!)  |

El respaldo y la restauración están disponibles en **Configuración** y operan sobre el archivo SQLite completo.

## Tests

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

## Licencia

Licencia MIT — Copyright (c) 2026 Cesar Ortiz

Consultá [LICENSE](./LICENSE) para más detalles.
