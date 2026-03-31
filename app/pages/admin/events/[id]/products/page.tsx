"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  Paper,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import AddIcon from "@mui/icons-material/Add";
import { getProductsByEvent, ProductEventResponse } from "@/app/services/productsEvent/productEventService";
import { getEventById, EventResponse } from "@/app/services/events/eventAppService";
import { useAuth } from "@/app/context/AuthContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { useToast } from "@/app/context/ToastContext";

export default function EventProductsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const { isAdmin, authReady } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [products, setProducts] = useState<ProductEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    if (authReady && !isAdmin) {
      router.push("/pages/user/home");
    }
  }, [isAdmin, router, authReady]);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventData, productsData] = await Promise.all([
          getEventById(eventId),
          getProductsByEvent(eventId),
        ]);
        setEvent(eventData);
        setProducts(productsData);
      } catch (err: any) {
        console.error("Erro ao buscar dados", err);
        if (err?.response?.status === 404) {
          showToast("Evento não encontrado", "error");
          router.push("/pages/user/home");
        } else {
          showToast("Erro ao carregar produtos", "error");
        }
      } finally {
        setLoading(false);
        setLoadingEvent(false);
      }
    };

    fetchData();
  }, [eventId, router, showToast]);

  if (!authReady || loadingEvent) {
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

  if (!isAdmin) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 3,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <IconButton
          onClick={() => router.push(`/pages/admin/events/${eventId}`)}
          size="medium"
          sx={{ color: "#fff", fontSize: "1.5rem" }}
        >
          <ArrowBackIosIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="h3" fontWeight={700} sx={{ color: "#fff", fontSize: { xs: "1.1rem", sm: "2rem" }, flex: 1 }}>
          Loja do Evento
        </Typography>
      </Box>

      {/* Conteúdo */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 2, sm: 3 },
          maxWidth: 1000,
          width: "100%",
          mx: "auto",
        }}
      >
        {!loading && event && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
              flexWrap: "wrap",
              gap: 2,
              pb: 2,
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography 
              variant="h4" 
              fontWeight={700} 
              sx={{ 
                color: "#fff",
                fontSize: { xs: "1.1rem", sm: "1.5rem", md: "2rem" },
                letterSpacing: "0.5px",
              }}
            >
              {event.title}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`/pages/admin/products-event/create?eventId=${eventId}`)}
              sx={{
                backgroundColor: "rgb(255, 31, 33)",
                color: "#fff",
                fontWeight: 700,
                fontSize: { xs: "0.688rem", sm: "0.95rem" },
                px: { xs: 1.5, sm: 3 },
                py: { xs: 0.75, sm: 1.25 },
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(255, 31, 33, 0.3)",
                transition: "all 0.3s ease",
                minWidth: { xs: "auto", sm: "auto" },
                "&:hover": {
                  backgroundColor: "rgb(220, 20, 22)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 16px rgba(255, 31, 33, 0.4)",
                },
                "& .MuiButton-startIcon": {
                  marginRight: { xs: "2px", sm: "8px" },
                  marginLeft: { xs: 0, sm: 0 },
                  "& > *:nth-of-type(1)": {
                    fontSize: { xs: "0.875rem", sm: "1.25rem" },
                  },
                },
              }}
            >
              Criar Produto
            </Button>
          </Box>
        )}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#ffc91f" }} />
          </Box>
        ) : products.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              borderRadius: 3,
              p: 6,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Typography variant="h5" sx={{ color: "rgba(255,255,255,0.7)" }}>
              Ainda não há produtos nesse evento
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`/pages/admin/products-event/create?eventId=${eventId}`)}
              sx={{
                backgroundColor: "rgb(255, 31, 33)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                px: 4,
                py: 1.75,
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(255, 31, 33, 0.3)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgb(220, 20, 22)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 16px rgba(255, 31, 33, 0.4)",
                },
              }}
            >
              Criar Primeiro Produto
            </Button>
          </Paper>
        ) : (
          <Box
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
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 12px 24px rgba(255, 201, 31, 0.25)",
                      borderColor: "rgba(255, 201, 31, 0.3)",
                    },
                  }}
                  onClick={() => router.push(`/pages/admin/products-event/${product.id}`)}
                >
                  {product.images && product.images.length > 0 ? (
                    <Box
                      sx={{
                        width: "100%",
                        height: 70,
                        overflow: "hidden",
                        position: "relative",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: "30%",
                          background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={product.images[0].image_url}
                        alt={product.name}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 70,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: "rgba(255,255,255,0.4)",
                          fontSize: "0.625rem",
                          fontWeight: 500,
                        }}
                      >
                        Sem imagem
                      </Typography>
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 0.75, display: "flex", flexDirection: "column", gap: 0.375 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      sx={{ 
                        mb: 0, 
                        fontSize: "0.688rem",
                        lineHeight: 1.15,
                        color: "#fff",
                        letterSpacing: "0.03px",
                      }}
                    >
                      {product.name}
                    </Typography>
                    {product.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          mb: 0,
                          fontSize: "0.563rem",
                          lineHeight: 1.25,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          minHeight: "1.4rem",
                        }}
                      >
                        {product.description}
                      </Typography>
                    )}
                    <Box 
                      sx={{ 
                        display: "flex", 
                        justifyContent: "flex-start", 
                        alignItems: "center",
                        mt: "auto",
                        pt: 0.5,
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          px: 0.5,
                          py: 0.1,
                          borderRadius: "2px",
                          backgroundColor: product.status === "active" 
                            ? "rgba(76, 175, 80, 0.15)" 
                            : "rgba(244, 67, 54, 0.15)",
                          border: `1px solid ${product.status === "active" ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)"}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: product.status === "active" ? "#4caf50" : "#f44336",
                            fontSize: "0.5rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.15px",
                          }}
                        >
                          {product.status === "active" ? "Ativo" : "Inativo"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

