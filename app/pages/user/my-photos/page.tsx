"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Skeleton, IconButton } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { useAuth } from "@/app/context/AuthContext";
import BottomNav from "@/app/components/layout/BottomNav";
import HomeHeader from "@/app/components/home/HeaderHome";
import { EventResponse, getEvents } from "@/app/services/events/eventService";
import MyPosts from "@/app/components/my-posts/MyPosts";
import MyPhotos from "@/app/components/my-photos/MyPhotos";
import MyPendingPosts from "@/app/components/my-posts/MyPendingPosts";
import MenuOptions from "@/app/components/my-photos/MenuOptions";

type ViewMode = "menu" | "posts" | "photos" | "pending";

export default function MyPhotosPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isAdminMaster, isSubadmin, isColunista } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("menu");
  
  // Para usuários comuns, sempre mostrar fotos diretamente
  const isRegularUser = !isAdminMaster && !isSubadmin && !isColunista;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/pages/auth/login");
      return;
    }

    // Para usuários comuns, definir viewMode como "photos" diretamente
    if (isRegularUser) {
      setViewMode("photos");
    }

    // Carrega eventos para o header
    getEvents()
      .then((data) => {
        setEvents(data);
        if (data.length > 0) {
          setCurrentEvent(data[0]);
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar eventos", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated, router, isRegularUser]);

  const handleSelectOption = (option: string) => {
    setViewMode(option as ViewMode);
  };

  const handleBackToMenu = () => {
    setViewMode("menu");
  };

  const renderContent = () => {
    if (isRegularUser) {
      // Usuários comuns veem apenas fotos compradas
      return <MyPhotos />;
    }

    // Admin, subadmin e colunistas veem menu ou conteúdo específico
    switch (viewMode) {
      case "menu":
        return <MenuOptions onSelectOption={handleSelectOption} />;
      case "posts":
        return (
          <Box>
            <Box display="flex" alignItems="center" gap={1} padding={2} paddingBottom={0}>
              <IconButton
                onClick={handleBackToMenu}
                sx={{ color: "#fff" }}
              >
                <ArrowBackIosIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography variant="h6" fontWeight={500} sx={{ color: "#fff", fontSize: "1rem" }}>
                Meus Posts
              </Typography>
            </Box>
            <MyPosts hideTitle currentEvent={currentEvent} />
          </Box>
        );
      case "photos":
        return (
          <Box>
            <Box display="flex" alignItems="center" gap={1} padding={2} paddingBottom={0}>
              <IconButton
                onClick={handleBackToMenu}
                sx={{ color: "#fff" }}
              >
                <ArrowBackIosIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography variant="h6" fontWeight={500} sx={{ color: "#fff", fontSize: "1rem" }}>
                Fotos Compradas
              </Typography>
            </Box>
            <MyPhotos hideTitle />
          </Box>
        );
      case "pending":
        return (
          <Box>
            <Box display="flex" alignItems="center" gap={1} padding={2} paddingBottom={0}>
              <IconButton
                onClick={handleBackToMenu}
                sx={{ color: "#fff" }}
              >
                <ArrowBackIosIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography variant="h6" fontWeight={500} sx={{ color: "#fff", fontSize: "1rem" }}>
                Posts Pendentes
              </Typography>
            </Box>
            <MyPendingPosts hideTitle />
          </Box>
        );
      default:
        return <MenuOptions onSelectOption={handleSelectOption} />;
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          paddingBottom: "72px",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
        }}
      >
        {/* Header Skeleton */}
        <Box
          sx={{
            padding: 2,
            borderBottom: "solid 1px rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Skeleton
                variant="rectangular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.4,
            }}
          >
            <Skeleton
              variant="text"
              width={200}
              height={24}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
            <Skeleton
              variant="text"
              width={120}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
        </Box>

        {/* Content Skeleton */}
        <Box padding={2}>
          <Skeleton
            variant="text"
            width={200}
            height={32}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(1, 1fr)", gap: 2 }}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                variant="rectangular"
                width="100%"
                height={200}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  if (!currentEvent) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          paddingBottom: "72px",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
        }}
      >
        {/* Header Skeleton */}
        <Box
          sx={{
            padding: 2,
            borderBottom: "solid 1px rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Skeleton
                variant="rectangular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.4,
            }}
          >
            <Skeleton
              variant="text"
              width={200}
              height={24}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
            <Skeleton
              variant="text"
              width={120}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
        </Box>

        {/* Content Skeleton */}
        <Box padding={2}>
          <Skeleton
            variant="text"
            width={200}
            height={32}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", mb: 2 }}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton
                key={item}
                variant="rectangular"
                width="100%"
                height={200}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        style={{
          minHeight: "100vh",
          paddingBottom: "72px",
          backgroundColor: "#f4f7fc",
          backgroundImage: "url(/background/dashboard.png)",
        }}
      >
        {/* Header com nome, foto e data */}
        <HomeHeader
          event={currentEvent}
          events={events}
          currentEvent={currentEvent}
          onSelectEvent={setCurrentEvent}
        />

        {/* Conteúdo baseado no tipo de usuário */}
        {renderContent()}
      </Box>
      <BottomNav />
    </>
  );
}

