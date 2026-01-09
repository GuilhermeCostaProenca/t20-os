import { WorldEventScope, WorldEventVisibility, WorldEventType } from "@prisma/client";

export type BaseEventPayload = Record<string, any>;
export interface EventPayload extends BaseEventPayload {
  type: EventType;
  visibility?: EventVisibility;
  ts?: string;
  payload?: any;
  breakdown?: any;
  meta?: any;
  actorId?: string;
  actorName?: string;
  message?: string;
}

export type EventType = WorldEventType | string;
export type EventVisibility = WorldEventVisibility | string;

export interface CreateEventParams<TPayload extends BaseEventPayload = any> {
  type: WorldEventType;
  worldId: string;
  campaignId?: string;
  entityId?: string; // Optional: ID if known (e.g. updating), or for creation correlation
  actorId?: string;
  payload: TPayload;
  visibility?: WorldEventVisibility;
  scope?: WorldEventScope;
}

// Payload Definitions
export interface WorldCreatedPayload {
  title: string;
  description?: string;
  coverImage?: string;
}

export interface CampaignCreatedPayload {
  name: string;
  description?: string;
  system: string;
  rulesetId: string;
}

export interface CharacterCreatedPayload {
  name: string;
  campaignId: string; // Redundant but useful in payload for processor context
  description?: string;
  ancestry?: string; // e.g. Humano
  className?: string; // e.g. Guerreiro
  role?: string; // e.g. Tank
  level?: number;
  avatarUrl?: string;
}

export interface RollPayload {
  expression: string; // e.g. "1d20+5"
  result: number;
  breakdown?: any; // Individual die results
  label?: string; // Reason for roll
  isPrivate?: boolean;
}

export interface AttackPayload {
  attackerId: string;
  targetId?: string;
  weaponName: string;
  roll: RollPayload;
  damage?: RollPayload;
}
