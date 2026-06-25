"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";

import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { EventResponse, getEventById, getEvents } from "@/app/services/events/eventAppService";
import {
  createLiveStand,
  deleteLiveStand,
  getLiveStandsByEvent,
  LiveStandResponse,
  updateLiveStand,
} from "@/app/services/liveStands/liveStandService";
import LiveStandFormDialog, {
  LiveStandFormValues,
} from "@/app/components/admin/live-stands/LiveStandFormDialog";

const STAND_IMAGES: { keys: string[]; image: string }[] = [
  {
    keys: ["coca"],
    image: "https://marcasmais.com.br/wp-content/uploads/2026/03/Banco-e-Samba-assinam-experiencias-da-Coca-Cola-Tic-Tac-Sprite-e-Schweppes-no-Lollapalooza-2026-3.jpg",
  },
  {
    keys: ["fiat"],
    image: "https://portalg.com.br/wp-content/uploads/2026/03/Fiat-transforma-fas-em-estrelas-com-experiencias-tecnologicas-no-Lollapalooza-2026-1068x588.webp",
  },
  {
    keys: ["sprite"],
    image: "https://gkpb.com.br/wp-content/uploads/2026/03/sprite-lollapalooza-gkpb-banner.jpg",
  },
  {
    keys: ["ballantine", "balatine"],
    image: "https://creativosbr.com.br/wp-content/uploads/2024/09/3D-do-estande-de-Johnnie-Walker-durante-o-Rock-in-Rio-Brasil-2024.png",
  },
  {
    keys: ["vivo"],
    image: "https://uploads.promoview.com.br/2025/09/Estande-Skyline_1.jpg",
  },
  {
    keys: ["samsung"],
    image: "https://t2.tudocdn.net/507931?w=1920",
  },
  {
    keys: ["volkswagen", "volks", "vw"],
    image: "https://marcasmais.com.br/wp-content/uploads/2025/09/Volkswagen-Tera-e-esportivos-VW-Legends-%E2%80%98dao-show-no-The-Town.jpg",
  },
];

function getStandFallbackImage(name: string, backendUrl?: string | null): string | null {
  if (backendUrl) return backendUrl;
  const lower = name.toLowerCase();
  for (const { keys, image } of STAND_IMAGES) {
    if (keys.some((k) => lower.includes(k))) return image;
  }
  return null;
}

function LiveStandsPageLoading() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress sx={{ color: "#ffcc01" }} />
    </Box>
  );
}

function LiveStandsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedEventId = Number(searchParams.get("eventId"));
  const { role, authReady } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [stands, setStands] = useState<LiveStandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const canAccessLiveStands = role === "admin_master" || role === "admin";

  const loadData = useCallback(async () => {
    if (!canAccessLiveStands) {
      return;
    }

    setLoading(true);

    try {
      let selectedEvent: EventResponse | null = null;

      if (requestedEventId) {
        selectedEvent = await getEventById(requestedEventId);
      } else {
        const events = await getEvents(50, 0);
        selectedEvent = events.find((item) => item.is_active) ?? null;
      }

      setEvent(selectedEvent);

      if (!selectedEvent) {
        setStands([]);
        return;
      }

      const HIDDEN = ["bauducco", "tic tac", "tictac", "eisenbahn", "piracanjuba"];
      const eventStands = await getLiveStandsByEvent(selectedEvent.id);
      setStands(eventStands.filter((s) => !HIDDEN.some((h) => s.name.toLowerCase().includes(h))));
    } catch (error: any) {
      console.error("Erro ao carregar estandes", error);
      showToast(error?.response?.data?.detail || "Erro ao carregar estandes", "error");
    } finally {
      setLoading(false);
    }
  }, [canAccessLiveStands, requestedEventId, showToast]);

  useEffect(() => {
    if (authReady && !canAccessLiveStands) {
      router.push("/pages/user/home");
    }
  }, [authReady, canAccessLiveStands, router]);

  useEffect(() => {
    if (authReady && canAccessLiveStands) {
      loadData();
    }
  }, [authReady, canAccessLiveStands, loadData]);

  const handleCreate = () => {
    setFormOpen(true);
  };

  const handleSubmit = async (values: LiveStandFormValues) => {
    if (!event) {
      showToast("Nenhum evento ativo encontrado", "warning");
      return;
    }

    setSaving(true);

    try {
      await createLiveStand({
        event_id: event.id,
        name: values.name,
        description: values.description,
        image: values.image,
        image_url: values.imageUrl || undefined,
      });
      showToast("Estande criado com sucesso", "success");

      setFormOpen(false);
      await loadData();
    } catch (error: any) {
      console.error("Erro ao salvar estande", error);
      showToast(error?.response?.data?.detail || "Erro ao salvar estande", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!authReady || loading) {
    return (
      <LiveStandsPageLoading />
    );
  }

  if (!canAccessLiveStands) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        py: { xs: 2, md: 3 },
        px: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <IconButton
            onClick={() => requestedEventId ? router.push(`/pages/admin/events/${requestedEventId}`) : router.push("/pages/admin/home")}
            sx={{
              color: "#fff",
              width: 44,
              height: 44,
              backgroundColor: "rgba(255,255,255,0.06)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          {event && (
            <IconButton
              onClick={handleCreate}
              sx={{
                width: 44,
                height: 44,
                backgroundColor: "#ffffff",
                color: "#111111",
                "&:hover": {
                  backgroundColor: "#e8e8e8",
                },
              }}
            >
              <AddIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.5 }}>
            Estandes ao vivo
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.92rem" }}>
            Veja os agendamentos de cada estande
          </Typography>
        </Box>

        {!event ? (
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
              Nenhum evento ativo
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
              Ative um evento para comecar a cadastrar os estandes ao vivo.
            </Typography>
          </Paper>
        ) : stands.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
              Nenhum estande cadastrado
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
              Toque no `+` para criar o primeiro estande.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {stands.map((stand) => (
              <Box
                key={stand.id}
                onClick={() =>
                  router.push(`/pages/admin/live-stands/${stand.id}/sessions?eventId=${event.id}`)
                }
                sx={{
                  cursor: "pointer",
                }}
              >
                {getStandFallbackImage(stand.name, stand.image_url) ? (
                  <Box
                    component="img"
                    src={getStandFallbackImage(stand.name, stand.image_url)!}
                    alt={stand.name}
                    sx={{
                      width: "100%",
                      height: { xs: 240, md: 360, lg: 420 },
                      objectFit: "cover",
                      borderRadius: 3,
                      display: "block",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: { xs: 240, md: 360, lg: 420 },
                      borderRadius: 3,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
                      {stand.name}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
                      Sem foto
                    </Typography>
                  </Box>
                )}

                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: { xs: "1.1rem", md: "1.35rem" },
                    mt: 1.5,
                    textAlign: "left",
                  }}
                >
                  {stand.name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Container>

      <LiveStandFormDialog
        open={formOpen}
        mode="create"
        stand={null}
        saving={saving}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
          }
        }}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}

export default function LiveStandsPage() {
  return (
    <Suspense fallback={<LiveStandsPageLoading />}>
      <LiveStandsPageContent />
    </Suspense>
  );
}
