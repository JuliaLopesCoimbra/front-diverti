"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { EventResponse } from "@/app/services/events/eventAppService";
import { useFeedCache } from "@/app/context/FeedCacheContext";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import { formatEventDates } from "@/app/utils/eventDateFormatter";

interface Props {
  event: EventResponse;
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box
      sx={{
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        p: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.6 }}>
        <Box sx={{ color: "rgba(255,255,255,0.45)", display: "flex" }}>{icon}</Box>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography sx={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
        {value}
      </Typography>
    </Box>
  );
}

const formatTime = (timeStr: string | undefined): string => {
  if (!timeStr) return "";
  return timeStr.substring(0, 5);
};

export default function EventDetails({ event }: Props) {
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `event-details-${event.id}`;
  const lastScrollPositionRef = useRef(0);
  const searchParams = useSearchParams();
  const scrollExecutedRef = useRef(false);

  useEffect(() => {
    const cached = getCache(cacheKey);
    if (cached && cached.scrollPosition > 0) {
      const targetPosition = cached.scrollPosition;
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      let attempts = 0;
      const attemptRestore = () => {
        attempts++;
        window.scrollTo({ top: targetPosition, behavior: "instant" as ScrollBehavior });
        const diff = Math.abs(window.scrollY - targetPosition);
        if (diff >= 10 && attempts < 20) requestAnimationFrame(attemptRestore);
      };
      requestAnimationFrame(attemptRestore);
      [50, 100, 200, 400, 800].forEach((d) =>
        setTimeout(() => window.scrollTo({ top: targetPosition, behavior: "instant" as ScrollBehavior }), d)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400;
    const onScroll = () => {
      const cur = window.scrollY;
      lastScrollPositionRef.current = cur;
      if (throttleTimeout) clearTimeout(throttleTimeout);
      throttleTimeout = setTimeout(() => setCache(cacheKey, [], cur), THROTTLE_MS);
    };
    const save = () => setCache(cacheKey, [], lastScrollPositionRef.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
    window.addEventListener("blur", save);
    return () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", save);
      window.removeEventListener("blur", save);
      save();
    };
  }, [cacheKey, setCache]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const scrollToLineup = urlParams.get("scrollToLineup");
    if (!scrollToLineup || !event.line_up || scrollExecutedRef.current) return;
    const eventIdParam = urlParams.get("eventId");
    if (eventIdParam && parseInt(eventIdParam) !== event.id) return;

    const tryScroll = () => {
      const el = document.getElementById("event-lineup-section");
      if (!el) { setTimeout(tryScroll, 200); return; }
      scrollExecutedRef.current = true;
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        const target = window.pageYOffset + rect.top - 100;
        window.scrollTo({ top: target, behavior: "smooth" });
        el.style.borderLeft = "4px solid white";
        el.style.transition = "border-left 0.3s ease";
        setTimeout(() => { el.style.borderLeft = ""; }, 3000);
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("scrollToLineup");
          url.searchParams.delete("eventId");
          window.history.replaceState({}, "", url.toString());
          scrollExecutedRef.current = false;
        }, 4500);
      }, 100);
    };
    setTimeout(tryScroll, 300);
  }, [event.id, event.line_up]);

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        pt: 2,
        pb: 6,
        maxWidth: "600px",
        mx: "auto",
        width: "100%",
      }}
    >
      {/* Hero Banner */}
      {event.banner_image ? (
        <Box sx={{ position: "relative", borderRadius: "20px", overflow: "hidden", mb: 2.5 }}>
          <Box
            component="img"
            src={event.banner_image}
            alt={event.title}
            sx={{
              width: "100%",
              height: { xs: 200, sm: 260 },
              objectFit: "cover",
              display: "block",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)",
            }}
          />
          <Box
            sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 2.5, pb: 2.5 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.75 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: event.is_active ? "#2ecc71" : "rgba(255,255,255,0.4)",
                  flexShrink: 0,
                  boxShadow: event.is_active ? "0 0 6px rgba(46,204,113,0.8)" : "none",
                }}
              />
              <Typography
                sx={{
                  color: event.is_active ? "#2ecc71" : "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {event.is_active ? "Ao vivo" : "Encerrado"}
              </Typography>
            </Box>
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: { xs: "1.5rem", md: "1.9rem" },
                lineHeight: 1.15,
                textShadow: "0 2px 12px rgba(0,0,0,0.7)",
              }}
            >
              {event.title}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mb: 2.5, pt: 1 }}>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "1.5rem", md: "1.9rem" } }}>
            {event.title}
          </Typography>
        </Box>
      )}

      {/* Description */}
      {event.description && (
        <Box
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            p: 2,
            mb: 2,
          }}
        >
          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.7 }}>
            {event.description}
          </Typography>
        </Box>
      )}

      {/* Info grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, 1fr)" },
          gap: 1.5,
          mb: 2,
        }}
      >
        {event.event_dates && (
          <InfoCard
            icon={<EventIcon sx={{ fontSize: 15 }} />}
            label="Datas"
            value={formatEventDates(event)}
          />
        )}
        {event.starts_at && (
          <InfoCard
            icon={<AccessTimeIcon sx={{ fontSize: 15 }} />}
            label="Início"
            value={new Date(event.starts_at).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}
        {event.ends_at && (
          <InfoCard
            icon={<AccessTimeIcon sx={{ fontSize: 15 }} />}
            label="Término"
            value={new Date(event.ends_at).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}
        {event.location && (
          <InfoCard
            icon={<LocationOnIcon sx={{ fontSize: 15 }} />}
            label="Local"
            value={event.location}
          />
        )}
      </Box>

      {/* Van Transport */}
      {(event.van_arrival_time_start || event.van_departure_time_start) && (
        <Box
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            p: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <DirectionsBusIcon sx={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }} />
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
              Transporte (Vans)
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {(event.van_arrival_time_start || event.van_arrival_time_end) && (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>Ida</Typography>
                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
                  {formatTime(event.van_arrival_time_start)}
                  {event.van_arrival_time_start && event.van_arrival_time_end ? " às " : ""}
                  {formatTime(event.van_arrival_time_end)}
                </Typography>
              </Box>
            )}
            {(event.van_departure_time_start || event.van_departure_time_end) && (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>Volta</Typography>
                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
                  {formatTime(event.van_departure_time_start)}
                  {event.van_departure_time_start && event.van_departure_time_end ? " às " : ""}
                  {formatTime(event.van_departure_time_end)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Meeting Point */}
      {(event.meeting_point_location ||
        (event.meeting_point_schedule && event.meeting_point_schedule.length > 0)) && (
        <Box
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            p: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <MeetingRoomIcon sx={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }} />
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
              Meeting Point
            </Typography>
          </Box>
          {event.meeting_point_location && (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
              <LocationOnIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 16, mt: "2px", flexShrink: 0 }} />
              <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                {event.meeting_point_location}
              </Typography>
            </Box>
          )}
          {event.meeting_point_schedule && event.meeting_point_schedule.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {event.meeting_point_schedule.map((schedule, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: "12px",
                    p: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                    <EventIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }} />
                    <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600 }}>
                      Dias {schedule.days.join(", ")} de fevereiro
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <AccessTimeIcon sx={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }} />
                    <Typography sx={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                      {schedule.start_time} às {schedule.end_time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Buy Tickets CTA */}
      <Box sx={{ pt: 1 }}>
        <Button
          component="a"
          href="https://www.totalacesso.com/events/71festadopeaodeboiadeirodebarretos2026"
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          sx={{
            backgroundColor: "#ffffff",
            color: "#111111",
            fontWeight: 700,
            py: 1.75,
            borderRadius: "14px",
            textTransform: "none",
            fontSize: 15,
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            "&:hover": { backgroundColor: "#e8e8e8" },
          }}
        >
          Comprar ingressos
        </Button>
      </Box>
    </Box>
  );
}
