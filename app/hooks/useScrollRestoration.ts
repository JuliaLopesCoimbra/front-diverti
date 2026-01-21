/**
 * Hook personalizado para restauração robusta de scroll
 * Garante que o scroll seja restaurado mesmo com imagens carregando
 */

import { useEffect, useRef } from 'react';

interface UseScrollRestorationOptions {
  enabled: boolean;
  targetPosition: number;
  onRestored?: () => void;
}

export function useScrollRestoration({ 
  enabled, 
  targetPosition, 
  onRestored 
}: UseScrollRestorationOptions) {
  const restoredRef = useRef(false);
  const attemptCountRef = useRef(0);
  const maxAttempts = 10;

  useEffect(() => {
    if (!enabled || restoredRef.current) return;

    let timeoutId: NodeJS.Timeout;
    let rafId: number;

    const attemptRestore = () => {
      if (attemptCountRef.current >= maxAttempts) {
        console.log("⚠️ Máximo de tentativas de restauração atingido");
        restoredRef.current = true;
        onRestored?.();
        return;
      }

      attemptCountRef.current++;

      // Usa requestAnimationFrame para garantir que o DOM foi atualizado
      rafId = requestAnimationFrame(() => {
        const currentScroll = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const maxScroll = documentHeight - windowHeight;

        // Se o target está além do máximo possível, ajusta
        const safeTarget = Math.min(targetPosition, maxScroll);

        // Scroll para a posição
        window.scrollTo({
          top: safeTarget,
          behavior: 'instant' as ScrollBehavior
        });

        const newScroll = window.scrollY;

        // Verifica se conseguiu chegar perto do target (margem de 50px)
        if (Math.abs(newScroll - safeTarget) < 50) {
          console.log(`✅ Scroll restaurado: ${newScroll}/${safeTarget}`);
          restoredRef.current = true;
          onRestored?.();
        } else {
          // Tenta novamente após um delay
          timeoutId = setTimeout(attemptRestore, 100);
        }
      });
    };

    // Primeira tentativa imediata
    attemptRestore();

    // Tentativa adicional após imagens carregarem
    const handleLoad = () => {
      if (!restoredRef.current) {
        setTimeout(attemptRestore, 100);
      }
    };

    window.addEventListener('load', handleLoad);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      window.removeEventListener('load', handleLoad);
    };
  }, [enabled, targetPosition, onRestored]);

  return { restored: restoredRef.current };
}
