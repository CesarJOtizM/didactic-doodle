# Programador VMC

Herramienta para gestionar las asignaciones de la reunion de entre semana (Vida y Ministerio Cristiana) de las congregaciones de los Testigos de Jehova. Automatiza la rotacion justa de publicadores, respeta los requisitos de elegibilidad de cada parte, y permite generar las vistas de impresion S-140 y S-89.

---

## Que es?

El **Programador VMC** es una aplicacion web que reemplaza las hojas de calculo manuales usadas para programar las asignaciones semanales de la reunion de entre semana. Permite:

- Registrar publicadores con sus capacidades y roles
- Crear semanas con la estructura completa de la reunion (tesoros, seamos mejores maestros, nuestra vida cristiana)
- Asignar partes automaticamente con un algoritmo de rotacion justa
- Asignar manualmente con advertencias de restricciones
- Llevar historial de asignaciones por publicador
- Imprimir los formularios oficiales S-140 y S-89
- Gestionar acomodadores y microfonos
- Gestionar la reunion de fin de semana (presidente, lector, oraciones)

---

## Caracteristicas principales

### Gestion de publicadores

- Alta, baja y edicion de publicadores
- Campos de elegibilidad: habilitado VMC, habilitado oracion, habilitado lectura, habilitado acomodador, habilitado microfono
- Roles: anciano, siervo ministerial, publicador bautizado, publicador no bautizado
- Estados: activo, ausente, restringido, inactivo
- Marcador de ausencia temporal con fecha de fin
- Campo `skipAssignment` para excluir temporalmente de la asignacion automatica
- Observaciones libres por publicador
- Borrado logico (soft delete)

### Gestion de semanas y reuniones

- Crear semanas con fecha, lectura semanal y canciones
- Partes fijas generadas automaticamente (presidente, oraciones, tesoros, perlas, lectura biblica, encargado de escuela, conductor y lector del estudio)
- Partes dinamicas agregadas manualmente (demostraciones SMM, discursos NVC)
- Soporte para sala auxiliar (lectura y demostraciones duplicadas)
- Estados de semana: borrador, asignado, publicado
- Reunion de fin de semana asociada (presidente, lector, orador, oraciones)

### Asignacion automatica

- Motor de asignaciones puro (sin efectos secundarios, sin acceso a base de datos)
- Rotacion justa basada en LRU (Least Recently Used) por tipo de parte
- Dos modos: completo (regenera todo) y parcial (solo llena huecos)
- Respeta elegibilidad, restricciones por semana y orden de prioridad

### Asignacion manual con advertencias

- Clasificacion de candidatos: elegible, advertencia, bloqueado
- Restricciones duras impiden la seleccion (ej: genero incorrecto)
- Restricciones blandas muestran advertencia pero permiten la seleccion (ej: ya asignado en otra parte)
- Ordenamiento por rotacion (quien hace mas tiempo que no fue asignado aparece primero)

### Historial y seguimiento

- Historial de asignaciones por publicador
- Seguimiento de carga de trabajo
- Filtros por fecha, publicador y tipo de parte
- Los datos de historial son independientes (desnormalizados) para no perder informacion al borrar semanas

### Acomodadores y microfonos

- Asignacion de roles: portero, acomodador, microfono 1, microfono 2
- Motor de asignacion separado con rotacion propia
- Restriccion blanda: intenta no asignar acomodador a quien ya tiene parte VMC esa semana

### Vistas de impresion

- S-140: programa de la reunion de entre semana
- S-89: asignacion individual para cada publicador

### Internacionalizacion (i18n)

- Espanol (idioma principal)
- Ingles
- Implementado con next-intl
- Archivos de traduccion organizados por modulo: `common`, `nav`, `publishers`, `meetings`, `history`, `attendants`, `settings`, `auth`, `dashboard`

### Respaldo, restauracion y migracion

- Endpoint de backup/restore para la base de datos completa
- Importacion desde Excel (formato especifico con hojas: Inscritos, Variables, Historico Asignaciones)
- Parseo automatico de estructura de reunion desde el formato Excel legacy

