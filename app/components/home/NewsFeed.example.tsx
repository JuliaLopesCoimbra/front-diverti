/**
 * EXEMPLO: Como modificar o NewsFeed.tsx para usar cache igual Instagram/TikTok
 * 
 * Este arquivo mostra as modificações necessárias para manter o feed
 * na memória quando você navega para outra página e volta.
 * 
 * Copie os trechos relevantes para o seu NewsFeed.tsx
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import { getEventNews, NewsResponse } from "@/app/services/news/newsService";

interface Props {
  eventId: number;
  event?: any;
}

const LIMIT = 5;

export default function NewsFeedWithCache({ eventId, event }: Props) {
  // ===== ADICIONE ISSO =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `feed-event-${eventId}`;
  // =========================

  const [news, setNews] = useState<NewsResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  // ===== MODIFICAÇÃO 1: Carregar cache ao montar =====
  useEffect(() => {
    if (initialized) return;

    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      // Usa dados do cache
      console.log("📦 Carregando feed do cache");
      setNews(cached.data);
      setOffset(cached.data.length);
      setInitialized(true);
      
      // Restaura posição do scroll
      setTimeout(() => {
        window.scrollTo(0, cached.scrollPosition);
      }, 100);
    } else {
      // Carrega normalmente se não há cache
      console.log("🔄 Carregando feed da API");
      loadNews(true);
      setInitialized(true);
    }
  }, [eventId]);

  // ===== MODIFICAÇÃO 2: Salvar cache ao desmontar =====
  useEffect(() => {
    return () => {
      // Quando o componente é desmontado (usuário navega para outra página)
      if (news.length > 0) {
        console.log("💾 Salvando feed no cache");
        setCache(cacheKey, news, window.scrollY);
      }
    };
  }, [news, cacheKey, setCache]);

  const loadNews = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    const nextOffset = reset ? 0 : offset;

    try {
      const data = await getEventNews(eventId, LIMIT, nextOffset);

      setNews((prev) => {
        const merged = reset ? data : [...prev, ...data];
        const unique = Array.from(
          new Map(merged.map((item) => [item.id, item])).values()
        );
        return unique;
      });

      setOffset(nextOffset + data.length);

      if (data.length < LIMIT) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Erro ao carregar notícias", err);
    } finally {
      setLoading(false);
    }
  };

  // ... resto do componente igual
  
  return (
    <div>
      {/* Seu JSX aqui */}
    </div>
  );
}

/**
 * RESUMO DAS MUDANÇAS:
 * 
 * 1. Import useFeedCache hook
 * 2. Adicionar lógica de cache no useEffect de inicialização
 * 3. Adicionar cleanup para salvar cache quando sair da página
 * 
 * RESULTADO:
 * ✅ Quando você voltar para o feed, ele mostra exatamente onde parou
 * ✅ Não precisa recarregar dados da API
 * ✅ Comportamento igual Instagram/TikTok
 */
