"use client";

import { Box, Typography } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import { EventResponse } from "@/app/services/events/eventAppService";
import ZoomableImageCarousel from "@/app/components/common/ZoomableImageCarousel";
import ZoomableImage from "@/app/components/common/ZoomableImage";

interface EventMapProps {
  event: EventResponse;
}

export default function EventMap({ event }: EventMapProps) {
  // Se não houver mapa, mostra mensagem
  if (!event.map_images || event.map_images.length === 0) {
    if (!event.image_map) {
      return (
        <Box
          sx={{
            maxWidth: 700,
            width: "100%",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, marginBottom: 2 }}>
            <MapIcon style={{ color: "#fff" }} />
            <Typography
              variant="h6"
              sx={{
                margin: 0,
                color: "white",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Mapa do Evento
            </Typography>
          </Box>
          <Typography sx={{ color: "rgba(255,255,255,0.7)", mt: 2 }}>
            Mapa do evento ainda não foi cadastrado.
          </Typography>
        </Box>
      );
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 700,
        width: "100%",
        padding: "20px",
        margin: "0 auto",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, marginBottom: 2 }}>
        <MapIcon style={{ color: "#fff" }} />
        <Typography
          variant="h6"
          sx={{
            margin: 0,
            color: "white",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Mapa do Evento
        </Typography>
      </Box>
      {event.map_images && event.map_images.length > 0 ? (
        <ZoomableImageCarousel
          images={event.map_images.map(img => img.image_url)}
          maxHeight={600}
          borderRadius={2}
        />
      ) : event.image_map ? (
        <ZoomableImage
          src={event.image_map}
          alt="Mapa do Evento"
          maxHeight={600}
          borderRadius={2}
        />
      ) : null}
    </Box>
  );
}