### Autenticacion

- Login con contrasena (bcryptjs + jose/JWT)
- Middleware de proteccion para rutas

---

## Motor de asignaciones

Esta es la parte central del sistema. El motor es una **funcion pura** que recibe datos inmutables y devuelve una propuesta de asignacion. No accede a la base de datos ni tiene efectos secundarios.

### El flujo completo

```
Clic en "Asignar" (UI)
  -> Cargar partes de la semana (DB)
  -> Cargar publicadores elegibles (DB)
  -> Cargar mapa de rotacion por publicador (DB: historial)
  -> Cargar asignaciones existentes (DB, solo en modo parcial)
  -> generateAssignments(...) [funcion pura]
  -> Guardar resultados en la base de datos (DB)
```

El motor recibe cinco argumentos:

1. `parts` — las partes de la reunion (fijas y dinamicas)
2. `publishers` — todos los publicadores candidatos
3. `rotationMap` — mapa de rotacion: `publisherId -> eligibilityKey -> ultimaFecha`
4. `existingAssignments` — asignaciones ya existentes (solo para modo parcial)
5. `config` — modo (`full` o `partial`) y semilla opcional para tests

### Elegibilidad: quien puede hacer que

Antes de verificar la elegibilidad especifica, todo publicador debe cumplir tres **prerrequisitos**:

- `habilitadoVMC = true`
- `estado = ACTIVE`
- `skipAssignment = false`

Si no cumple los tres, queda excluido de TODA parte automatica.

| Parte                         | Requisito                                                            |
| ----------------------------- | -------------------------------------------------------------------- |
| Presidente                    | Anciano varon                                                        |
| Encargado de escuela          | Anciano varon                                                        |
| Discurso Tesoros              | Anciano o Siervo Ministerial                                         |
| Perlas espirituales           | Anciano o Siervo Ministerial                                         |
| Conductor Estudio Biblico     | Anciano o Siervo Ministerial                                         |
| Oracion (apertura/cierre)     | `habilitadoOracion = true`                                           |
| Lector Estudio Biblico        | `habilitadoLectura = true`                                           |
| Lectura de la Biblia          | Varon (cualquier rol)                                                |
| Demostraciones SMM (titular)  | Cualquiera que pase prerrequisitos                                   |
| Demostraciones SMM (ayudante) | Cualquiera que pase prerrequisitos, mismo genero que el titular      |
| Discursos SMM                 | Varon                                                                |
| Discursos NVC (dinamicos)     | Varon bautizado (anciano, siervo ministerial o publicador bautizado) |

La elegibilidad se resuelve mediante una **matriz de elegibilidad** (`ELIGIBILITY_MATRIX`) que mapea claves de parte a funciones filtro. Las partes fijas usan su `tituloKey` como clave; las partes dinamicas usan una clave compuesta (`MINISTRY_SCHOOL:DEMONSTRATION:titular`, `CHRISTIAN_LIFE:dynamic`, etc.).

### Restricciones por semana

Una vez que un publicador es elegible para una parte, se aplican estas **restricciones duras** que lo descartan si ya esta comprometido en la misma reunion:

1. **Maximo 1 parte por persona por reunion** — si ya esta asignado como titular o ayudante en cualquier parte, queda descartado para las siguientes
2. **Roles exclusivos** — si alguien es Presidente o Encargado de escuela, no puede tener ninguna otra parte en esa reunion
3. **Sin conflicto de sala** — no puede tener la misma parte logica en sala principal y auxiliar (ej: no puede ser lector en sala principal y lector en auxiliar)
4. **No titular y ayudante a la vez** — si es titular en una parte, no puede ser ayudante en otra (y viceversa)

Estas restricciones se aplican secuencialmente. Si despues de filtrar no quedan candidatos, la parte queda como "no asignada" y se reporta en el resultado.

### Algoritmo de rotacion (LRU)

El selector usa un algoritmo **Least Recently Used** (el que hace mas tiempo que no fue asignado gana):

