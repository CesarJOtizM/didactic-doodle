# PRD — Programador VMC

## Documento de Requisitos de Producto v1.1

| Campo       | Valor                                               |
|-------------|-----------------------------------------------------|
| Proyecto    | Programador VMC (Vida y Ministerio Cristianos)      |
| Tipo        | Aplicación web — una sola congregación              |
| Versión PRD | 1.1                                                 |
| Fecha       | Marzo 2026                                          |
| Stack       | Next.js 14 + TypeScript + Tailwind/shadcn + Prisma + SQLite |
| Hosting     | Desarrollo local, deploy en Vercel                  |
| i18n        | Español (es) + Inglés (en) desde el inicio          |

---

## Tabla de Contenidos

1. [Visión del Producto](#1-visión-del-producto)
2. [Problema a Resolver](#2-problema-a-resolver)
3. [Objetivos y Métricas de Éxito](#3-objetivos-y-métricas-de-éxito)
4. [Personas de Usuario](#4-personas-de-usuario)
5. [Alcance](#5-alcance)
6. [Requisitos Funcionales](#6-requisitos-funcionales)
7. [Requisitos No Funcionales](#7-requisitos-no-funcionales)
8. [Modelo de Datos](#8-modelo-de-datos)
9. [Plan de Entrega por Fases](#9-plan-de-entrega-por-fases)
10. [Preguntas Abiertas](#10-preguntas-abiertas)
11. [Glosario](#11-glosario)

---

## 1. Visión del Producto

### ¿Qué es?

Programador VMC es una aplicación web diseñada para gestionar la asignación de partes en las reuniones semanales de una congregación de los Testigos de Jehová. Cubre tanto la reunión de Vida y Ministerio Cristianos (entre semana) como la reunión de fin de semana, incluyendo la rotación de acomodadores y micrófonos.

### ¿Para quién?

Para el coordinador de la reunión VMC (típicamente un anciano o siervo ministerial designado) y, opcionalmente, para los ancianos del cuerpo que necesiten visibilidad sobre las asignaciones.

### ¿Por qué?

Actualmente la programación se gestiona en un archivo Excel/Google Sheets (`Programacion VMC.xlsx`) con ~80 publicadores, ~10.000 registros históricos y ~50 esquemas semanales. Este flujo es manual, propenso a errores, difícil de mantener y no escala. El sistema propuesto automatiza la asignación respetando las reglas de elegibilidad de la organización, mantiene un historial completo y genera los documentos oficiales (S-140 y S-89) listos para imprimir.

---

## 2. Problema a Resolver

### Dolor actual

| Problema                                   | Impacto                                                                                                   |
|--------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| Asignación 100% manual en Excel            | El coordinador dedica 1-2 horas semanales revisando elegibilidad, historial y distribución equitativa     |
| Sin validación de elegibilidad             | Riesgo de asignar partes a personas no elegibles (por rol, sexo o habilitación)                           |
| Balanceo de carga manual                   | Algunos publicadores reciben muchas partes mientras otros son olvidados                                    |
| Historial difícil de consultar             | 10.000+ filas en una hoja de cálculo sin filtros adecuados ni métricas                                    |
| Formato S-140 generado a mano             | Cada semana se recrea el programa oficial manualmente, con riesgo de errores de transcripción             |
| Tarjetas S-89 generadas a mano            | Se imprimen manualmente, lo cual consume tiempo y es propenso a errores                                   |
| Partes SMM variables                       | El número de partes en Seamos Mejores Maestros cambia por semana (3-7), complicando la plantilla de Excel |
| Sin gestión integrada de acomodadores      | La lista de portería, acomodadores y micrófonos se mantiene en un documento separado                      |

### Resultado esperado

Una aplicación donde el coordinador cargue el esquema de la semana, presione un botón para generar las asignaciones automáticamente, ajuste lo que necesite, y exporte el programa y las tarjetas listas para imprimir. Todo en menos de 15 minutos.

---

## 3. Objetivos y Métricas de Éxito

### Objetivos del producto

| #  | Objetivo                                                                           | Tipo        |
|----|------------------------------------------------------------------------------------|-------------|
| O1 | Reducir el tiempo semanal de programación de ~90 min a <15 min                     | Eficiencia  |
| O2 | Eliminar errores de elegibilidad (asignaciones inválidas = 0)                      | Calidad     |
| O3 | Distribución equitativa: desviación estándar de asignaciones por publicador < 1.5  | Equidad     |
| O4 | Migrar el 100% de los datos históricos del Excel                                   | Continuidad |
| O5 | Generar S-140 y S-89 con un solo clic                                              | Usabilidad  |

### Métricas de éxito (KPIs)

| Métrica                                     | Objetivo   | Medición                                                  |
|---------------------------------------------|------------|-----------------------------------------------------------|
| Tiempo promedio para programar una semana   | < 15 min   | Desde abrir la app hasta exportar el programa             |
| Asignaciones inválidas por mes              | 0          | Asignaciones que violan reglas de elegibilidad            |
| Cobertura de publicadores habilitados       | > 95%      | % de publicadores habilitados que reciben al menos 1 parte en 8 semanas |
| Adopción del coordinador                    | 100%       | El coordinador usa la app como herramienta principal      |

---

## 4. Personas de Usuario

### Persona 1: Coordinador VMC (usuario principal)

| Atributo    | Detalle                                                                                            |
|-------------|----------------------------------------------------------------------------------------------------|
| Quién       | Anciano o siervo ministerial designado como coordinador de la reunión VMC                          |
| Necesidad   | Programar las partes semanales de forma rápida, correcta y equitativa                              |
| Frustración | Tiempo excesivo en Excel, errores de elegibilidad, dificultad para rastrear historial              |
| Frecuencia  | Usa la app 1-2 veces por semana (para programar y para imprimir)                                   |
| Habilidad   | Conoce bien la estructura de la reunión; competencia técnica media (usa Excel, WhatsApp, navegador) |

### Persona 2: Superintendente de servicio / Cuerpo de ancianos (usuario consulta)

| Atributo    | Detalle                                                                               |
|-------------|---------------------------------------------------------------------------------------|
| Quién       | Otros ancianos del cuerpo que necesitan visibilidad sobre las asignaciones            |
| Necesidad   | Consultar quién tiene qué parte, ver historial de un publicador                       |
| Frustración | No tiene acceso fácil al Excel del coordinador                                        |
| Frecuencia  | Esporádica (1-2 veces al mes)                                                         |
| Habilidad   | Competencia técnica variable                                                          |

### Persona 3: Publicador (usuario futuro — fuera de v1.0)

| Atributo    | Detalle                                                                               |
|-------------|---------------------------------------------------------------------------------------|
| Quién       | Cualquier miembro de la congregación con asignaciones                                 |
| Necesidad   | Ver sus propias asignaciones próximas y pasadas                                       |
| Frecuencia  | Semanal                                                                               |
| Nota        | Fuera del alcance de v1.0. Se contempla para v2.0 con notificaciones                 |

---

## 5. Alcance

### Incluido en v1.0

| Módulo                         | Descripción                                                                  |
|--------------------------------|------------------------------------------------------------------------------|
| Gestión de publicadores        | CRUD con roles, sexo, estados (activo/ausente/restringido), skipAssignment, 3 flags de habilitación, observaciones |
| Esquema semanal VMC            | Carga de semanas con partes dinámicas (SMM variable)                         |
| Motor de asignación automática | Generación de asignaciones respetando elegibilidad + rotación equitativa     |
| Ajuste manual                  | Override de cualquier asignación con dropdown de candidatos elegibles         |
| Historial de asignaciones      | Consulta por publicador, parte, rango de fechas                              |
| Vista de carga                 | Frecuencia de asignaciones por publicador y tipo de parte                    |
| Exportación S-140              | Programa semanal en formato oficial para impresión                           |
| Exportación S-89               | Tarjetas de asignación individuales para impresión                           |
| Gestión de acomodadores/mic.   | Rotación de portería, acomodadores y micrófonos (entre semana + fin de sem.) |
| Reunión de fin de semana       | Presidente, lector Atalaya, oraciones, discurso público (texto libre: tema + orador) |
| Migración de datos             | Pre-carga manual de publicadores + match con Excel para importar historial   |
| Backup y restauración          | Descarga y subida manual del archivo SQLite desde panel admin                |
| Internacionalización           | Soporte Español (es) + Inglés (en) desde el inicio con next-intl            |

### Excluido de v1.0

| Funcionalidad                       | Fase prevista | Motivo de exclusión                                      |
|-------------------------------------|---------------|----------------------------------------------------------|
| Notificaciones (email / WhatsApp)   | v2.0          | Requiere integración externa; no es crítico para MVP     |
| Soporte multi-congregación          | v2.0          | Complejidad de aislamiento de datos y autenticación      |
| Portal de publicadores              | v2.0          | Requiere autenticación por publicador                    |
| Gestión de grupos de servicio       | Futuro        | Fuera del dominio principal                              |
| Integración con API de jw.org       | Futuro        | No existe API pública documentada                        |
| Lectura automática de la Guía       | Futuro        | Requiere scraping; alto riesgo de rotura                 |
| Modo offline / PWA                  | v1.1          | Deseable pero no bloqueante para MVP                     |

---

## 6. Requisitos Funcionales

### 6.1 Gestión de Publicadores (RF-PUB)

#### RF-PUB-01: CRUD de publicadores

El sistema debe permitir crear, leer, actualizar y eliminar (soft-delete) publicadores con los siguientes campos:

| Campo               | Tipo    | Requerido | Notas                                                  |
|---------------------|---------|-----------|--------------------------------------------------------|
| nombre              | string  | Sí        | Nombre completo del publicador                         |
| sexo                | enum    | Sí        | `MALE` / `FEMALE`                                      |
| rol                 | enum    | Sí        | `ELDER` / `MINISTERIAL_SERVANT` / `BAPTIZED_PUBLISHER` / `UNBAPTIZED_PUBLISHER` |
| estado              | enum    | Sí        | `ACTIVE` / `ABSENT` / `RESTRICTED` / `INACTIVE`. Default: `ACTIVE` |
| fechaFinAusencia    | date    | No        | Solo aplica si estado = `ABSENT`. Si tiene fecha, se reactiva automáticamente al llegar. Si es null, requiere cambio manual. |
| habilitadoVMC       | boolean | Sí        | Controla elegibilidad para partes de la reunión VMC    |
| habilitadoAcomodador| boolean | Sí        | Controla elegibilidad para portería y acomodador       |
| habilitadoMicrofono | boolean | Sí        | Controla elegibilidad para micrófonos                  |
| skipAssignment      | boolean | Sí        | Default `false`. Cuando está activo, excluye al publicador de la auto-asignación. Cubre restricciones o situaciones especiales. |
| observaciones       | text    | No        | Notas libres (viajes, enfermedades, limitaciones). Solo advierten, NO bloquean asignaciones. |

**Restricciones de rol por sexo:**
- Hombres: `ELDER`, `MINISTERIAL_SERVANT`, `BAPTIZED_PUBLISHER`, `UNBAPTIZED_PUBLISHER`
- Mujeres: `BAPTIZED_PUBLISHER`, `UNBAPTIZED_PUBLISHER`

**Derivación:**
- `bautizado` se deriva del rol: `ELDER`, `MINISTERIAL_SERVANT` y `BAPTIZED_PUBLISHER` → bautizado = true

#### RF-PUB-02: Listado con filtros

- Filtrar por sexo, rol, estado de habilitación (cualquiera de los 3 flags)
- Búsqueda por nombre
- Ordenación por nombre, última asignación, cantidad de asignaciones

#### RF-PUB-03: Vista de historial por publicador

- Desde el perfil de un publicador, ver todas sus asignaciones pasadas
- Filtrable por tipo de parte y rango de fechas

#### RF-PUB-04: Vista de carga

- Tabla que muestre cuántas veces cada publicador ha tenido cada tipo de parte en los últimos N meses (N configurable, default 3)
- Indicador visual de publicadores con baja o alta carga relativa

#### RF-PUB-05: Soft-delete

- Los publicadores eliminados no se borran físicamente (el historial los referencia)
- Se marcan como `INACTIVE` y dejan de aparecer en las listas de elegibles
- Posibilidad de reactivar

#### RF-PUB-06: Estados temporales del publicador

El publicador tiene un campo `estado` con los siguientes valores:

| Estado       | Significado                                                                                          |
|--------------|------------------------------------------------------------------------------------------------------|
| `ACTIVE`     | Estado normal. Elegible para asignaciones según sus flags de habilitación.                            |
| `ABSENT`     | Ausente temporalmente (viaje, enfermedad). Con fecha límite opcional (`fechaFinAusencia`). Si tiene fecha, se reactiva automáticamente al llegar. Si no tiene fecha, requiere cambio manual. No aparece en listas de elegibles. |
| `RESTRICTED` | Restringido. Requiere cambio manual para reactivar. No tiene fecha límite. No aparece en listas de elegibles. |
| `INACTIVE`   | Soft-delete. El publicador sigue existiendo en el historial pero no aparece en ninguna lista activa.  |

**Nota**: `ABSENT` y `RESTRICTED` son DISTINTOS del soft-delete (`INACTIVE`). El publicador sigue existiendo y visible en listados de publicadores, pero queda excluido de la asignación automática.

#### RF-PUB-07: Exclusión de auto-asignación (skipAssignment)

- El campo `skipAssignment` (booleano, default `false`) excluye al publicador del motor de auto-asignación cuando está activo.
- Es independiente de los estados temporales. Un publicador puede estar `ACTIVE` pero con `skipAssignment = true` si tiene restricciones especiales.
- Las observaciones del publicador complementan este flag como contexto (texto libre) pero NO bloquean asignaciones por sí solas.

---

### 6.2 Gestión del Esquema Semanal (RF-WEEK)

#### RF-WEEK-01: Crear semana de reunión

El coordinador crea una semana de reunión con:

| Campo                | Tipo   | Requerido | Notas                                          |
|----------------------|--------|-----------|-------------------------------------------------|
| fechaInicio          | date   | Sí        | Lunes de la semana                              |
| fechaFin             | date   | Sí        | Domingo de la semana                            |
| lecturaSemanal       | string | Sí        | Capítulos bíblicos de la semana (ej: "Gén 1-3")|
| cancionApertura      | int    | Sí        | Número de canción según la Guía                 |
| cancionIntermedia    | int    | Sí        | Canción entre SMM y NVC                         |
| cancionCierre        | int    | Sí        | Número de canción de cierre                     |
| salaAuxiliarActiva   | boolean| Sí        | Si la semana tiene sala auxiliar activa          |

#### RF-WEEK-02: Partes fijas de la semana

Las siguientes partes se generan automáticamente al crear la semana:

**Apertura:**
- Presidente de la reunión (Anciano habilitado)
- Oración inicial (Anciano o Ministerial habilitado)

**Tesoros de la Biblia:**
1. Discurso de Tesoros (10 min) — Anciano o Ministerial habilitado
2. Busquemos perlas escondidas (10 min) — Anciano o Ministerial habilitado
3. Lectura de la Biblia (4 min) — Cualquier hombre habilitado — sala principal + auxiliar (personas distintas)

**Nuestra Vida Cristiana:**
- Estudio bíblico de congregación — Conductor (Anciano/Ministerial) + Lector (Anciano/Ministerial/Pub. hombre bautizado)

**Cierre:**
- Oración de conclusión (Anciano/Ministerial/Pub. hombre bautizado)

#### RF-WEEK-03: Partes dinámicas — Seamos Mejores Maestros (SMM)

- El coordinador define cuántas partes SMM tiene la semana (3 a 7)
- Para cada parte SMM, se especifica:
  - Título/tema de la parte
  - Tipo: `DEMOSTRACIÓN` o `DISCURSO`
  - Duración en minutos
  - Si requiere ayudante (las demostraciones sí, los discursos generalmente no)
- Cada parte SMM se duplica para sala principal y sala auxiliar (si está activa)
- El Encargado de la Escuela es una asignación separada (Anciano habilitado)

#### RF-WEEK-04: Partes dinámicas — Nuestra Vida Cristiana (NVC)

- El coordinador define cuántas partes NVC adicionales tiene la semana (1 o 2)
- Para cada parte NVC:
  - Título/tema
  - Duración en minutos
  - Elegibilidad: Anciano o Ministerial habilitado

#### RF-WEEK-05: Listado y navegación de semanas

- Vista de calendario o lista de semanas con estado (borrador, asignado, publicado)
- Navegación rápida entre semanas
- Posibilidad de duplicar una semana como base para la siguiente

#### RF-WEEK-06: Estados de la semana

| Estado     | Significado                                              |
|------------|----------------------------------------------------------|
| BORRADOR   | Esquema creado, sin asignaciones                         |
| ASIGNADO   | Asignaciones generadas (automática o manualmente)        |
| PUBLICADO  | Programa finalizado, listo para exportar                 |

---

### 6.3 Motor de Asignación Automática (RF-AUTO)

#### RF-AUTO-01: Reglas de elegibilidad

El motor debe respetar la siguiente matriz de elegibilidad. Los prerequisitos en TODOS los casos son:
- `habilitadoVMC = true`
- `estado = ACTIVE`
- `skipAssignment = false`

| Parte                           | Anciano | Ministerial | Pub. Hombre Bautizado | Pub. Hombre No Bautizado | Mujer (cualquier rol) |
|---------------------------------|---------|-------------|------------------------|-----------------------------|-----------------------|
| Presidente                      | ✓       | —           | —                      | —                           | —                     |
| Oración inicial                 | ✓       | ✓           | —                      | —                           | —                     |
| Tesoros 1 (discurso)            | ✓       | ✓           | —                      | —                           | —                     |
| Tesoros 2 (perlas escondidas)   | ✓       | ✓           | —                      | —                           | —                     |
| Lectura (sala principal)        | ✓       | ✓           | ✓                      | ✓                           | —                     |
| Encargado de escuela            | ✓       | —           | —                      | —                           | —                     |
| SMM titular (demostración)      | ✓       | ✓           | ✓                      | ✓                           | ✓                     |
| SMM titular (discurso)          | ✓       | ✓           | ✓                      | ✓                           | —                     |
| SMM ayudante                    | ✓       | ✓           | ✓                      | ✓                           | ✓                     |
| NVC (partes)                    | ✓       | ✓           | —                      | —                           | —                     |
| Estudio bíblico — Conductor     | ✓       | ✓           | —                      | —                           | —                     |
| Estudio bíblico — Lector        | ✓       | ✓           | ✓                      | —                           | —                     |
| Oración de conclusión           | ✓       | ✓           | ✓                      | —                           | —                     |

#### RF-AUTO-02: Criterios de selección (en orden de prioridad)

1. **Habilitación**: `habilitadoVMC = true`, `estado = ACTIVE`, `skipAssignment = false`
2. **Elegibilidad**: cumple la matriz de elegibilidad para la parte
3. **Sin duplicados**: no tiene otra parte asignada en la misma reunión (1 parte por persona por reunión)
4. **Rotación equitativa**: prioridad al publicador con la fecha de última asignación más antigua para ese tipo de parte
5. **Desempate**: selección aleatoria entre los elegibles empatados

#### RF-AUTO-03: Restricciones adicionales

- Una persona NO puede ser titular Y ayudante en la misma reunión
- El presidente NO debe tener ninguna otra parte en la misma reunión
- El encargado de la escuela NO debe tener otra parte adicional
- La sala auxiliar requiere personas COMPLETAMENTE distintas a las de sala principal para la misma parte
- El sistema debe excluir de la auto-asignación a publicadores con `skipAssignment = true` o `estado != ACTIVE`
- Las observaciones del publicador son solo informativas (advierten al coordinador, NO bloquean)

#### RF-AUTO-04: Generación de asignaciones

- Botón "Generar asignaciones" que llena todos los slots vacíos según las reglas
- El sistema indica claramente si no encontró candidato válido para alguna parte (alerta visual)
- Se puede ejecutar parcialmente: solo slots vacíos (regeneración parcial)
- Se puede ejecutar completamente: reemplazar todas las asignaciones existentes (regeneración total, con confirmación)

#### RF-AUTO-05: Orden de asignación

El motor debe asignar las partes en un orden que maximice la calidad del resultado:

1. **Presidente** (pool más restrictivo: solo ancianos)
2. **Encargado de escuela** (solo ancianos, excluye al presidente)
3. **Oración inicial** (ancianos/ministeriales, excluye presidente)
4. **Tesoros 1 y 2** (ancianos/ministeriales)
5. **NVC partes** (ancianos/ministeriales)
6. **Estudio bíblico — Conductor** (ancianos/ministeriales)
7. **Estudio bíblico — Lector** (pool más amplio)
8. **Lectura de la Biblia** — sala principal y auxiliar (cualquier hombre)
9. **SMM titulares** — sala principal y auxiliar (pool más amplio, incluye mujeres)
10. **SMM ayudantes** — sala principal y auxiliar (pool más amplio)
11. **Oración de conclusión** (pool amplio, al final para maximizar candidatos disponibles)

---

### 6.4 Ajuste Manual (RF-MANUAL)

#### RF-MANUAL-01: Override de asignaciones

- El coordinador puede cambiar cualquier asignación haciendo clic en el nombre asignado
- Se abre un dropdown/selector que muestra SOLO candidatos elegibles para esa parte
- Los candidatos se ordenan por última fecha de asignación (más antiguo primero)

#### RF-MANUAL-02: Indicadores visuales

- Si un candidato ya tiene otra parte asignada en la misma semana, se indica visualmente (ej: icono de advertencia)
- Si el candidato seleccionado viola una restricción blanda, se muestra una advertencia pero se permite el override
- Si viola una restricción dura (ej: mujer como presidente), NO se permite

#### RF-MANUAL-03: Restricciones duras vs. blandas

| Tipo   | Restricción                                                           | Comportamiento          |
|--------|-----------------------------------------------------------------------|-------------------------|
| Dura   | Elegibilidad por rol/sexo según la matriz                             | Bloqueada — no permite  |
| Dura   | Presidente o encargado de escuela con doble asignación                | Bloqueada — no permite  |
| Blanda | Misma persona en sala principal y auxiliar para la misma parte        | Advertencia — permite   |
| Blanda | Publicador con otra asignación en la misma reunión (no pres./escuela)| Advertencia — permite   |
| Blanda | Publicador con observación de indisponibilidad o nota relevante       | Advertencia — permite   |
| Blanda | Publicador con `skipAssignment = true` (en override manual)           | Advertencia — permite   |

---

### 6.5 Historial y Analíticas (RF-HIST)

#### RF-HIST-01: Tabla de historial completo

- Tabla con todas las asignaciones pasadas (equivalente a la hoja `Historico Asignaciones` del Excel)
- Columnas: fecha, semana, parte, sección, sala, titular, ayudante
- Paginación para manejar los 10.000+ registros

#### RF-HIST-02: Filtros del historial

- Por publicador (búsqueda por nombre)
- Por tipo de parte
- Por sección (Tesoros, SMM, NVC, etc.)
- Por rango de fechas

#### RF-HIST-03: Métricas de distribución

- Vista que muestre la distribución de asignaciones por publicador en un período
- Gráfico de barras o tabla con: publicador, total de asignaciones, desglose por tipo
- Indicador de publicadores sub-utilizados (habilitados pero sin asignaciones recientes)

#### RF-HIST-04: Última asignación por publicador

- Para cada publicador, mostrar cuándo fue su última asignación y de qué tipo
- Esto alimenta directamente al motor de asignación automática

---

### 6.6 Exportación PDF (RF-PDF)

#### RF-PDF-01: Programa S-140

- Generar el programa semanal en formato SIMILAR al S-140 oficial (no réplica exacta, sino formato propio inspirado en la estructura oficial)
- Incluye: fecha, lectura semanal, canciones, todas las partes con nombre del asignado, horarios
- Formato: A4, listo para imprimir
- Debe poder generar para una semana individual o para un rango de semanas (ej: mes completo)

#### RF-PDF-02: Tarjetas S-89

- Generar tarjetas individuales de asignación (formato S-89)
- Incluye: nombre del asignado, parte, fecha, sala, nombre del ayudante (si aplica)
- Formato: tamaño tarjeta, varias por página para optimizar impresión
- Se generan por semana (todas las tarjetas de una semana)

#### RF-PDF-03: Vista de impresión

- Versión HTML del programa (sin controles de la UI) para impresión directa desde el navegador
- Alternativa al PDF para usuarios que prefieran imprimir directamente

---

### 6.7 Migración de Datos (RF-MIG)

#### RF-MIG-01: Importar publicadores (pre-migración manual + match automático)

**Decisión**: Enfoque de pre-migración manual.

1. **Paso 1 — Carga manual previa**: Antes de migrar datos del Excel, se cargan los publicadores con nombre, sexo y rol MANUALMENTE. Esto elimina el problema de inferencia de roles.
2. **Paso 2 — Match con Excel**: Se ejecuta la migración del Excel (`Inscritos`) haciendo match por nombre con los publicadores ya cargados para importar los flags de habilitación y datos adicionales.
3. **Paso 3 — Importar historial**: Una vez que los publicadores existen con sus roles correctos, se importa el historial de asignaciones vinculando por nombre.

- Validar integridad: reportar publicadores del Excel que no matchean con ningún publicador cargado
- Reporte de migración: cuántos matchearon, cuántos quedan sin match, cuántos requieren revisión

#### RF-MIG-02: Importar historial de asignaciones

- Leer la hoja `Historico Asignaciones` (~10.144 filas)
- Mapear a la tabla `AssignmentHistory`
- Preservar las fechas originales para que el motor de rotación tenga datos desde el día 1
- Validar integridad: que los publicadores referenciados existan

#### RF-MIG-03: Importar esquemas semanales

- Leer la hoja `Variables` (~924 filas)
- Mapear a `MeetingWeek` + `MeetingPart`
- Reconstruir la estructura de partes por semana

#### RF-MIG-04: Herramienta de migración

- Script CLI o página de administración que ejecute la migración
- Debe ser idempotente (ejecutar múltiples veces sin duplicar datos)
- Reporte de migración: cuántos registros importados, cuántos fallidos, cuántos requieren revisión

---

### 6.8 Gestión de Acomodadores y Micrófonos (RF-ATT)

#### RF-ATT-01: Roles de servicio

| Rol                 | Cantidad por reunión | Flag requerido         |
|---------------------|----------------------|------------------------|
| Portería            | 1                    | `habilitadoAcomodador` |
| Acomodador          | 1                    | `habilitadoAcomodador` |
| Micrófono 1         | 1                    | `habilitadoMicrofono`  |
| Micrófono 2         | 1                    | `habilitadoMicrofono`  |

#### RF-ATT-02: Elegibilidad

- Sexo: masculino obligatorio
- Rol: Anciano, Ministerial o Publicador bautizado (NO publicadores no bautizados)
- Flag correspondiente activo (`habilitadoAcomodador` o `habilitadoMicrofono`)

#### RF-ATT-03: Rotación

- Pool unificado de elegibles (ancianos, ministeriales y publicadores bautizados se mezclan)
- Mismo criterio de balanceo que VMC: prioridad al que tenga la fecha de última asignación más antigua
- Rotación continua a través de AMBAS reuniones (entre semana + fin de semana)
- Historial separado por tipo de rol (portería, acomodador y micrófonos rotan independientemente)

#### RF-ATT-04: Restricción blanda con VMC

- El sistema debe INTENTAR no asignar a la misma persona como acomodador/micrófono Y con una parte VMC en la misma semana
- Esto es una sugerencia, NO una restricción dura — el coordinador puede overridear

#### RF-ATT-05: Reunión de fin de semana

| Parte            | Elegibilidad                                             | Notas                                                    |
|------------------|----------------------------------------------------------|----------------------------------------------------------|
| Discurso público | Texto libre: nombre de la parte (string) + nombre del orador (string) | Ambos campos de texto libre. No se crea entidad separada de "orador". No entra en rotación automática. |
| Presidente       | Anciano con `habilitadoVMC`                              | Misma elegibilidad que presidente VMC                    |
| Oración inicial  | Anciano o Ministerial con `habilitadoVMC`                | La da el presidente                                      |
| Lector Atalaya   | Anciano/Ministerial/Pub. hombre bautizado con `habilitadoVMC` |                                                    |
| Oración final    | Anciano/Ministerial/Pub. hombre bautizado con `habilitadoVMC` |                                                    |
| Portería         | `habilitadoAcomodador = true`                            | Pool compartido con entre semana                         |
| Acomodador       | `habilitadoAcomodador = true`                            | Pool compartido con entre semana                         |
| Micrófono x2     | `habilitadoMicrofono = true`                             | Pool compartido con entre semana                         |

---

## 7. Requisitos No Funcionales

### 7.1 Rendimiento

| Requisito                                           | Objetivo           |
|-----------------------------------------------------|--------------------|
| Tiempo de carga de la página principal              | < 2 segundos       |
| Tiempo de generación automática de asignaciones     | < 3 segundos       |
| Tiempo de generación de PDF (S-140, 1 semana)       | < 5 segundos       |
| Tiempo de generación de PDF (S-89, 1 semana)        | < 5 segundos       |
| Soporte de historial consultable                    | > 10.000 registros |

### 7.2 Disponibilidad y Hosting

- Aplicación web accesible desde navegador (desktop y móvil)
- **Desarrollo**: local
- **Deploy**: Vercel (tier gratuito)
- Base de datos: SQLite (archivo local, sin servidor de DB separado)
- Uptime esperado: no crítico (uso interno de una congregación, no es 24/7)

### 7.3 Seguridad

- **Autenticación**: Un solo usuario admin con contraseña simple. Sin multi-usuario por ahora (multi-usuario contemplado para v2.0).
- No se manejan datos sensibles más allá de nombres de publicadores
- HTTPS obligatorio en producción

### 7.4 Accesibilidad

- Interfaz responsive (desktop first, funcional en tablet/móvil)
- Contraste adecuado para lectura
- Navegación por teclado para las funciones principales

### 7.5 Mantenibilidad

- Código TypeScript estricto (`strict: true`)
- Arquitectura limpia: separación clara entre UI, lógica de negocio y acceso a datos
- Prisma como ORM con migraciones versionadas
- Tests unitarios para el motor de asignación (lógica de negocio crítica)

### 7.6 Compatibilidad

- Navegadores: Chrome, Firefox, Edge (últimas 2 versiones)
- No se requiere soporte para IE11

### 7.7 Internacionalización (i18n)

- **Idiomas soportados desde v1.0**: Español (es) e Inglés (en)
- Implementar internacionalización desde el inicio usando `next-intl` o solución similar integrada con Next.js
- Todos los textos de la UI deben estar externalizados en archivos de traducción
- El idioma por defecto es Español

### 7.8 Backup y Restauración

- **NO automático**. El admin tiene control manual completo.
- Implementar dos funcionalidades:
  - **Endpoint/botón para DESCARGAR** un dump del archivo SQLite (backup manual)
  - **Endpoint/botón para SUBIR/RESTAURAR** un dump del archivo SQLite (restauración manual)
- Accesible desde el panel de administración

---

## 8. Modelo de Datos

### 8.1 Diagrama de entidades (alto nivel)

```
┌──────────────────┐     ┌───────────────┐     ┌──────────────┐
│  Publisher        │────<│  Assignment   │>────│  MeetingPart │
│                  │     │              │     │              │
│ id               │     │ id           │     │ id           │
│ nombre           │     │ publisherId  │     │ meetingWeekId│
│ sexo             │     │ helperId     │     │ seccion      │
│ rol              │     │ meetingPartId│     │ tipo         │
│ estado           │     │ room         │     │ orden        │
│ fechaFinAusencia │     └───────────────┘     │ duracion     │
│ habVMC           │                           │ sala         │
│ habAcomodador    │     ┌───────────────┐     │ reqAyudante  │
│ habMicrofono     │     │ MeetingWeek   │     └──────────────┘
│ skipAssignment   │     │              │           │
│ observaciones    │     │ id           │───────────┘
└──────────────────┘     │ fechaInicio  │
       │                 │ fechaFin     │
       │                 │ lectura      │
       │                 │ canciones    │
       │                 │ salaAuxActiva│
       │                 │ estado       │
       │                 └───────────────┘
       │
       │         ┌────────────────────┐     ┌─────────────────────┐
       │────────<│ AttendantAssignment│>────│  WeekendMeeting     │
                 │                    │     │                     │
                 │ id                 │     │ id                  │
                 │ publisherId       │     │ fecha               │
                 │ meetingType       │     │ discursoTema        │
                 │ attendantRole     │     │ discursoOrador      │
                 │ fecha             │     │ presidenteId        │
                 └────────────────────┘     │ lectorId            │
                                            │ oracionInicialId    │
                                            │ oracionFinalId      │
                                            └─────────────────────┘
```

### 8.2 Entidades principales

| Entidad               | Descripción                                                                                         |
|-----------------------|-----------------------------------------------------------------------------------------------------|
| `Publisher`           | Publicador con datos personales, rol, estado (`ACTIVE`/`ABSENT`/`RESTRICTED`/`INACTIVE`), `skipAssignment`, `fechaFinAusencia` y 3 flags de habilitación |
| `MeetingWeek`         | Semana de reunión VMC: fechas, lectura bíblica, canciones, estado                                   |
| `MeetingPart`         | Parte específica dentro de una semana: sección, tipo, orden, duración, sala, si requiere ayudante   |
| `Assignment`          | Relación publicador ↔ parte: titular + ayudante opcional                                             |
| `AssignmentHistory`   | Registro histórico desnormalizado para consultas rápidas (migración + acumulación)                   |
| `WeekendMeeting`      | Reunión de fin de semana: discurso público (tema + orador como texto libre), presidente, lector, oraciones |
| `AttendantAssignment` | Asignación de portería/acomodador/micrófono por reunión                                              |

### 8.3 Enums

| Enum              | Valores                                                                       |
|-------------------|-------------------------------------------------------------------------------|
| `Gender`          | `MALE` \| `FEMALE`                                                            |
| `Role`            | `ELDER` \| `MINISTERIAL_SERVANT` \| `BAPTIZED_PUBLISHER` \| `UNBAPTIZED_PUBLISHER` |
| `PublisherStatus` | `ACTIVE` \| `ABSENT` \| `RESTRICTED` \| `INACTIVE`                           |
| `Section`         | `OPENING` \| `TREASURES` \| `MINISTRY_SCHOOL` \| `CHRISTIAN_LIFE` \| `CLOSING`|
| `PartType`        | `SPEECH` \| `DEMONSTRATION` \| `READING` \| `DISCUSSION` \| `STUDY` \| `PRAYER` \| `SONG` |
| `Room`            | `MAIN` \| `AUXILIARY_1`                                                        |
| `WeekStatus`      | `DRAFT` \| `ASSIGNED` \| `PUBLISHED`                                          |
| `MeetingType`     | `MIDWEEK` \| `WEEKEND`                                                         |
| `AttendantRole`   | `DOORMAN` \| `ATTENDANT` \| `MICROPHONE_1` \| `MICROPHONE_2`                  |

---

## 9. Plan de Entrega por Fases

### Fase 1 — v1.0: MVP Funcional (estimado: 8-10 semanas)

**Objetivo**: Reemplazar el Excel para la programación semanal VMC.

| Sprint | Entregable                                                    | Módulos                     |
|--------|---------------------------------------------------------------|-----------------------------|
| 1-2    | Infraestructura + Publicadores                                | RF-PUB-01 a RF-PUB-05      |
| 3-4    | Esquema semanal + Motor de asignación automática              | RF-WEEK, RF-AUTO            |
| 5-6    | Ajuste manual + Historial                                     | RF-MANUAL, RF-HIST          |
| 7-8    | Exportación PDF (S-140 + S-89)                                | RF-PDF                      |
| 8-9    | Acomodadores/micrófonos + Reunión fin de semana               | RF-ATT                      |
| 9-10   | Migración de datos + QA + Estabilización                      | RF-MIG + bugs               |

**Criterio de aceptación**: El coordinador puede programar una semana completa (VMC + fin de semana + acomodadores) y exportar el S-140 y las tarjetas S-89 en menos de 15 minutos.

### Fase 2 — v1.1: Mejoras de UX y Estabilidad (estimado: 3-4 semanas)

| Funcionalidad                                    | Descripción                                                  |
|--------------------------------------------------|--------------------------------------------------------------|
| Modo offline / PWA                               | Funcionalidad básica sin conexión                            |
| Programación multi-semana                        | Generar asignaciones para 4 semanas de un tirón              |
| Plantillas de semana                             | Guardar y reutilizar configuraciones de partes frecuentes    |
| Mejoras de UX basadas en feedback                | Iteraciones sobre el flujo tras uso real                     |
| Dashboard resumen                                | Vista rápida del estado del mes (semanas pendientes, publicadores sin asignar) |

### Fase 3 — v2.0: Comunicación y Multi-usuario (estimado: 6-8 semanas)

| Funcionalidad                                    | Descripción                                                  |
|--------------------------------------------------|--------------------------------------------------------------|
| Notificaciones por email / WhatsApp              | Enviar asignaciones automáticamente a cada publicador        |
| Portal de publicadores                           | Cada publicador puede ver sus asignaciones (solo lectura)    |
| Multi-usuario con roles                          | Coordinador (edita) vs. Consulta (solo lectura)              |
| Soporte multi-congregación                       | Aislamiento de datos entre congregaciones                    |
| Confirmación de asignaciones                     | El publicador confirma o rechaza su asignación               |

---

## 10. Preguntas Abiertas

Todas las decisiones han sido resueltas:

| #  | Pregunta                                                                                                             | Impacto                      | Estado     | Resolución |
|----|----------------------------------------------------------------------------------------------------------------------|------------------------------|------------|------------|
| Q1 | **Estrategia de migración de roles**: ¿Opción (a) todo manual, (b) inferir del historial, o (c) híbrida?             | RF-MIG-01                    | **Resuelto** | **Pre-migración manual**: se cargan publicadores con nombre, sexo y rol MANUALMENTE primero. Después se hace match con el Excel para importar historial. Elimina el problema de inferencia. |
| Q2 | **Autenticación**: ¿Un solo usuario admin con contraseña, o login por anciano con roles diferenciados?                | Seguridad, multi-usuario     | **Resuelto** | **Single admin con contraseña simple**. Sin multi-usuario por ahora (contemplado para v2.0). |
| Q3 | **Hosting**: ¿Vercel (gratis tier), VPS propio, o computadora local del coordinador?                                  | Arquitectura de deploy       | **Resuelto** | **Desarrollo local, deploy en Vercel**. |
| Q4 | **Observaciones como bloqueo**: ¿Las observaciones del publicador deben bloquear la auto-asignación o solo advertir?  | RF-AUTO-03                   | **Resuelto** | **Solo ADVIERTEN, no bloquean**. Se agrega booleano `skipAssignment` en el modelo Publisher para excluir de auto-asignación cuando está activo. |
| Q5 | **Sala auxiliar fija o variable**: ¿La sala auxiliar siempre está activa o se activa/desactiva por semana?             | RF-WEEK-01                   | **Resuelto** | Variable por semana. |
| Q6 | **Formato exacto del S-140**: ¿Se necesita una réplica exacta del formulario oficial o basta con un formato similar?  | RF-PDF-01                    | **Resuelto** | **Formato SIMILAR al oficial**, no réplica exacta. |
| Q7 | **Backup de datos**: ¿Se necesita backup automático del archivo SQLite? ¿Con qué frecuencia?                          | Operaciones                  | **Resuelto** | **NO automático**. Endpoint/botón para DESCARGAR dump + Endpoint/botón para SUBIR/restaurar dump. Control manual del admin. |
| Q8 | **DB PostgreSQL vs SQLite**: El doc de requerimientos sugiere PostgreSQL, pero se confirmó SQLite. ¿Confirmar?        | Arquitectura                 | **Resuelto** | SQLite confirmado. |
| Q9 | **Publicador inactivo temporal**: ¿Se necesita un estado "inactivo temporal" (viaje largo, enfermedad) distinto del soft-delete? | RF-PUB-01            | **Resuelto** | **Sí, dos estados nuevos**: `ABSENT` (con fecha límite opcional, reactivación automática o manual) y `RESTRICTED` (requiere cambio manual). Distintos de `INACTIVE` (soft-delete). |
| Q10| **Discurso público del fin de semana**: ¿Solo texto libre o también se quiere asociar a un orador externo con nombre? | RF-ATT-05                    | **Resuelto** | **Texto libre** tanto para el nombre de la parte como para el orador. No se crea entidad separada de "orador". |
| Q11| **Idioma de la interfaz**: ¿Solo español o se contempla internacionalización futura?                                  | UI                           | **Resuelto** | **i18n desde el inicio**. Español (es) + Inglés (en). Usar `next-intl` o solución similar integrada con Next.js. |

---

## 11. Glosario

| Término                        | Definición                                                                                                      |
|--------------------------------|-----------------------------------------------------------------------------------------------------------------|
| **VMC**                        | Vida y Ministerio Cristianos — reunión semanal de entre semana                                                  |
| **SMM**                        | Seamos Mejores Maestros — sección de la reunión VMC con demostraciones y discursos de estudiantes               |
| **NVC**                        | Nuestra Vida Cristiana — tercera sección de la reunión VMC                                                      |
| **S-140**                      | Formulario oficial de la organización: programa semanal de la reunión VMC                                       |
| **S-89**                       | Formulario oficial: tarjeta de asignación individual entregada al publicador                                    |
| **Guía de Actividades**        | Publicación mensual de jw.org que define las partes de cada semana                                              |
| **Anciano (Elder)**            | Miembro del cuerpo de ancianos. Máximo nivel de privilegio en asignaciones.                                     |
| **Siervo Ministerial**         | Ministerial Servant. Segundo nivel de privilegio.                                                                |
| **Publicador**                 | Miembro de la congregación que participa en la predicación                                                       |
| **Sala principal**             | Salón principal donde se lleva a cabo la reunión                                                                 |
| **Sala auxiliar**              | Aula secundaria para demostraciones paralelas de la sección SMM                                                  |
| **Encargado de la escuela**    | Anciano que preside la sección SMM y evalúa las demostraciones                                                   |
| **Presidente de la reunión**   | Anciano que modera toda la reunión VMC                                                                           |
| **Titular**                    | Persona principal que presenta una parte/demostración                                                            |
| **Ayudante**                   | Persona que acompaña al titular en una demostración (hace el papel de ama de casa, vecino, etc.)                |
| **Rotación equitativa**        | Principio de distribución donde se prioriza al publicador con la asignación más antigua                         |
| **Tesoros de la Biblia**       | Primera sección de la reunión VMC                                                                                |
| **Perlas escondidas**          | Parte de la sección Tesoros donde se analizan gemas espirituales de la lectura bíblica                          |
| **Estudio bíblico de congregación** | Parte final de la reunión VMC donde se estudia una publicación con preguntas y respuestas                  |
| **Acomodador**                 | Persona encargada de acomodar a los asistentes y mantener el orden en el salón                                  |
| **Portería**                   | Persona encargada de recibir a los asistentes en la entrada del salón                                            |
| **Reunión de fin de semana**   | Segunda reunión semanal: incluye discurso público y estudio de La Atalaya                                       |
| **La Atalaya**                 | Publicación de estudio que se analiza en la reunión de fin de semana                                             |

---

## Apéndice A: Datos de Migración (Excel)

| Hoja del Excel           | Filas aprox. | Entidad destino                  | Notas                                     |
|--------------------------|--------------|----------------------------------|-------------------------------------------|
| Inscritos                | ~986         | `Publisher`                      | Match con publicadores pre-cargados manualmente (nombre, sexo, rol) |
| Variables                | ~924         | `MeetingWeek` + `MeetingPart`   | Esquemas semanales con partes y canciones  |
| Historico Asignaciones   | ~10.144      | `AssignmentHistory`              | Historial completo desde abril 2025        |
| S-89-S                   | —            | Plantilla de exportación         | Referencia para diseño del PDF S-89        |
| S-140_S                  | —            | Plantilla de exportación         | Referencia para diseño del PDF S-140       |

---

*Documento generado el 16 de marzo de 2026. Versión PRD 1.1 — Todas las preguntas abiertas resueltas.*
