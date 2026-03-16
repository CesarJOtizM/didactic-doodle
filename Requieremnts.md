**PROGRAMADOR VMC**

Vida y Ministerio Cristianos

Documento de Requerimientos v1.0

| **Proyecto** | Programador VMC                        |
| ------------ | -------------------------------------- |
| **Tipo**     | Aplicación web - una sola congregación |
| **Versión**  | 1.0 - Requerimiento base               |
| **Fecha**    | Marzo 2026                             |

# **1\. Descripción general**

El Programador VMC es una aplicación web para gestionar la asignación de partes en la reunión semanal de Vida y Ministerio Cristianos. Reemplaza el flujo actual basado en un Google Sheets (Programacion_VMC.xlsx) con una solución estructurada que combina asignación automática con ajuste manual, historial de asignaciones y exportación del programa oficial.

La reunión tiene estructura fija de tres secciones (Tesoros de la Biblia, Seamos Mejores Maestros, Nuestra Vida Cristiana) pero el número exacto de partes dentro de SMM puede variar semana a semana según la Guía de Actividades publicada por jw.org.

# **2\. Alcance del sistema**

**Incluido en v1.0**

- Gestión de publicadores (CRUD con roles y 3 flags de habilitación independientes: VMC, acomodador, micrófono)
- Carga y gestión del esquema semanal desde la Guía de Actividades
- Motor de asignación automática con reglas de elegibilidad
- Ajuste manual sobre asignaciones generadas
- Historial completo de asignaciones por persona y por reunión
- Vista de disponibilidad / carga de asignaciones por publicador
- Exportación del programa (formato S-140 y tarjetas S-89)

**Fuera de alcance v1.0**

- Notificaciones automáticas (email / WhatsApp) - v2.0
- Soporte multi-congregación - v2.0
- Gestión de grupos de servicio
- Integración directa con API de jw.org

# **3\. Modelo de publicadores**

## **3.1 Roles masculinos**

| **Rol**                 | **Descripción**                | **Código interno**   |
| ----------------------- | ------------------------------ | -------------------- |
| Anciano                 | Miembro del cuerpo de ancianos | ELDER                |
| Ministerial             | Siervo ministerial             | MINISTERIAL_SERVANT  |
| Publicador bautizado    | Hombre bautizado, no designado | BAPTIZED_PUBLISHER   |
| Publicador no bautizado | Hombre no bautizado            | UNBAPTIZED_PUBLISHER |

## **3.2 Roles femeninos**

| **Rol**                  | **Descripción**    | **Código interno**   |
| ------------------------ | ------------------ | -------------------- |
| Publicadora bautizada    | Mujer bautizada    | BAPTIZED_PUBLISHER   |
| Publicadora no bautizada | Mujer no bautizada | UNBAPTIZED_PUBLISHER |

## **3.3 Campos del publicador**

| **Campo**     | **Tipo** | **Requerido** | **Notas**                                 |
| ------------- | -------- | ------------- | ----------------------------------------- |
| nombre        | string   | Sí            | Nombre completo                           |
| sexo          | enum     | Sí            | MALE / FEMALE                             |
| rol           | enum     | Sí            | Ver tabla 3.1 / 3.2                       |
| habilitado    | boolean  | Sí            | Solo los habilitados reciben partes       |
| bautizado     | boolean  | Sí            | Derivado del rol                          |
| observaciones | text     | No            | Notas libres (enfermedades, viajes, etc.) |

# **4\. Estructura de la reunión**

Cada reunión semanal sigue esta estructura fija. El número de partes en la sección SMM puede variar (generalmente 3 o 4, ocasionalmente hasta 7 según la guía).

**Apertura**

| **Ord.** | **Parte**                | **Elegibilidad**                 | **Notas**              |
| -------- | ------------------------ | -------------------------------- | ---------------------- |
| -        | Canción de apertura      | N/A                              | Número fijo de la guía |
| -        | Oración inicial          | Anciano o Ministerial habilitado | La da el Presidente    |
| -        | Presidente de la reunión | Anciano habilitado               | Modera toda la reunión |

**Sección 1 - Tesoros de la Biblia**

| **Ord.** | **Parte**                             | **Elegibilidad**                 | **Notas**                                          |
| -------- | ------------------------------------- | -------------------------------- | -------------------------------------------------- |
| 1        | Discurso de Tesoros (10 min.)         | Anciano o Ministerial habilitado | Discurso preparado                                 |
| 2        | Busquemos perlas escondidas (10 min.) | Anciano o Ministerial habilitado | Conduce preguntas con el auditorio                 |
| 3        | Lectura de la Biblia (4 min.)         | Cualquier hombre habilitado      | Sala principal Y sala auxiliar (persona diferente) |

