"use client";

import * as React from "react";
import { Calculator, Calendar, CreditCard, Settings, Smile, User, Search, Book, Swords } from "lucide-react";
import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { TORMENTA20_CLASSES } from "@/rulesets/tormenta20/classes";
import { TORMENTA20_RACES } from "@/rulesets/tormenta20/races";

import { GrimoireItem } from "./grimoire-detail-view";

interface OmniSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (item: GrimoireItem) => void;
}

export function OmniSearch({ open, onOpenChange, onSelect }: OmniSearchProps) {
    const [page, setPage] = useState<string>("root");

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, onOpenChange]);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={onOpenChange}
            label="Global Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[640px] w-full bg-neutral-900 border border-white/10 shadow-2xl rounded-xl overflow-hidden z-[100] p-0"
        >
            <div className="flex items-center border-b border-white/10 px-3" cmdk-input-wrapper="">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Command.Input
                    placeholder="Buscar no Grimoire..."
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1.5 space-y-1">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    Nada encontrado.
                </Command.Empty>

                <Command.Group heading="Classes">
                    {TORMENTA20_CLASSES.map((cls) => (
                        <Command.Item
                            key={cls.id}
                            onSelect={() => {
                                onSelect?.({
                                    type: 'CLASS',
                                    id: cls.id,
                                    name: cls.name,
                                    description: cls.description,
                                    data: cls
                                });
                                onOpenChange(false);
                            }}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected='true']:bg-white/10 data-[selected='true']:text-white"
                        >
                            <Swords className="mr-2 h-4 w-4 text-red-500" />
                            <span>{cls.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">Classe</span>
                        </Command.Item>
                    ))}
                </Command.Group>

                <Command.Group heading="Raças">
                    {TORMENTA20_RACES.map((race) => (
                        <Command.Item
                            key={race.name}
                            onSelect={() => {
                                onSelect?.({
                                    type: 'RACE',
                                    id: race.name, // Races don't have IDs yet, use name
                                    name: race.name,
                                    data: race
                                });
                                onOpenChange(false);
                            }}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected='true']:bg-white/10 data-[selected='true']:text-white"
                        >
                            <User className="mr-2 h-4 w-4 text-blue-500" />
                            <span>{race.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">Ancestralidade</span>
                        </Command.Item>
                    ))}
                </Command.Group>

                <Command.Group heading="Sistema">
                    <Command.Item className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected='true']:bg-white/10 data-[selected='true']:text-white">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </Command.Item>
                </Command.Group>
            </Command.List>

            <div className="border-t border-white/10 p-2 text-[10px] text-muted-foreground flex justify-between px-4 bg-black/20">
                <span>Use as setas para navegar</span>
                <span>ESC para fechar</span>
            </div>
        </Command.Dialog>
    );
}
