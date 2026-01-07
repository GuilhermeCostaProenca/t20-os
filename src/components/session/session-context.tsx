"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { normalizeEvent } from "@/lib/events/normalize";
import { EventPayload } from "@/lib/events/types";

type SessionVisibility = "master" | "players";

export type SessionEvent = EventPayload & {
  id: string;
  timestamp: string;
  message: string;
  displayType?: string;
};

export type SessionState = {
  startedAt: string | null;
  running: boolean;
  elapsedMs: number;
  lastStartedAt: number | null;
  events: SessionEvent[];
};

const defaultState: SessionState = {
  startedAt: null,
  running: false,
  elapsedMs: 0,
  lastStartedAt: null,
  events: [],
};

type SessionContextValue = {
  state: SessionState;
  visibility: SessionVisibility;
  elapsedMs: number;
  startSession: () => void;
  endSession: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  addNote: (message: string) => void;
  addNpcMention: (name: string) => void;
  addItemMention: (name: string) => void;
  rollD20: (mod: number) => number;
  setVisibility: (v: SessionVisibility) => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = "t20os-session";
const VISIBILITY_KEY = "t20os-session-visibility";

function persistableState(state: SessionState) {
  return JSON.stringify(state);
}

function reviveState(raw: string | null): SessionState {
  if (!raw) return defaultState;
  try {
    const parsed = JSON.parse(raw) as SessionState;
    return {
      ...defaultState,
      ...parsed,
      events: parsed.events ?? [],
    };
  } catch {
    return defaultState;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [visibility, setVisibility] = useState<SessionVisibility>("players");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = reviveState(localStorage.getItem(STORAGE_KEY));
    setState(saved);
    const savedVisibility = localStorage.getItem(VISIBILITY_KEY) as SessionVisibility | null;
    if (savedVisibility === "master" || savedVisibility === "players") {
      setVisibility(savedVisibility);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, persistableState(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(VISIBILITY_KEY, visibility);
  }, [visibility, hydrated]);

  useEffect(() => {
    if (!state.running || !state.lastStartedAt) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.running, state.lastStartedAt]);

  const elapsedMs = useMemo(() => {
    if (!state.running || !state.lastStartedAt) return state.elapsedMs;
    return state.elapsedMs + (tick - state.lastStartedAt);
  }, [state.elapsedMs, state.running, state.lastStartedAt, tick]);

  function logEvent(event: Partial<SessionEvent> & { type: string; message?: string }) {
    const now = new Date().toISOString();
    const normalized = normalizeEvent({
      ...event,
      ts: now,
      visibility: event.visibility,
      message: event.message,
    });
    setState((prev) => ({
      ...prev,
      events: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          ...normalized,
          displayType: event.type,
          message: event.message ?? normalized.message ?? "",
        },
        ...prev.events,
      ].slice(0, 200),
    }));
  }

  function startSession() {
    const now = new Date().toISOString();
    const startEvent: SessionEvent = {
      id: crypto.randomUUID(),
      timestamp: now,
      type: "SESSION_START",
      message: "Sessao iniciada",
      visibility,
    };
    const timerEvent: SessionEvent = {
      id: crypto.randomUUID(),
      timestamp: now,
      type: "NOTE",
      message: "Timer iniciado",
      visibility,
    };
    setState({
      ...state,
      startedAt: now,
      running: true,
      elapsedMs: 0,
      lastStartedAt: Date.now(),
      events: [timerEvent, startEvent, ...state.events],
    });
  }

  function endSession() {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      running: false,
      lastStartedAt: null,
      events: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          type: "SESSION_END",
          message: "Sessao encerrada",
          visibility,
        },
        ...prev.events,
      ],
    }));
  }

  function toggleTimer() {
    if (state.running && state.lastStartedAt) {
      const elapsed = state.elapsedMs + (Date.now() - state.lastStartedAt);
      setState((prev) => ({
        ...prev,
        running: false,
        elapsedMs: elapsed,
        lastStartedAt: null,
      }));
      logEvent({
        type: "NOTE",
        message: "Timer pausado",
        visibility,
      });
      return;
    }

    if (!state.startedAt) {
      startSession();
      logEvent({
        type: "NOTE",
        message: "Timer iniciado",
        visibility,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      running: true,
      lastStartedAt: Date.now(),
    }));
    logEvent({
      type: "NOTE",
      message: "Timer retomado",
      visibility,
    });
  }

  function resetTimer() {
    setState((prev) => ({
      ...prev,
      running: false,
      elapsedMs: 0,
      lastStartedAt: null,
    }));
    logEvent({
      type: "NOTE",
      message: "Timer zerado",
      visibility,
    });
  }

  function addNote(message: string) {
    if (!message.trim()) return;
    logEvent({
      type: "NOTE",
      message: message.trim(),
      visibility,
    });
  }

  function addNpcMention(name: string) {
    if (!name.trim()) return;
    logEvent({
      type: "NPC_MENTION",
      message: name.trim(),
      visibility,
    });
  }

  function addItemMention(name: string) {
    if (!name.trim()) return;
    logEvent({
      type: "ITEM_MENTION",
      message: name.trim(),
      visibility,
    });
  }

  function rollD20(mod: number) {
    const base = Math.floor(Math.random() * 20) + 1;
    const total = base + mod;
    logEvent({
      type: "ROLL",
      message: `Rolagem d20 (${base} ${mod >= 0 ? "+" : ""}${mod}) = ${total}`,
      visibility,
      payload: {
        toHit: { d20: base, mod, total },
      },
    });
    return total;
  }

  function clearSession() {
    setState(defaultState);
    setVisibility("players");
  }

  const value: SessionContextValue = {
    state,
    visibility,
    elapsedMs,
    startSession,
    endSession,
    toggleTimer,
    resetTimer,
    addNote,
    addNpcMention,
    addItemMention,
    rollD20,
    setVisibility,
    clearSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
