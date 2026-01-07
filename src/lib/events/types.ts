export type EventVisibility = "MASTER" | "PLAYERS" | "master" | "players";

export type EventType =
  | "ATTACK"
  | "DAMAGE"
  | "SPELL"
  | "SKILL"
  | "NOTE"
  | "NPC_MENTION"
  | "ITEM_MENTION"
  | "OVERRIDE"
  | "TURN"
  | "INITIATIVE"
  | "SESSION_START"
  | "SESSION_END"
  | "ROLL";

export type EventBreakdown = {
  toHit?: {
    d20: number;
    mod: number;
    total: number;
    isNat20?: boolean;
    isNat1?: boolean;
    isCritThreat?: boolean;
    breakdown?: string;
  };
  damage?: {
    total: number;
    detail?: string;
    isCrit?: boolean;
  };
  formula?: string;
  cost?: {
    mp?: number;
    hp?: number;
  };
};

export type EventMeta = {
  campaignId?: string;
  sessionId?: string;
  combatId?: string;
};

export type EventPayload = {
  type: EventType;
  ts?: string | Date;
  actorId?: string;
  actorName?: string;
  targetId?: string;
  targetName?: string;
  visibility?: EventVisibility;
  breakdown?: EventBreakdown;
  note?: string;
  message?: string;
  meta?: EventMeta;
};
