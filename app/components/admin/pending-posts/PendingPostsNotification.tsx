"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge, IconButton, Tooltip } from "@mui/material";
import { PendingActions } from "@mui/icons-material";
import { getPendingPosts } from "@/app/services/news/newsService";

interface Props {
  eventId?: number;
}

export default function PendingPostsNotification({ eventId }: Props) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPendingCount = async () => {
    try {
      const posts = await getPendingPosts(eventId);
      setPendingCount(posts.length);
    } catch (error) {
      console.error("Erro ao carregar posts pendentes", error);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingCount();
    // Sem polling periódico — busca apenas uma vez ao montar
  }, [eventId]);

  const handleClick = async () => {
    try {
      const posts = await getPendingPosts(eventId);
      const url = eventId 
        ? `/pages/admin/pending-posts?eventId=${eventId}`
        : "/pages/admin/pending-posts";
      
      // Se tiver apenas 1 post, vai direto para o detail
      if (posts.length === 1) {
        router.push(`/pages/admin/pending-posts/${posts[0].id}${eventId ? `?eventId=${eventId}` : ''}`);
      } else {
        // Se tiver mais de 1, vai para a lista
        router.push(url);
      }
    } catch (error) {
      // Em caso de erro, vai para a lista mesmo assim
      const url = eventId 
        ? `/pages/admin/pending-posts?eventId=${eventId}`
        : "/pages/admin/pending-posts";
      router.push(url);
    }
  };

  if (loading || pendingCount === 0) {
    return null;
  }

  return (
    <Tooltip title={`${pendingCount} ${pendingCount === 1 ? "post pendente" : "posts pendentes"}`} arrow>
      <Badge badgeContent={pendingCount} color="error" max={99}>
        <IconButton
          onClick={handleClick}
          sx={{
            backgroundColor: "rgba(255, 152, 0, 0.2)",
            color: "#ff9800",
            border: "2px solid #ff9800",
            "&:hover": {
              backgroundColor: "rgba(255, 152, 0, 0.3)",
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease",
          }}
        >
          <PendingActions />
        </IconButton>
      </Badge>
    </Tooltip>
  );
}