Nota: El encargado de la escuela (anciano habilitado) preside la sección SMM y evalúa las demostraciones.

**Sección 2 - Seamos Mejores Maestros**

| **Ord.** | **Parte**                       | **Elegibilidad**                                                                  | **Notas**                                      |
| -------- | ------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| -        | Encargado de la escuela         | Anciano habilitado                                                                | Preside la sección. Asignación separada.       |
| 4        | SMM 1 (demostración)            | Cualquier publicador habilitado                                                   | Titular + Ayudante. Sala principal y auxiliar. |
| 5        | SMM 2 (demostración)            | Cualquier publicador habilitado                                                   | Titular + Ayudante. Sala principal y auxiliar. |
| 6        | SMM 3 (demostración / discurso) | Si es discurso: solo hombre habilitado. Si es demostración: cualquier publicador. | Titular ± Ayudante. Sala principal y auxiliar. |
| 7\*      | SMM 4 (si aplica)               | Igual que SMM 3 según tipo                                                        | Opcional - solo existe en algunas semanas      |

\* Las partes SMM pueden variar entre 3 y 7 según la guía de la semana. El sistema debe adaptar dinámicamente el número de slots.

**Sección 3 - Nuestra Vida Cristiana**

| **Ord.** | **Parte**                          | **Elegibilidad**                                   | **Notas**                          |
| -------- | ---------------------------------- | -------------------------------------------------- | ---------------------------------- |
| 7/8      | NVC 1 (parte principal, 5-15 min.) | Anciano o Ministerial habilitado                   | Número varía según semana          |
| 8/9\*    | NVC 2 (si aplica, 5-10 min.)       | Anciano o Ministerial habilitado                   | Opcional - solo en algunas semanas |
| -        | Estudio bíblico - Conductor        | Anciano o Ministerial habilitado                   | Usualmente el presidente           |
| -        | Estudio bíblico - Lector           | Anciano, Ministerial o Publicador hombre bautizado |                                    |

**Cierre**

| **Ord.** | **Parte**             | **Elegibilidad**                                   | **Notas**              |
| -------- | --------------------- | -------------------------------------------------- | ---------------------- |
| -        | Canción de cierre     | N/A                                                | Número fijo de la guía |
| -        | Oración de conclusión | Anciano, Ministerial o Publicador hombre bautizado |                        |

# **5\. Reglas de elegibilidad por parte**

Resumen consolidado de qué roles pueden tomar cada tipo de asignación. El campo habilitado=true es prerequisito en todos los casos.

| **Parte**                       | **Anciano** | **Ministerial** | **Pub. Hombre Bautizado** | **Pub. Hombre No Bautizado** | **Mujer (cualquier rol)** |
| ------------------------------- | ----------- | --------------- | ------------------------- | ---------------------------- | ------------------------- |
| Presidente                      | **✓**       | -               | -                         | -                            | -                         |
| Oración inicial                 | **✓**       | **✓**           | -                         | -                            | -                         |
| Tesoros 1 (discurso)            | **✓**       | **✓**           | -                         | -                            | -                         |
| Tesoros 2 (perlas)              | **✓**       | **✓**           | -                         | -                            | -                         |
| Lectura (sala principal)        | **✓**       | **✓**           | **✓**                     | **✓**                        | -                         |
| Encargado de escuela            | **✓**       | -               | -                         | -                            | -                         |
| SMM titular (demostración)      | **✓**       | **✓**           | **✓**                     | **✓**                        | **✓**                     |
| SMM titular (discurso, parte 6) | **✓**       | **✓**           | **✓**                     | **✓**                        | -                         |
| SMM ayudante                    | **✓**       | **✓**           | **✓**                     | **✓**                        | **✓**                     |
| NVC 1 / NVC 2                   | **✓**       | **✓**           | -                         | -                            | -                         |
| Estudio conductor               | **✓**       | **✓**           | -                         | -                            | -                         |
| Estudio lector                  | **✓**       | **✓**           | **✓**                     | -                            | -                         |
| Oración de conclusión           | **✓**       | **✓**           | **✓**                     | -                            | -                         |

# **6\. Motor de asignación automática**

## **6.1 Criterios de selección**

El motor debe seleccionar la persona candidata aplicando los siguientes criterios en orden de prioridad:

- El publicador debe estar habilitado (habilitado = true)
- Debe cumplir las reglas de elegibilidad de la parte (ver sección 5)
- No debe tener otra parte asignada en la misma reunión (una parte por reunión por persona)
- Prioridad al que tenga la fecha de última asignación más antigua (balanceo equitativo)
- En caso de empate, seleccionar aleatoriamente entre los elegibles

## **6.2 Restricciones adicionales**

