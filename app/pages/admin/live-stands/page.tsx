"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function LiveStandsPage() {
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

      const eventStands = await getLiveStandsByEvent(selectedEvent.id);
      setStands(eventStands);
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
            onClick={() => router.push("/pages/user/home")}
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
                backgroundColor: "#ff1f21",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#dc1416",
                },
              }}
            >
              <AddIcon />
            </IconButton>
          )}
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
                {stand.image_url ? (
                  <Box
                    component="img"
                    src={stand.image_url}
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
                      backgroundColor: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.45)",
                      fontSize: { xs: 16, md: 18 },
                    }}
                  >
                    Sem foto
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
