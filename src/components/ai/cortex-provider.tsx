"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface CortexContextType {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    toggle: () => void;

    activeSessionId: string | null;
    startNewSession: () => void;
    loadSession: (sessionId: string) => void;

    // Actions
    sendMessage: (text: string, campaignId: string) => Promise<void>;
    history: any[]; // Current Thread
}

const CortexContext = createContext<CortexContextType | undefined>(undefined);

export function CortexProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    function toggle() {
        setIsOpen(!isOpen);
    }

    function startNewSession() {
        setActiveSessionId(null);
        setHistory([]);
    }

    function loadSession(sessionId: string) {
        setActiveSessionId(sessionId);
        setIsOpen(true);
        // Fetch history
        fetch(`/api/ai/chat?sessionId=${sessionId}`)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error(err));
    }

    async function sendMessage(text: string, campaignId: string) {
        // 1. Optimistic UI
        const tempUserMsg = { role: "user", content: text, createdAt: new Date() };
        setHistory(prev => [...prev, tempUserMsg]);
        setIsOpen(true); // Open sidebar on send

        try {
            // 2. Execute Command on Cortex Logic (Existing API)
            // We reuse the command logic. 
            // Ideally, we should unify this, but for now:
            const cmdRes = await fetch("/api/ai/command", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command: text,
                    context: { route: window.location.pathname } // simple context
                })
            });
            const cmdData = await cmdRes.json();

            if (!cmdRes.ok) throw new Error(cmdData.error || "Erro no processamento");

            // 3. Save Chat History (User + AI)
            const chatRes = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: activeSessionId,
                    campaignId, // TODO: Get from context or props
                    userId: "user", // TODO: Auth
                    message: { content: text },
                    aiResponse: {
                        content: cmdData.message,
                        intent: cmdData.action?.intent,
                        meta: cmdData.result
                    }
                })
            });
            const chatData = await chatRes.json();

            // 4. Update Session ID if new
            if (!activeSessionId && chatData.sessionId) {
                setActiveSessionId(chatData.sessionId);
            }

            // 5. Update UI with AI Response
            const aiMsg = {
                role: "assistant",
                content: cmdData.message,
                intent: cmdData.action?.intent,
                meta: cmdData.result,
                createdAt: new Date()
            };
            setHistory(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error(error);
            toast.error("Erro no Chat C.O.R.T.E.X.");
            // Add error message to chat
            setHistory(prev => [...prev, { role: "system", content: "Erro de conexão.", isError: true }]);
        }
    }

    return (
        <CortexContext.Provider value={{
            isOpen, setIsOpen, toggle,
            activeSessionId, startNewSession, loadSession,
            sendMessage, history
        }}>
            {children}
        </CortexContext.Provider>
    );
}

export function useCortex() {
    const context = useContext(CortexContext);
    if (context === undefined) {
        throw new Error("useCortex must be used within a CortexProvider");
    }
    return context;
}
