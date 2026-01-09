"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NpcsPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      try {
        const res = await fetch("/api/worlds", { cache: "no-store" });
        const payload = await res.json().catch(() => ({}));
        if (res.ok && payload.data && payload.data.length > 0) {
          const firstWorld = payload.data[0];
          router.replace(`/app/worlds/${firstWorld.id}/npcs`);
        } else {
          router.replace("/app/worlds");
        }
      } catch {
        router.replace("/app/worlds");
      }
    }
    redirect();
  }, [router]);

  return null;
}
