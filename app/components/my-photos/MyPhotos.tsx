"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  Skeleton,
} from "@mui/material";
import {
  getMyPurchasedPhotos,
  PurchasedPhoto,
} from "@/app/services/myPhotos/myPhotosService";

interface MyPhotosProps {
  hideTitle?: boolean;
}

export default function MyPhotos({ hideTitle = false }: MyPhotosProps) {
  const [photos, setPhotos] = useState<PurchasedPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const data = await getMyPurchasedPhotos();
        setPhotos(data);
      } catch (err) {
        console.error("Erro ao carregar fotos compradas", err);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  if (loading) {
    return (
      <Box padding={2}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              variant="rectangular"
              width="100%"
              height={200}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (photos.length === 0) {
    return (
      <Box padding={2} textAlign="center">
        <Typography variant="body1" fontWeight={500} sx={{ color: "#fff", marginBottom: 1, fontSize: "0.9375rem" }}>
          Nenhuma foto comprada
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
          Você ainda não comprou nenhuma foto.
        </Typography>
      </Box>
    );
  }

  return (
    <Box padding={2}>
      {!hideTitle && (
        <Typography
          variant="h6"
          fontWeight={500}
          sx={{ color: "#fff", marginBottom: 2, fontSize: "1rem" }}
        >
          Minhas Fotos Compradas
        </Typography>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
        {photos.map((photo) => (
          <Card
            key={photo.id}
            sx={{
              backgroundColor: "transparent",
              boxShadow: "none",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <CardMedia
              component="img"
              image={photo.image_url}
              alt={`Foto ${photo.id}`}
              sx={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
            {photo.event_name && (
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  display: "block",
                  marginTop: 1,
                }}
              >
                {photo.event_name}
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                display: "block",
              }}
            >
              {new Date(photo.purchased_at).toLocaleDateString("pt-BR")}
            </Typography>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

