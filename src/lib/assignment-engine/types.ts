import type {
  Gender,
  Role,
  PublisherStatus,
  Section,
  PartType,
  Room,
} from '@/generated/prisma/enums';

// ─── Input Types ──────────────────────────────────────────────────────

/** Minimal publisher data needed by the engine — no Prisma dependency */
export type PublisherCandidate = {
  id: string;
  nombre: string;
  sexo: Gender;
  rol: Role;
  estado: PublisherStatus;
  habilitadoVMC: boolean;
  skipAssignment: boolean;
};

/** Minimal part data needed by the engine */
export type PartSlot = {
  id: string;
  seccion: Section;
  tipo: PartType;
  titulo: string | null;
  orden: number;
  sala: Room;
  requiereAyudante: boolean;
  /** For fixed parts: the i18n key used to match eligibility rules */
  tituloKey?: string;
};

/** Rotation map: publisherId → eligibilityKey → lastAssignmentDate */
export type RotationMap = Map<string, Map<string, Date>>;

export type EngineConfig = {
  mode: 'partial' | 'full';
  /** Seed for deterministic random tiebreak in tests */
  seed?: number;
};

export type ExistingAssignment = {
  partId: string;
  publisherId: string;
  helperId: string | null;
};

// ─── Output Types ─────────────────────────────────────────────────────

export type SlotAssignment = {
  partId: string;
  publisherId: string;
  publisherNombre: string;
  helperId?: string;
  helperNombre?: string;
};

export type UnfilledSlot = {
  partId: string;
  partTitle: string;
  section: Section;
  room: Room;
  reason: string;
};

export type EngineOutput = {
  assignments: SlotAssignment[];
  unfilled: UnfilledSlot[];
  stats: {
    totalSlots: number;
    filled: number;
    unfilled: number;
    /** Slots skipped in partial mode (already assigned) */
    skipped: number;
  };
};