1. Para cada candidato que paso elegibilidad + restricciones, buscar su ultima fecha de asignacion para ese **tipo de parte** (`eligibilityKey`) en el mapa de rotacion
2. Si nunca fue asignado para ese tipo de parte, usar fecha epoch 0 (prioridad maxima)
3. Ordenar ascendente por fecha (el mas viejo primero)
4. Si hay empate (varios con la misma fecha mas antigua), desempatar aleatoriamente
5. Para tests deterministas, se puede pasar un `seed` que alimenta un PRNG (mulberry32)

Puntos clave:

- La rotacion es **por tipo de parte**, no global. Si un publicador fue presidente hace 2 semanas pero nunca dio una perla, la perla tiene prioridad sobre el que dio perla la semana pasada.
- No existe un periodo minimo de descanso configurable entre asignaciones.

### Orden de prioridad de asignacion

Las partes se asignan en un orden especifico: **las mas restrictivas primero**. Esto evita que partes con un pool grande de candidatos "consuman" a los pocos publicadores elegibles para partes exclusivas.

| Prioridad | Parte                                       |
| --------- | ------------------------------------------- |
| 0         | Presidente                                  |
| 1         | Encargado de escuela (principal y auxiliar) |
| 2         | Oracion de apertura                         |
| 3         | Discurso Tesoros, Perlas espirituales       |
| 4         | Discursos NVC (dinamicos)                   |
| 5         | Conductor Estudio Biblico                   |
| 6         | Lector Estudio Biblico                      |
| 7         | Lectura de la Biblia (principal y auxiliar) |
| 8         | Demostraciones SMM sala principal           |
| 9         | Demostraciones SMM sala auxiliar            |
| 12        | Oracion de cierre                           |

Dentro de la misma prioridad, se asigna sala principal antes que auxiliar, y despues por el orden original de la plantilla.

La oracion de cierre va al final (prioridad 12) porque su pool de candidatos incluye a todos los que pueden orar, y se quiere maximizar la oportunidad de que los publicadores con menos opciones sean asignados primero.

### Dos pasadas: titulares y ayudantes

El motor ejecuta **dos pasadas**:

1. **Primera pasada** — asigna titulares para todas las partes, en el orden de prioridad descrito arriba
2. **Segunda pasada** — para cada parte que requiere ayudante (`requiereAyudante = true`), busca un ayudante entre los candidatos que:
   - Pasan prerrequisitos
   - Son del mismo genero que el titular (solo para demostraciones en asignacion automatica)
   - No estan ya asignados en la reunion
   - No son el titular de esa misma parte

Los ayudantes comparten un unico pool de rotacion (clave `MINISTRY_SCHOOL:helper`), independientemente de en cual demostracion se asignen.

### Modo completo vs parcial

- **Completo (`full`)**: descarta todas las asignaciones existentes y regenera desde cero
- **Parcial (`partial`)**: conserva las asignaciones existentes y solo intenta llenar los huecos (partes sin titular o titulares sin ayudante)

En modo parcial, las asignaciones existentes se pre-cargan en el estado interno para que las restricciones las consideren (ej: no asignar dos veces al mismo publicador).

### Asignacion manual (override)

El sistema de asignacion manual no filtra candidatos sino que los **clasifica**:

- **Elegible**: cumple todos los requisitos, sin advertencias
- **Advertencia (warning)**: puede ser seleccionado, pero tiene una advertencia (ya asignado, conflicto de sala, tiene observaciones, tiene `skipAssignment`)
- **Bloqueado**: no puede ser seleccionado (no cumple elegibilidad de rol/genero, tiene rol exclusivo ya asignado)

Los candidatos se ordenan: elegibles primero (por rotacion), luego con advertencia, bloqueados al final. Esto le da al usuario toda la informacion para tomar la decision.

### Limitaciones conocidas

