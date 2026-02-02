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
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ImageList,
  ImageListItem,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { getProductEventById, ProductEventResponse, deleteProductEvent } from "@/app/services/productsEvent/productEventService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import DeleteProductModal from "@/app/components/admin/products-event/DeleteProductModal";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);
  const { isAdmin, authReady } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductEventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authReady && !isAdmin) {
      router.push("/pages/user/home");
    }
  }, [isAdmin, router, authReady]);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductEventById(productId);
        setProduct(data);
      } catch (err: any) {
        console.error("Erro ao buscar produto", err);
        if (err?.response?.status === 404) {
          showToast("Produto não encontrado", "error");
          router.back();
        } else {
          showToast("Erro ao carregar produto", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router, showToast]);

  const handleDelete = async () => {
    if (!product) return;

    setDeleting(true);
    try {
      await deleteProductEvent(productId);
      showToast("Produto deletado com sucesso!", "success");
      router.push(`/pages/admin/events/${product.event_id}/products`);
    } catch (err: any) {
      showToast(err.message || "Erro ao deletar produto", "error");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

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

  if (!isAdmin) {
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

  return (
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
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
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
          onClick={() => router.push(`/pages/admin/events/${product.event_id}/products`)}
          size="medium"
          sx={{ color: "#fff", fontSize: "1.5rem" }}
        >
          <ArrowBackIosIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="h3" fontWeight={700} sx={{ color: "#fff", fontSize: { xs: "1rem", sm: "2rem" }, flex: 1 }}>
          {product.name}
        </Typography>
      </Box>

      {/* Conteúdo */}
      <Box
        sx={{
          flex: 1,
          p: { xs: 3, sm: 4 },
          maxWidth: 1000,
          width: "100%",
          mx: "auto",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* Imagens */}
          {product.images && product.images.length > 0 && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ color: "#fff" }}>
                  Fotos do Produto
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    onClick={() => router.push(`/pages/admin/products-event/${productId}/edit`)}
                    sx={{
                      backgroundColor: "#ffc91f",
                      color: "#000",
                      "&:hover": {
                        backgroundColor: "#ffd54f",
                      },
                      width: 40,
                      height: 40,
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => setDeleteModalOpen(true)}
                    sx={{
                      backgroundColor: "#d32f2f",
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "#c62828",
                      },
                      width: 40,
                      height: 40,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <ImageList cols={product.images.length > 1 ? 3 : 1} gap={8}>
                {product.images.map((image) => (
                  <ImageListItem key={image.id}>
                    <img
                      src={image.image_url}
                      alt={`${product.name} - Imagem ${image.image_order + 1}`}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

          {/* Informações */}
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 2, color: "#fff" }}>
              {product.name}
            </Typography>
            {product.description && (
              <Typography variant="body1" sx={{ mb: 3, color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                {product.description}
              </Typography>
            )}

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
              <Chip
                label={product.status === "active" ? "Ativo" : "Inativo"}
                sx={{
                  backgroundColor: product.status === "active" ? "rgba(76, 175, 80, 0.3)" : "rgba(244, 67, 54, 0.3)",
                  color: product.status === "active" ? "#4caf50" : "#f44336",
                  fontWeight: 600,
                  border: `1px solid ${product.status === "active" ? "#4caf50" : "#f44336"}`,
                }}
              />
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 2 }} />

            {/* Informações adicionais */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                Criado em: {new Date(product.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
              {product.updated_at && (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                  Atualizado em: {new Date(product.updated_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Modal de confirmação de exclusão */}
      <DeleteProductModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        productName={product.name}
        loading={deleting}
      />
    </Box>
  );
}