- Una persona no puede ser titular y ayudante en la misma reunión
- El presidente no debe tener asignada ninguna otra parte en la misma reunión
- El encargado de la escuela tampoco debe tener otra parte adicional
- La sala auxiliar requiere personas completamente distintas a las de sala principal para la misma parte
- El sistema debe respetar las observaciones del publicador (ej: viaje, enfermedad) si están marcadas

## **6.3 Flujo de trabajo**

- El coordinador carga o ingresa el esquema de la semana (partes + tipos)
- Ejecuta la generación automática - el sistema llena todos los slots
- El coordinador revisa y puede ajustar cualquier asignación manualmente
- El programa queda guardado y puede exportarse
- El historial se actualiza automáticamente al guardar

# **7\. Modelo de datos**

## **7.1 Entidades principales**

| **Entidad**       | **Descripción**                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Publisher         | Publicador con sus datos, rol y habilitación                                                         |
| MeetingWeek       | Semana de reunión: rango de fechas, capítulos, canciones                                             |
| MeetingPart       | Parte específica dentro de una semana: orden, tipo, sección, duración, sala, si requiere ayudante    |
| Assignment        | Asignación: qué publicador tiene qué parte en qué semana. Titular + Ayudante opcional.               |
| AssignmentHistory | Tabla histórica de todas las asignaciones (equivalente a la hoja 'Historico Asignaciones' del Excel) |

## **7.2 Enums clave**

| **Enum** | **Valores**                                                                 |
| -------- | --------------------------------------------------------------------------- |
| Gender   | MALE \| FEMALE                                                              |
| Role     | ELDER \| MINISTERIAL_SERVANT \| BAPTIZED_PUBLISHER \| UNBAPTIZED_PUBLISHER  |
| Section  | OPENING \| TREASURES \| MINISTRY_SCHOOL \| CHRISTIAN_LIFE \| CLOSING        |
| PartType | SPEECH \| DEMONSTRATION \| READING \| DISCUSSION \| STUDY \| PRAYER \| SONG |
| Room     | MAIN \| AUXILIARY_1                                                         |

# **8\. Funcionalidades requeridas**

## **8.1 Gestión de publicadores**

- CRUD completo de publicadores
- Filtros por sexo, rol y habilitación
- Vista de historial de asignaciones por publicador
- Vista de carga: cuántas veces ha tenido cada tipo de parte en los últimos N meses

## **8.2 Gestión del esquema semanal**

- Ingresar la semana de reunión: fechas, capítulos bíblicos, canciones
- Agregar / quitar partes SMM dinámicamente (el número varía por semana)
- Marcar si la parte 6 (SMM 3) es discurso o demostración
- Indicar si la semana tiene sala auxiliar activa

## **8.3 Asignación automática**

- Botón 'Generar asignaciones' que llena todos los slots según las reglas
- El sistema indica si no encontró candidato válido para alguna parte
- Las asignaciones se pueden regenerar parcialmente (solo slots vacíos)

## **8.4 Ajuste manual**

- El coordinador puede cambiar cualquier asignación haciendo clic en el nombre
- El dropdown muestra solo candidatos elegibles para esa parte
- Se indica visualmente si el candidato ya tiene otra parte en la semana

## **8.5 Historial**

- Tabla con todas las asignaciones pasadas
- Filtros: por publicador, por parte, por rango de fechas
- Equivalente a la hoja 'Historico Asignaciones' del archivo Excel actual

## **8.6 Exportación**

- Exportar programa semanal en formato S-140 (programa de la semana con horario)
- Exportar tarjetas de asignación S-89 (titular + ayudante + sala + parte)
- Vista de impresión limpia sin controles de la UI

# **9\. Stack tecnológico sugerido**

| **Capa**      | **Tecnología**           | **Justificación**                             |
| ------------- | ------------------------ | --------------------------------------------- |
| Frontend      | Next.js 14 + TypeScript  | SSR, app router, excelente DX                 |
| UI            | Tailwind CSS + shadcn/ui | Rápido, accesible, consistente                |
| Backend       | Next.js API Routes       | Monorepo simple para proyecto de esta escala  |
| ORM           | Prisma                   | Type-safe, migraciones, buena DX              |
| Base de datos | PostgreSQL               | Relacional, consultas de historial eficientes |
| Auth          | NextAuth.js              | Simple para usuario único/admin               |
| Export PDF    | Puppeteer o react-pdf    | Generación de S-140 y S-89                    |

# **10\. Migración desde Excel**

El archivo Programacion_VMC.xlsx contiene los siguientes datos a migrar:

