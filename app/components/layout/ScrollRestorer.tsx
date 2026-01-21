"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Componente global para restaurar scroll por rota (tipo SPA)
export default function ScrollRestorer() {
  const pathname = usePathname();
  const KEY = `scroll:${pathname}`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // controla scroll restoration manual
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // restaura scroll salvo
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const y = parseInt(saved, 10) || 0;
      requestAnimationFrame(() => window.scrollTo(0, y));
    }

    const onScroll = () => {
      sessionStorage.setItem(KEY, String(window.scrollY));
    };
    window.addEventListener("scroll", onScroll);

    return () => {
      sessionStorage.setItem(KEY, String(window.scrollY));
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
