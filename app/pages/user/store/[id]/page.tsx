"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { getProductEventById, ProductEventResponse } from "@/app/services/productsEvent/productEventService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import BottomNav from "@/app/components/layout/BottomNav";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);
  const { isAuthenticated, authReady } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductEventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.push("/pages/auth/login");
    }
  }, [isAuthenticated, router, authReady]);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductEventById(productId);
        // Só mostra se o produto estiver ativo
        if (data.status !== "active") {
          showToast("Produto não disponível", "error");
          router.push("/pages/user/store");
          return;
        }
        setProduct(data);
      } catch (err: any) {
        console.error("Erro ao buscar produto", err);
        if (err?.response?.status === 404) {
          showToast("Produto não encontrado", "error");
          router.push("/pages/user/store");
        } else {
          showToast("Erro ao carregar produto", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router, showToast]);

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

  if (loading) {
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

  if (!product) {
    return null;
  }

  const sortedImages = product.images ? [...product.images].sort((a, b) => a.image_order - b.image_order) : [];
  
  const handlePreviousImage = () => {
    if (sortedImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (sortedImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || sortedImages.length <= 1) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextImage();
    }
    if (isRightSwipe) {
      handlePreviousImage();
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundImage: "url(/background/dashboard.png)",
          height: "100vh",
          overflowY: "auto",
          backgroundColor: "#000",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "72px",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: { xs: 2, sm: 3 },
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <IconButton
            onClick={() => router.push("/pages/user/store")}
            size="medium"
            sx={{ color: "#fff", fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
          >
            <ArrowBackIosIcon fontSize="inherit" />
          </IconButton>
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{ color: "#fff", fontSize: { xs: "1rem", sm: "2rem" }, flex: 1 }}
          >
            {product.name}
          </Typography>
        </Box>

        {/* Conteúdo */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 4 },
            maxWidth: 1000,
            width: "100%",
            mx: "auto",
          }}
        >
          {/* Carrossel de Imagens - Destaque */}
          {sortedImages.length > 0 && (
            <Box
              sx={{
                position: "relative",
                width: "100%",
                mb: { xs: 2, sm: 3 },
                borderRadius: 3,
                overflow: "hidden",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Imagem Principal */}
              <Box
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: { xs: "1 / 1", sm: "4 / 3" },
                  overflow: "hidden",
                  touchAction: "pan-y",
                  userSelect: "none",
                }}
              >
                <Box
                  component="img"
                  src={sortedImages[currentImageIndex]?.image_url}
                  alt={`${product.name} - Imagem ${currentImageIndex + 1}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transition: "opacity 0.3s ease",
                  }}
                />

                {/* Botões de Navegação */}
                {sortedImages.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePreviousImage}
                      sx={{
                        position: "absolute",
                        left: { xs: 8, sm: 16 },
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(10px)",
                        color: "#fff",
                        width: { xs: 36, sm: 48 },
                        height: { xs: 36, sm: 48 },
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          transform: "translateY(-50%) scale(1.1)",
                        },
                        zIndex: 2,
                      }}
                    >
                      <NavigateBeforeIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                    </IconButton>

                    <IconButton
                      onClick={handleNextImage}
                      sx={{
                        position: "absolute",
                        right: { xs: 8, sm: 16 },
                        top: "50%",
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(10px)",
                        color: "#fff",
                        width: { xs: 36, sm: 48 },
                        height: { xs: 36, sm: 48 },
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          transform: "translateY(-50%) scale(1.1)",
                        },
                        zIndex: 2,
                      }}
                    >
                      <NavigateNextIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                    </IconButton>

                    {/* Indicador de Imagem Atual */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: { xs: 12, sm: 16 },
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: 1,
                        zIndex: 2,
                      }}
                    >
                      {sortedImages.map((_, index) => (
                        <Box
                          key={index}
                          onClick={() => handleImageClick(index)}
                          sx={{
                            width: { xs: 6, sm: 8 },
                            height: { xs: 6, sm: 8 },
                            borderRadius: "50%",
                            backgroundColor: index === currentImageIndex 
                              ? "#ffc91f" 
                              : "rgba(255, 255, 255, 0.4)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              backgroundColor: index === currentImageIndex 
                                ? "#ffd54f" 
                                : "rgba(255, 255, 255, 0.6)",
                              transform: "scale(1.2)",
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>

              {/* Miniaturas (se houver mais de uma imagem) */}
              {sortedImages.length > 1 && (
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    p: { xs: 1.5, sm: 2 },
                    overflowX: "auto",
                    "&::-webkit-scrollbar": {
                      height: 4,
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      borderRadius: 2,
                    },
                  }}
                >
                  {sortedImages.map((image, index) => (
                    <Box
                      key={image.id}
                      onClick={() => handleImageClick(index)}
                      sx={{
                        minWidth: { xs: 60, sm: 80 },
                        width: { xs: 60, sm: 80 },
                        height: { xs: 60, sm: 80 },
                        borderRadius: 2,
                        overflow: "hidden",
                        cursor: "pointer",
                        border: index === currentImageIndex 
                          ? "2px solid #ffc91f" 
                          : "2px solid transparent",
                        opacity: index === currentImageIndex ? 1 : 0.7,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          opacity: 1,
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      <Box
                        component="img"
                        src={image.image_url}
                        alt={`Miniatura ${index + 1}`}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Informações */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: { xs: 2, sm: 3 },
            }}
          >
            <Typography 
              variant="h4" 
              fontWeight={700} 
              sx={{ 
                mb: { xs: 1.5, sm: 2 }, 
                color: "#fff",
                fontSize: { xs: "1.25rem", sm: "2.125rem" },
              }}
            >
              {product.name}
            </Typography>
            {product.description && (
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  color: "rgba(255,255,255,0.8)", 
                  lineHeight: 1.8,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  maxWidth: { xs: "100%", sm: "600px" },
                }}
              >
                {product.description}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      <BottomNav />
    </>
  );
}

