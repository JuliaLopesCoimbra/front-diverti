"use client";

import { Box } from "@mui/material";
import { EventResponse } from "@/app/services/events/eventservice";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import { formatEventDates } from "@/app/utils/eventDateFormatter";

interface Props {
  event: EventResponse;
}

export default function EventDetails({ event }: Props) {
    const startDate = new Date(event.starts_at);
const endDate = new Date(event.ends_at);

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});
  return (
     <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#f4f7fc",
            backgroundImage: "url(/background/dashboard.png)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 32px",
            }}
          >
            {/* LOGO + TEXTO */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
           

              <strong style={{ fontSize: 22, color: "white" }}>Informações do Evento</strong>
            </div>
    
          </div>
    
          <main
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
    
              textAlign: "center",
            }}
          >
           {event.banner_image && (
        <Box
          component="img"
          src={event.banner_image}
          alt={event.title}
          sx={{
            width: "100%",
            maxHeight: 280,
            objectFit: "cover",
            borderRadius: 2,
          }}
        />
      )}
    
            <p
              style={{
                maxWidth: 700,
                marginTop: 16,
                fontSize: 13,
                padding: "30px",
                color: "white",
                textAlign: "left",
              }}
            >
             {event.description}
            </p>
    
            <p
              style={{
                maxWidth: 700,
                marginTop: 2,
                fontSize: 16,
                padding: "30px",
                color: "#000",
                textAlign: "left",
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  color: "white",
                  padding: "6px 10px",
                  fontWeight: 600,
                  display: "inline",
                
                }}
              >
                Prepare-se para sapucar como nunca antes. Te esperamos na Avenida!
              </span>
            </p>
            <Box
              sx={{
                maxWidth: 700,
                padding: "30px",
                alignSelf: "flex-start",
                color: "white",
              }}
              // className="border border-amber-600"
            >
              {/* DATA */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>
                  {formatEventDates(event)}
                </p>
              </Box>
    
              {/* HORÁRIO */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>
  {timeFormatter.format(startDate)} às {timeFormatter.format(endDate)}
</p>
              </Box>
    
              {/* LOCAL */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOnIcon style={{ color: "yellow" }} />
                <p style={{ margin: 0, fontSize: 15 }}>
                  Setor 2 - Marquês de Sapucaí
                </p>
              </Box>
            </Box>
          
          </main>
        </div>


  
  );
}