- Hoja 'Inscritos': todos los publicadores con sexo y habilitación → migrar a tabla Publisher
- Hoja 'Historico Asignaciones': 10.000+ filas de historial desde 2025 → migrar a AssignmentHistory
- Hoja 'Variables': esquema semanal con partes y canciones → migrar a MeetingWeek + MeetingPart

Nota: La hoja 'Inscritos' no tiene el campo 'rol' explícito (anciano / ministerial). Este dato deberá cargarse manualmente o inferirse del historial (quienes tienen partes de Presidente/Tesoros son ancianos o ministeriales).

# **11\. Lista de acomodadores y micrófonos**

Adicional al programador VMC, el sistema gestiona una segunda lista de asignaciones que aplica para ambas reuniones semanales: reunión de entre semana (Vida y Ministerio) y reunión de fin de semana.

## **11.1 Roles de la lista**

| **Rol**    | **Cantidad** | **Por reunión** | **Notas**                |
| ---------- | ------------ | --------------- | ------------------------ |
| Portería   | 1 persona    | Sí              | Solo hombres habilitados |
| Acomodador | 1 persona    | Sí              | Solo hombres habilitados |
| Micrófono  | 2 personas   | Sí              | Solo hombres habilitados |

## **11.2 Elegibilidad**

Todos los roles de esta lista aplican el mismo criterio de elegibilidad:

- Sexo: masculino
- Rol: Anciano, Ministerial o Publicador bautizado (hombre)
- El publicador NO bautizado no puede tomar estos roles
- El publicador debe tener el flag correspondiente activo: habilitadoAcomodador o habilitadoMicrofono
- Portería y acomodador comparten el flag habilitadoAcomodador

## **11.3 Habilitaciones independientes por publicador**

El modelo de publicador tendrá 3 flags de habilitación independientes:

| **Campo**            | **Tipo** | **Controla**                                         |
| -------------------- | -------- | ---------------------------------------------------- |
| habilitadoVMC        | boolean  | Partes de la reunión Vida y Ministerio Cristianos    |
| habilitadoAcomodador | boolean  | Portería y acomodador (entre semana y fin de semana) |
| habilitadoMicrofono  | boolean  | Micrófonos (entre semana y fin de semana)            |

## **11.4 Rotación y balanceo**

El pool de elegibles para acomodadores y micrófonos es unificado - todos los habilitados se mezclan independientemente de si son ancianos, ministeriales o publicadores bautizados. Las reglas de rotación son:

- Se aplica el mismo criterio de balanceo que VMC: prioridad al que tenga la fecha de última asignación más antigua
- La rotación es continua a través de ambas reuniones (entre semana y fin de semana cuentan como asignaciones en el mismo historial)
- El sistema debe intentar no asignar a la misma persona en la lista de acomodadores/micrófonos y en partes VMC en la misma semana
- Esto es una sugerencia del motor, no una restricción dura - el coordinador puede overridear manualmente
- Portería, acomodador y micrófonos rotan de forma independiente entre sí (historial separado por tipo de rol)

## **11.5 Estructura de la reunión de fin de semana**

La reunión de fin de semana comparte la lista de acomodadores/micrófonos con la de entre semana, y adicionalmente tiene sus propias partes de presidencia:

| **Parte**        | **Elegibilidad**                                             | **Notas**                                                                |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Discurso público | Texto libre (opcional)                                       | Ingreso manual. Puede quedar en blanco. No entra en rotación automática. |
| Presidente       | Anciano habilitado (habilitadoVMC)                           | Misma elegibilidad que VMC                                               |
| Oración inicial  | Anciano o Ministerial habilitado (habilitadoVMC)             | La da el presidente                                                      |
| Lector (Atalaya) | Anciano, Ministerial o Pub. hombre bautizado (habilitadoVMC) | Equivalente al lector del estudio VMC                                    |
| Oración final    | Anciano, Ministerial o Pub. hombre bautizado (habilitadoVMC) |                                                                          |
| Portería         | habilitadoAcomodador = true                                  | Pool compartido con entre semana                                         |
| Acomodador       | habilitadoAcomodador = true                                  | Pool compartido con entre semana                                         |
| Micrófono x2     | habilitadoMicrofono = true                                   | Pool compartido con entre semana                                         |

## **11.6 Modelo de datos adicional**

| **Entidad / campo**  | **Descripción**                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| WeekendMeeting       | Reunión de fin de semana: fecha, discursoPúblico (string nullable), presidente, lector, oraciones |
| AttendantAssignment  | Asignación de portería / acomodador / micrófono por reunión y tipo                                |
| MeetingType (enum)   | MIDWEEK \| WEEKEND                                                                                |
| AttendantRole (enum) | DOORMAN \| ATTENDANT \| MICROPHONE_1 \| MICROPHONE_2                                              |

Programador VMC - Requerimientos v1.0 | Marzo 2026