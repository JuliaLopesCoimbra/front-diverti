"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
  Button,
  Divider,
} from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";
import { getEventNews, NewsResponse } from "@/app/services/news/newsService";
import EmptyNews from "./EmptyNews";

interface Props {
  eventId: number;
}

const LIMIT = 5;

export default function NewsFeed({ eventId }: Props) {
  const { isAdmin, authVersion } = useAuth();
  const [news, setNews] = useState<NewsResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

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

  // troca de evento
  useEffect(() => {
    setNews([]);
    setOffset(0);
    setHasMore(true);
    loadNews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // infinite scroll
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNews(false);
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, offset]);

  const [featured, ...others] = news;

  return (
    <Box padding={2} key={authVersion}>
      {/* AÇÕES ADMIN — SEMPRE NO TOPO */}
      {isAdmin && (
        <Box display="flex" justifyContent="flex-end" marginBottom={2}>
          <Button variant="contained">+ Adicionar post</Button>
        </Box>
      )}

      {/* LOADING INICIAL */}
      {loading && news.length === 0 && <FeaturedNewsSkeleton />}

      {/* SEM NOTÍCIAS */}
      {!loading && news.length === 0 && <EmptyNews />}

      {/* FEED NORMAL */}
      {news.length > 0 && (
        <>
          {/* NOTÍCIA PRINCIPAL */}
          {featured && (
            <Card
              sx={{
                backgroundColor: "transparent",
                boxShadow: "none",
                color: "#fff",
              }}
            >
              {featured.image_url && (
                <CardMedia
                  component="img"
                  height="240"
                  image={featured.image_url}
                  alt={featured.title}
                />
              )}
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: "#fff" }}
                >
                  {featured.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.7)", marginTop: 1 }}
                >
                  {new Date(featured.created_at).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Typography>
              </CardContent>
            </Card>
          )}
          <Divider
            sx={{
              borderColor: "rgba(255,255,255,0.35)",
              borderWidth: "1px",
              marginY: 1.5,
            }}
          />
          <Box display="flex" flexDirection="column">
            {others.map((item, index) => (
              <Box key={item.id}>
                <Card
                  sx={{
                    display: "flex",
                    gap: 2,
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    color: "#fff",
                    paddingBottom: 1,
                  }}
                >
                  {item.image_url && (
                    <CardMedia
                      component="img"
                      image={item.image_url}
                      alt={item.title}
                      sx={{ width: 120, borderRadius: 1 }}
                    />
                  )}

                  <CardContent sx={{ padding: 1 }}>
                    <Typography fontWeight={600} sx={{ color: "#fff" }}>
                      {item.title}
                    </Typography>

                    <Typography
                      fontSize={12}
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Linha separadora */}
                {index !== others.length - 1 && (
                  <Divider
                    sx={{
                      borderColor: "rgba(255,255,255,0.15)",
                      marginY: 1,
                    }}
                  />
                )}
              </Box>
            ))}

            {/* Skeleton ao carregar mais */}
            {loading &&
              Array.from({ length: 2 }).map((_, i) => (
                <NewsItemSkeleton key={i} />
              ))}
          </Box>
        </>
      )}

      {hasMore && <div ref={loaderRef} />}
    </Box>
  );
}

/* ---------------- SKELETONS ---------------- */

function FeaturedNewsSkeleton() {
  return (
    <Card
      sx={{
        marginBottom: 3,
        backgroundColor: "#0f0f0f",
        borderRadius: 2,
      }}
    >
      <Skeleton
        variant="rectangular"
        height={240}
        sx={{ bgcolor: "#2a2a2a" }}
      />

      <CardContent>
        <Skeleton height={28} width="80%" sx={{ bgcolor: "#2a2a2a" }} />

        <Skeleton
          height={18}
          width="40%"
          sx={{ bgcolor: "#2a2a2a", marginTop: 1 }}
        />
      </CardContent>
    </Card>
  );
}

function NewsItemSkeleton() {
  return (
    <Card
      sx={{
        display: "flex",
        gap: 2,
        padding: 1,
        backgroundColor: "#0f0f0f",
        borderRadius: 2,
      }}
    >
      <Skeleton
        variant="rectangular"
        width={120}
        height={80}
        sx={{ bgcolor: "#2a2a2a", borderRadius: 1 }}
      />

      <CardContent sx={{ padding: 1, width: "100%" }}>
        <Skeleton height={20} width="90%" sx={{ bgcolor: "#2a2a2a" }} />

        <Skeleton
          height={14}
          width="40%"
          sx={{ bgcolor: "#2a2a2a", marginTop: 1 }}
        />
      </CardContent>
    </Card>
  );
}
