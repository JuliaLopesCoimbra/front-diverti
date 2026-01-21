"use client";

import { createContext, useContext, useRef, ReactNode, useEffect } from "react";

interface FeedCacheData {
  data: any[];
  scrollPosition: number;
  timestamp: number;
}

interface FeedCache {
  [key: string]: FeedCacheData;
}

interface FeedCacheContextType {
  getCache: (key: string) => FeedCacheData | null;
  setCache: (key: string, data: any[], scrollPosition: number) => void;
  clearCache: (key?: string) => void;
}

const FeedCacheContext = createContext<FeedCacheContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'n1-feed-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 HORAS (igual Instagram/TikTok)

/**
 * Provider que mantém cache dos feeds em memória E localStorage
 * ULTRA AGRESSIVO - igual Instagram/TikTok
 * Persiste entre sessões, recarregamentos, etc.
 */
export function FeedCacheProvider({ children }: { children: ReactNode }) {
  // Cache em memória (rápido)
  const cacheRef = useRef<FeedCache>({});
  
  // Carrega do localStorage ao montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        cacheRef.current = parsed;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar cache:', error);
    }
  }, []);

  const getCache = (key: string): FeedCacheData | null => {
    // Primeiro tenta memória
    let cached = cacheRef.current[key];
    
    // Se não tem em memória, tenta localStorage
    if (!cached && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          cached = parsed[key];
          if (cached) {
            // Restaura para memória
            cacheRef.current[key] = cached;
          }
        }
      } catch (error) {
        console.error('❌ Erro ao ler cache:', error);
      }
    }
    
    if (!cached) return null;

    // Verifica expiração (24 horas)
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;

    if (isExpired) {
      delete cacheRef.current[key];
      saveToLocalStorage();
      return null;
    }

    return cached;
  };

  const saveToLocalStorage = () => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheRef.current));
    } catch (error) {
      console.error('❌ Erro ao salvar cache:', error);
      // Se localStorage estiver cheio, limpa caches antigos
      try {
        const now = Date.now();
        const filtered: FeedCache = {};
        Object.entries(cacheRef.current).forEach(([k, v]) => {
          if (now - v.timestamp < CACHE_DURATION) {
            filtered[k] = v;
          }
        });
        cacheRef.current = filtered;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.error('❌ Erro crítico ao salvar cache:', e);
      }
    }
  };

  const setCache = (key: string, data: any[], scrollPosition: number) => {
    const cacheData: FeedCacheData = {
      data,
      scrollPosition,
      timestamp: Date.now(),
    };
    
    // Salva em memória
    cacheRef.current[key] = cacheData;
    
    // Salva em localStorage IMEDIATAMENTE
    saveToLocalStorage();
  };

  const clearCache = (key?: string) => {
    if (key) {
      delete cacheRef.current[key];
    } else {
      cacheRef.current = {};
    }
    saveToLocalStorage();
  };

  return (
    <FeedCacheContext.Provider value={{ getCache, setCache, clearCache }}>
      {children}
    </FeedCacheContext.Provider>
  );
}

/**
 * Hook para usar o cache de feeds
 * 
 * @example
 * const { getCache, setCache } = useFeedCache();
 * 
 * // Ao carregar a página, verifica se há cache
 * const cached = getCache('home-feed');
 * if (cached) {
 *   setNews(cached.data);
 *   window.scrollTo(0, cached.scrollPosition);
 * }
 * 
 * // Ao sair da página, salva o cache
 * useEffect(() => {
 *   return () => {
 *     setCache('home-feed', news, window.scrollY);
 *   };
 * }, [news]);
 */
export function useFeedCache() {
  const context = useContext(FeedCacheContext);
  if (!context) {
    throw new Error("useFeedCache must be used within FeedCacheProvider");
  }
  return context;
}
