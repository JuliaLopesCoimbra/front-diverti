"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Card,
  CardMedia,
  Skeleton,
  Chip,
} from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";
import BottomNav from "@/app/components/layout/BottomNav";
import HomeHeader from "@/app/components/home/HeaderHome";
import { EventResponse, getEvents } from "@/app/services/events/eventAppService";
import { getProductsByEvent, ProductEventResponse } from "@/app/services/productsEvent/productEventService";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const STORAGE_KEY = "selectedEventId";

export default function StorePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, authReady } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const [products, setProducts] = useState<ProductEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Função para atualizar o evento atual baseado no localStorage
  const updateCurrentEventFromStorage = useCallback((eventsList: EventResponse[]) => {
    const savedEventId = localStorage.getItem(STORAGE_KEY);
    if (savedEventId) {
      const savedId = parseInt(savedEventId, 10);
      const savedEvent = eventsList.find((event) => event.id === savedId);
      if (savedEvent) {
        setCurrentEvent(savedEvent);
        return;
      }
    }
    // Se não encontrou evento salvo, usa o primeiro disponível (preferencialmente ativo)
    const activeEvent = eventsList.find((event) => event.is_active);
    const selectedEvent = activeEvent || (eventsList.length > 0 ? eventsList[0] : null);
    if (selectedEvent) {
      setCurrentEvent(selectedEvent);
      localStorage.setItem(STORAGE_KEY, selectedEvent.id.toString());
    }
  }, []);

  // Função para carregar produtos do evento atual
  const loadProducts = useCallback(async (eventId: number) => {
    try {
      setLoadingProducts(true);
      const productsData = await getProductsByEvent(eventId);
      // Filtra apenas produtos ativos
      const activeProducts = productsData.filter(p => p.status === "active");
      setProducts(activeProducts);
    } catch (err: any) {
      console.error("Erro ao carregar produtos", err);
      if (err?.response?.status !== 404) {
        showToast("Erro ao carregar produtos", "error");
      }
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [showToast]);

  // Função para verificar e atualizar eventos
  const checkAndUpdateEvents = useCallback(async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      
      if (currentEvent?.id) {
        const updatedEvent = data.find((event) => event.id === currentEvent.id);
        
        // Se o evento não foi encontrado (foi deletado), troca para um ativo
        if (!updatedEvent) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
          } else if (data.length > 0) {
            setCurrentEvent(data[0]);
            localStorage.setItem(STORAGE_KEY, data[0].id.toString());
          } else {
            setCurrentEvent(null);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        // Se o evento atual foi desativado e o usuário NÃO é admin/subadmin, troca para um ativo
        else if (!updatedEvent.is_active && !isAdmin) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
          }
        } else if (updatedEvent) {
          setCurrentEvent(updatedEvent);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar eventos:", error);
    }
  }, [currentEvent, isAdmin]);

  // Função para lidar com seleção de evento
  const handleSelectEvent = useCallback((event: EventResponse) => {
    localStorage.setItem(STORAGE_KEY, event.id.toString());
    setCurrentEvent(event);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/pages/auth/login");
      return;
    }

    // Carrega eventos para o header
    setLoadingEvents(true);
    getEvents()
      .then((data) => {
        setEvents(data);
        updateCurrentEventFromStorage(data);
      })
      .catch((error) => {
        console.error("Erro ao carregar eventos", error);
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  }, [isAuthenticated, router, updateCurrentEventFromStorage]);

  // Carrega produtos quando o evento atual muda
  useEffect(() => {
    if (currentEvent?.id) {
      loadProducts(currentEvent.id);
    } else {
      setProducts([]);
      setLoadingProducts(false);
    }
  }, [currentEvent?.id, loadProducts]);

  // Escuta mudanças no localStorage (quando o evento é alterado em outra aba/componente)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedEventId = localStorage.getItem(STORAGE_KEY);
      if (savedEventId) {
        const savedId = parseInt(savedEventId, 10);
        if (currentEvent?.id !== savedId) {
          const event = events.find((e) => e.id === savedId);
          if (event) {
            setCurrentEvent(event);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Também verifica periodicamente (para mudanças na mesma aba)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [currentEvent, events]);

  // Verifica eventos quando a página fica visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndUpdateEvents();
      }
    };

    const handleFocus = () => {
      checkAndUpdateEvents();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAndUpdateEvents]);

  // Controla animações quando a página carrega
  useEffect(() => {
    setShouldAnimate(true);
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffc91f" }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          ...dashboardBackgroundSx,
          minHeight: "100vh",
          paddingBottom: "72px",
        }}
      >
        {/* Header */}
        <Box className={shouldAnimate ? "slide-up-animation" : ""}>
          <HomeHeader
            event={currentEvent}
            events={events}
            currentEvent={currentEvent}
            onSelectEvent={handleSelectEvent}
          />
        </Box>

        {/* Conteúdo */}
        <Box
          className={shouldAnimate ? "slide-up-delay-1" : ""}
          sx={{
            p: { xs: 2, sm: 3 },
            maxWidth: 1000,
            width: "100%",
            mx: "auto",
          }}
        >
          {loadingEvents ? (
            // Skeleton Loader
            <Box>
              {/* Skeleton do título do evento */}
              <Box sx={{ mb: 4, pb: 2, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <Skeleton
                  variant="text"
                  width="60%"
                  height={40}
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 1,
                  }}
                />
              </Box>

              {/* Skeleton dos cards de produtos */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                {[...Array(8)].map((_, index) => (
                  <Card
                    key={index}
                    sx={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      sx={{
                        height: { xs: 200, md: 250 },
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                      }}
                    />
                  </Card>
                ))}
              </Box>
            </Box>
          ) : !currentEvent ? (
            <Paper
              className={shouldAnimate ? "slide-up-delay-2" : ""}
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                borderRadius: 3,
                p: 6,
                textAlign: "center",
              }}
            >
              <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Nenhum evento selecionado
              </Typography>
            </Paper>
          ) : loadingProducts ? (
            <Box className={shouldAnimate ? "slide-up-delay-2" : ""} sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#ffc91f" }} />
            </Box>
          ) : products.length === 0 ? (
            <Paper
              className={shouldAnimate ? "slide-up-delay-2" : ""}
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                borderRadius: 3,
                p: 6,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography variant="h5" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Ainda não há produtos disponíveis
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                Os produtos deste evento aparecerão aqui quando estiverem disponíveis.
              </Typography>
            </Paper>
          ) : (
            <>
              <Box
                className={shouldAnimate ? "slide-up-delay-2" : ""}
                sx={{
                  mb: 4,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    color: "#fff",
                    fontSize: { xs: "1rem", md: "1.25rem" },
                    mb: 1,
                  }}
                >
                  Lojinha do Evento
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: { xs: "0.875rem", md: "1rem" },
                    maxWidth: "600px",
                    mx: "auto",
                  }}
                >
                  Estes produtos estão sendo vendidos na lojinha do evento. Clique em qualquer produto para ver mais detalhes.
                </Typography>
              </Box>

              <Box
                className={shouldAnimate ? "slide-up-delay-3" : ""}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                {products.map((product) => (
                  <Card
                    key={product.id}
                    sx={{
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      overflow: "hidden",
                      position: "relative",
                      "&:hover": {
                        transform: "translateY(-6px)",
                        boxShadow: "0 12px 24px rgba(255, 201, 31, 0.25)",
                        borderColor: "rgba(255, 201, 31, 0.3)",
                      },
                    }}
                    onClick={() => router.push(`/pages/user/store/${product.id}`)}
                  >
                    {product.last_pieces && (
                      <Chip
                        label="Últimas Peças"
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 2,
                          backgroundColor: "#ff1744",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: { xs: "0.625rem", md: "0.75rem" },
                          height: { xs: 24, md: 28 },
                          "& .MuiChip-label": {
                            px: { xs: 1, md: 1.5 },
                          },
                          boxShadow: "0 2px 8px rgba(255, 23, 68, 0.4)",
                        }}
                      />
                    )}
                    {product.images && product.images.length > 0 ? (
                      <CardMedia
                        component="img"
                        image={product.images[0].image_url}
                        alt={product.name}
                        sx={{
                          width: "100%",
                          height: { xs: 200, md: 250 },
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: { xs: 200, md: 250 },
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(255,255,255,0.05)",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.688rem",
                            fontWeight: 500,
                          }}
                        >
                          Sem imagem
                        </Typography>
                      </Box>
                    )}
                  </Card>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
      <BottomNav />
    </>
  );
}