- **Sin descanso global**: no existe un mecanismo para evitar que alguien tenga partes en semanas consecutivas si son de tipos diferentes (ej: lector una semana, oracion la siguiente)
- **Rotacion de ayudantes compartida**: todos los ayudantes comparten un unico pool de rotacion, sin importar si es la demostracion 1, 2 o 3
- **Demostraciones comparten rotacion**: demo 1, demo 2 y demo 3 del SMM usan la misma clave de elegibilidad, asi que la rotacion es compartida entre todas
- **Sin preferencias de publicador**: no se pueden indicar preferencias de horario o tipo de parte por publicador

---

## Motor de acomodadores

Sistema separado del motor VMC. Asigna cuatro roles por reunion: portero, acomodador, microfono 1 y microfono 2.

- Cada rol tiene su propio flag de habilitacion (`habilitadoAcomodador` para portero/acomodador, `habilitadoMicrofono` para microfonos)
- Rotacion LRU por rol
- **Restriccion blanda**: intenta evitar asignar a alguien que ya tiene parte VMC en esa reunion, pero si no hay alternativa, lo asigna igual
- Un publicador no puede tener dos roles de acomodador en la misma reunion

---

## Stack tecnologico

| Tecnologia                                                                               | Uso                                      |
| ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| [Next.js 14](https://nextjs.org/)                                                        | Framework web (App Router)               |
| [TypeScript](https://www.typescriptlang.org/)                                            | Lenguaje                                 |
| [Prisma ORM](https://www.prisma.io/) + SQLite                                            | Base de datos con adaptador libsql       |
| [next-intl](https://next-intl.dev/)                                                      | Internacionalizacion (es/en)             |
| [Base UI](https://base-ui.com/)                                                          | Componentes de interfaz                  |
| [Tailwind CSS](https://tailwindcss.com/)                                                 | Estilos utilitarios                      |
| [Zod](https://zod.dev/)                                                                  | Validacion de esquemas                   |
| [Vitest](https://vitest.dev/)                                                            | Tests unitarios                          |
| [jose](https://github.com/panva/jose) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Autenticacion (JWT + hash de contrasena) |
| [xlsx](https://docs.sheetjs.com/)                                                        | Parseo de archivos Excel para migracion  |
| [Lucide React](https://lucide.dev/)                                                      | Iconos                                   |
| [cmdk](https://cmdk.paco.me/)                                                            | Command palette                          |

---

## Estructura del proyecto

```
src/
  app/
    [locale]/
      (protected)/           # Rutas autenticadas
        page.tsx             # Dashboard principal
        publishers/          # CRUD de publicadores
        weeks/               # Gestion de semanas y asignaciones
          [id]/              # Detalle de semana
        history/             # Historial de asignaciones
        attendants/          # Gestion de acomodadores
        settings/            # Configuracion (backup, migracion)
      (print)/               # Rutas de impresion (sin layout de navegacion)
        weeks/
          [id]/print/s140/   # Vista S-140
          [id]/print/s89/    # Vista S-89
        weeks/print/s140/    # Vista S-140 multi-semana
      login/                 # Pagina de login
    api/
      auth/                  # Endpoints de autenticacion
      backup/                # Endpoints de backup/restore
      publishers/            # API de publicadores
  components/
    layout/                  # Navegacion, sidebar, header
    publishers/              # Componentes de publicadores
    weeks/                   # Componentes de semanas y asignaciones
    history/                 # Componentes de historial
    settings/                # Componentes de configuracion
    print/                   # Componentes de impresion
    shared/                  # Componentes compartidos
    ui/                      # Componentes base (botones, inputs, etc.)
  data/                      # Capa de acceso a datos (queries Prisma)
    prisma.ts                # Cliente Prisma singleton
    publishers.ts            # Queries de publicadores
    meeting-weeks.ts         # Queries de semanas
    assignments.ts           # Queries de asignaciones
    history.ts               # Queries de historial
    attendants.ts            # Queries de acomodadores
    weekend-meetings.ts      # Queries de reunion de fin de semana
    migration.ts             # Queries de migracion
  generated/prisma/          # Cliente Prisma generado
  hooks/                     # React hooks custom
  i18n/                      # Configuracion de next-intl
  lib/
    assignment-engine/       # Motor de asignaciones (puro, testeado)
      index.ts               # Funcion principal generateAssignments()
      eligibility.ts         # Matriz de elegibilidad
      constraints.ts         # Restricciones duras (por semana)
      selector.ts            # Selector LRU con desempate aleatorio
      order.ts               # Orden de prioridad de asignacion
      manual-constraints.ts  # Clasificacion para asignacion manual
      types.ts               # Tipos del motor
      __tests__/             # Tests unitarios del motor
    attendant-engine.ts      # Motor de acomodadores
    migration/               # Parser de Excel para migracion
    schemas/                 # Esquemas Zod de validacion
    constants/               # Plantilla de partes fijas, constantes
    auth.ts                  # Utilidades de autenticacion
    utils.ts                 # Utilidades generales
  middleware.ts              # Middleware de Next.js (auth + i18n)
messages/
  es/                        # Traducciones espanol
  en/                        # Traducciones ingles
prisma/
  schema.prisma              # Modelo de datos
  seed.ts                    # Script de seed
```

---

## Instalacion y desarrollo

### Prerrequisitos

- Node.js 18+ o Bun
- pnpm (o bun)

### Instalacion

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd programador-vmc

# Instalar dependencias
pnpm install
```

### Configuracion del entorno

Crear un archivo `.env` en la raiz del proyecto basandose en `.env.example`:

```bash
cp .env.example .env
```

Configurar las variables necesarias (base de datos, secreto JWT, etc.).

### Base de datos

```bash
# Aplicar el esquema a la base de datos
pnpm db:push

# (Opcional) Cargar datos de prueba
pnpm db:seed

# (Opcional) Abrir Prisma Studio para inspeccionar la DB
pnpm db:studio
```

### Desarrollo

```bash
pnpm dev
```

La aplicacion estara disponible en `http://localhost:3000`.

---

## Scripts disponibles

| Script              | Descripcion                                 |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Inicia el servidor de desarrollo            |
| `pnpm build`        | Genera el build de produccion               |
| `pnpm start`        | Inicia el servidor de produccion            |
| `pnpm lint`         | Ejecuta ESLint                              |
| `pnpm format`       | Formatea el codigo con Prettier             |
| `pnpm format:check` | Verifica el formateo sin modificar          |
| `pnpm db:push`      | Aplica el esquema Prisma a la base de datos |
| `pnpm db:seed`      | Ejecuta el script de seed                   |
| `pnpm db:studio`    | Abre Prisma Studio                          |
| `pnpm test`         | Ejecuta los tests con Vitest                |
| `pnpm test:watch`   | Ejecuta los tests en modo watch             |

---

## Modelo de datos

Las entidades principales son:

- **Publisher** — publicador con sus roles, genero, estado y flags de elegibilidad
- **MeetingWeek** — semana con fecha, lectura semanal, canciones y estado
- **MeetingPart** — parte de la reunion (seccion, tipo, sala, orden)
- **Assignment** — asignacion de un publicador (titular + ayudante opcional) a una parte
- **AssignmentHistory** — registro historico desnormalizado de asignaciones pasadas
- **WeekendMeeting** — reunion de fin de semana (presidente, lector, oraciones, orador)
- **AttendantAssignment** — asignacion de acomodador/microfono para una fecha

El esquema completo esta en `prisma/schema.prisma`.

---

## Tests

El motor de asignaciones tiene tests unitarios completos que cubren:

- Elegibilidad (cada tipo de parte con cada combinacion de rol/genero)
- Restricciones (una parte por reunion, roles exclusivos, conflictos de sala)
- Selector LRU (rotacion, desempate, seed determinista)
- Orden de prioridad
- Restricciones manuales (clasificacion de candidatos)
- Motor integrado (flujo completo, modo parcial)

```bash
pnpm test
```

---

## Licencia

Este proyecto esta licenciado bajo la [Licencia MIT](./LICENSE).
