"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SchoolIcon from '@mui/icons-material/School';
import { useFeedCache } from "@/app/context/FeedCacheContext";
import { 
  getEventById, 
  EventResponse, 
  deleteEvent,
  updatePostApprovalRequirement,
  getPendingPostsCount,
} from "@/app/services/events/eventAppService";
import {
  getSambaSchoolsByEvent,
  SambaSchoolResponse,
} from "@/app/services/sambaSchools/sambaSchoolService";
import {
  getMusicLyricsByEvent,
  MusicLyricsResponse,
} from "@/app/services/musicLyrics/musicLyricsService";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import DeleteEventModal from "@/app/components/admin/events/DeleteEventModal";
import { formatEventDates } from "@/app/utils/eventDateFormatter";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  // ===== CACHE (Instagram/TikTok style) =====
  const { getCache, setCache } = useFeedCache();
  const cacheKey = `admin-event-details-${eventId}`;
  const [initialized, setInitialized] = useState(false);
  // =========================================

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [schools, setSchools] = useState<SambaSchoolResponse[]>([]);
  const [musics, setMusics] = useState<MusicLyricsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [updatingApproval, setUpdatingApproval] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loadingPendingCount, setLoadingPendingCount] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [schoolsOffset, setSchoolsOffset] = useState(0);
  const [musicsOffset, setMusicsOffset] = useState(0);
  const [hasMoreSchools, setHasMoreSchools] = useState(false);
  const [hasMoreMusics, setHasMoreMusics] = useState(false);
  const [loadingMoreSchools, setLoadingMoreSchools] = useState(false);
  const [loadingMoreMusics, setLoadingMoreMusics] = useState(false);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (!eventId || isDeleted) return;

    const fetchEvent = async () => {
      try {
        const data = await getEventById(eventId);
        setEvent(data);
      } catch (err: any) {
        console.error("Erro ao buscar evento", err);
        // Se o evento não foi encontrado (404), pode ter sido deletado
        if (err?.response?.status === 404) {
          showToast("Evento não encontrado ou foi deletado", "error");
          router.replace("/pages/user/home");
        } else {
          showToast("Erro ao carregar evento", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, showToast, router, isDeleted]);

  // Carrega a contagem de posts pendentes quando o evento é carregado
  useEffect(() => {
    if (!eventId || !isAdmin) return;

    const fetchPendingCount = async () => {
      try {
        setLoadingPendingCount(true);
        const data = await getPendingPostsCount(eventId);
        setPendingCount(data.pending_count);
      } catch (err) {
        console.error("Erro ao buscar contagem de posts pendentes", err);
      } finally {
        setLoadingPendingCount(false);
      }
    };

    fetchPendingCount();
  }, [eventId, isAdmin]);

  // ===== CACHE: Carregar escolas e músicas =====
  useEffect(() => {
    if (!eventId || initialized) return;

    console.log('🔍 [Admin Events] Verificando cache para:', cacheKey);
    // Tenta carregar do cache
    const cached = getCache(cacheKey);
    
    if (cached && cached.data.length > 0) {
      console.log('✅ [Admin Events] Cache encontrado!');
      // ✅ Dados encontrados no cache!
      const [cachedSchools, cachedMusics] = cached.data;
      console.log('📦 [Admin Events] Escolas:', cachedSchools?.length || 0, 'Músicas:', cachedMusics?.length || 0);
      setSchools(cachedSchools || []);
      setMusics(cachedMusics || []);
      setSchoolsOffset(cachedSchools?.length || 0);
      setMusicsOffset(cachedMusics?.length || 0);
      setHasMoreSchools((cachedSchools?.length || 0) >= ITEMS_PER_PAGE);
      setHasMoreMusics((cachedMusics?.length || 0) >= ITEMS_PER_PAGE);
      setLoadingSchools(false);
      setInitialized(true);
      
      // Restaura posição do scroll
      const targetPosition = cached.scrollPosition;
      console.log(`🎯 [Admin Events] RESTAURANDO SCROLL para: ${targetPosition}px`);
      
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      
      let attempts = 0;
      const maxAttempts = 20;
      
      const attemptRestore = () => {
        attempts++;
        const container = containerElementRef.current;
        
        if (container) {
          container.scrollTop = targetPosition;
        }
        
        const currentScroll = container?.scrollTop || 0;
        const diff = Math.abs(currentScroll - targetPosition);
        
        if (diff < 10) {
          console.log(`✅ [Admin Events] SUCESSO! Scroll restaurado em ${attempts} tentativas: ${currentScroll}px`);
        } else if (attempts < maxAttempts) {
          console.log(`⏳ [Admin Events] Tentativa ${attempts}: atual=${currentScroll}, target=${targetPosition}, diff=${diff}`);
          requestAnimationFrame(attemptRestore);
        } else {
          console.log(`⚠️ [Admin Events] Máximo de tentativas. Posição final: ${currentScroll}px`);
        }
      };
      
      requestAnimationFrame(attemptRestore);
      
      [50, 100, 200, 400, 800, 1600].forEach(delay => {
        setTimeout(() => {
          const container = containerElementRef.current;
          if (container) {
            container.scrollTop = targetPosition;
          }
        }, delay);
      });
    } else {
      console.log('❌ [Admin Events] Sem cache - carregando da API');
      // ❌ Sem cache - carrega da API
      const fetchSchoolsAndMusics = async () => {
        try {
          setLoadingSchools(true);
          const [schoolsData, musicsData] = await Promise.all([
            getSambaSchoolsByEvent(eventId, ITEMS_PER_PAGE, 0),
            getMusicLyricsByEvent(eventId, ITEMS_PER_PAGE, 0),
          ]);
          setSchools(schoolsData);
          setMusics(musicsData);
          setSchoolsOffset(schoolsData.length);
          setMusicsOffset(musicsData.length);
          setHasMoreSchools(schoolsData.length >= ITEMS_PER_PAGE);
          setHasMoreMusics(musicsData.length >= ITEMS_PER_PAGE);
        } catch (err) {
          console.error("Erro ao buscar escolas e músicas", err);
        } finally {
          setLoadingSchools(false);
        }
      };

      fetchSchoolsAndMusics();
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // ===== CACHE: Salvar scroll position ULTRA ROBUSTO =====
  const lastScrollPositionRef = useRef(0);
  const schoolsRef = useRef(schools);
  const musicsRef = useRef(musics);
  const cleanupFnRef = useRef<(() => void) | null>(null);
  const containerElementRef = useRef<HTMLDivElement | null>(null);
  
  // Atualiza refs quando schools/musics mudam
  useEffect(() => {
    schoolsRef.current = schools;
    musicsRef.current = musics;
  }, [schools, musics]);
  
  // Callback ref - chamado quando o elemento é montado/desmontado
  const scrollContainerRef = useCallback((container: HTMLDivElement | null) => {
    // Armazena a referência
    containerElementRef.current = container;
    
    // Limpa listeners anteriores se existirem
    if (cleanupFnRef.current) {
      console.log('🧹 [Admin Events] Limpando listeners anteriores');
      cleanupFnRef.current();
      cleanupFnRef.current = null;
    }
    
    if (!container) {
      console.log('⚠️ [Admin Events] Container desmontado');
      return;
    }
    
    console.log('✅ [Admin Events] Container montado! Configurando listeners...');
    
    let throttleTimeout: NodeJS.Timeout | null = null;
    const THROTTLE_MS = 400; // Otimizado para performance
    
    const updateScrollPosition = () => {
      const containerScroll = container.scrollTop;
      const containerMaxScroll = container.scrollHeight - container.clientHeight;
      
      console.log(`📊 [Admin Events] SCROLL DETECTADO (CONTAINER):`, {
        containerScrollTop: containerScroll,
        containerMaxScroll,
        containerScrollHeight: container.scrollHeight,
        containerClientHeight: container.clientHeight
      });
      
      lastScrollPositionRef.current = containerScroll;
      
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      throttleTimeout = setTimeout(() => {
        const currentSchools = schoolsRef.current;
        const currentMusics = musicsRef.current;
        if (currentSchools.length > 0 || currentMusics.length > 0) {
          setCache(cacheKey, [currentSchools, currentMusics], containerScroll);
          console.log(`💾 [Admin Events] Cache atualizado (scroll): ${containerScroll}px, escolas: ${currentSchools.length}, músicas: ${currentMusics.length}`);
        }
      }, THROTTLE_MS);
    };
    
    const handleScroll = () => {
      console.log('🔔 [Admin Events] Evento de scroll disparado!');
      updateScrollPosition();
    };
    
    const handlePageHide = () => {
      const currentSchools = schoolsRef.current;
      const currentMusics = musicsRef.current;
      if (currentSchools.length > 0 || currentMusics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [currentSchools, currentMusics], finalScroll);
        console.log(`💾 [Admin Events] Cache salvo (pagehide): ${finalScroll}px`);
      }
    };
    
    const handleBeforeUnload = () => {
      const currentSchools = schoolsRef.current;
      const currentMusics = musicsRef.current;
      if (currentSchools.length > 0 || currentMusics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [currentSchools, currentMusics], finalScroll);
        console.log(`💾 [Admin Events] Cache salvo (beforeunload): ${finalScroll}px`);
      }
    };
    
    const handleVisibilityChange = () => {
      const currentSchools = schoolsRef.current;
      const currentMusics = musicsRef.current;
      if (document.hidden && (currentSchools.length > 0 || currentMusics.length > 0)) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [currentSchools, currentMusics], finalScroll);
        console.log(`💾 [Admin Events] Cache salvo (visibilitychange): ${finalScroll}px`);
      }
    };
    
    const handleBlur = () => {
      const currentSchools = schoolsRef.current;
      const currentMusics = musicsRef.current;
      if (currentSchools.length > 0 || currentMusics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [currentSchools, currentMusics], finalScroll);
        console.log(`💾 [Admin Events] Cache salvo (blur): ${finalScroll}px`);
      }
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    // Armazena a função de cleanup
    cleanupFnRef.current = () => {
      if (throttleTimeout) clearTimeout(throttleTimeout);
      
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      
      const currentSchools = schoolsRef.current;
      const currentMusics = musicsRef.current;
      if (currentSchools.length > 0 || currentMusics.length > 0) {
        const finalScroll = lastScrollPositionRef.current;
        setCache(cacheKey, [currentSchools, currentMusics], finalScroll);
        console.log(`💾 [Admin Events] Cache salvo (cleanup): ${finalScroll}px`);
      }
    };
  }, [cacheKey, setCache]);

  const loadMoreSchools = async () => {
    if (!eventId || loadingMoreSchools || !hasMoreSchools) return;

    setLoadingMoreSchools(true);
    try {
      const newSchools = await getSambaSchoolsByEvent(eventId, ITEMS_PER_PAGE, schoolsOffset);
      if (newSchools.length > 0) {
        setSchools((prev) => [...prev, ...newSchools]);
        setSchoolsOffset((prev) => prev + newSchools.length);
        setHasMoreSchools(newSchools.length >= ITEMS_PER_PAGE);
      } else {
        setHasMoreSchools(false);
      }
    } catch (err) {
      console.error("Erro ao carregar mais escolas", err);
      showToast("Erro ao carregar mais escolas", "error");
    } finally {
      setLoadingMoreSchools(false);
    }
  };

  const loadMoreMusics = async () => {
    if (!eventId || loadingMoreMusics || !hasMoreMusics) return;

    setLoadingMoreMusics(true);
    try {
      const newMusics = await getMusicLyricsByEvent(eventId, ITEMS_PER_PAGE, musicsOffset);
      if (newMusics.length > 0) {
        setMusics((prev) => [...prev, ...newMusics]);
        setMusicsOffset((prev) => prev + newMusics.length);
        setHasMoreMusics(newMusics.length >= ITEMS_PER_PAGE);
      } else {
        setHasMoreMusics(false);
      }
    } catch (err) {
      console.error("Erro ao carregar mais músicas", err);
      showToast("Erro ao carregar mais músicas", "error");
    } finally {
      setLoadingMoreMusics(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    setDeleting(true);
    try {
      await deleteEvent(eventId);
      setIsDeleted(true); // Marca como deletado para evitar recarregar
      showToast("Evento excluído com sucesso!", "success");
      setDeleteModalOpen(false);
      // Redireciona imediatamente para evitar que o useEffect tente recarregar
      router.replace("/pages/user/home");
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, "error");
      } else {
        showToast("Erro ao excluir evento", "error");
      }
      throw err; // Re-throw para o modal tratar
    } finally {
      setDeleting(false);
    }
  };

  const handleApprovalChange = async (newValue: boolean) => {
    if (!event) return;

    // Se está desativando e há posts pendentes, abre modal de confirmação
    if (!newValue && pendingCount && pendingCount > 0) {
      setApprovalModalOpen(true);
      return;
    }

    // Se está ativando ou não há posts pendentes, atualiza diretamente
    await updateApprovalRequirement(newValue);
  };

  const updateApprovalRequirement = async (requiresApproval: boolean) => {
    if (!event) return;

    setUpdatingApproval(true);
    try {
      const updatedEvent = await updatePostApprovalRequirement(eventId, requiresApproval);
      setEvent(updatedEvent);
      showToast(
        requiresApproval 
          ? "Aprovação de posts ativada com sucesso!" 
          : "Aprovação de posts desativada. Posts pendentes foram aprovados automaticamente.",
        "success"
      );
      setApprovalModalOpen(false);
      
      // Atualiza a contagem de posts pendentes
      if (!requiresApproval) {
        setPendingCount(0);
      } else {
        const data = await getPendingPostsCount(eventId);
        setPendingCount(data.pending_count);
      }
    } catch (err: any) {
      showToast(
        err.response?.data?.detail || "Erro ao atualizar configuração de aprovação",
        "error"
      );
    } finally {
      setUpdatingApproval(false);
    }
  };

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

  if (!event) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography>Evento não encontrado.</Typography>
        <IconButton onClick={() => router.push("/pages/user/home")} sx={{ color: "#fff" }}>
          <ArrowBackIosIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        minHeight: "100vh",
        height: "100vh",
        overflowY: "auto",
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header com botão de voltar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "sticky",
          top: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={() => router.push("/pages/user/home")}
            size="small"
            sx={{ color: "#fff" }}
          >
            <ArrowBackIosIcon />
          </IconButton>
          <Typography  fontWeight={700} sx={{ color: "#fff", fontSize: "1.2rem" }}>
            Detalhes do Evento
          </Typography>
        </Box>

        {/* BOTÕES ADMIN */}
        {isAdmin && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={() => router.push(`/pages/admin/events/${eventId}/edit`)}
              sx={{ color: "#ffc91f" }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting}
              sx={{ color: "#ff3040" }}
            >
              {deleting ? (
                <CircularProgress size={20} sx={{ color: "#ff3040" }} />
              ) : (
                <DeleteIcon />
              )}
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Conteúdo */}
      <Box sx={{ p: 3, flex: 1 }}>
        {/* Banner */}
        {event.banner_image && (
          <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
            <Box
              component="img"
              src={event.banner_image}
              alt={event.title}
              sx={{
                width: 200,
                height: 200,
                objectFit: "cover",
                borderRadius: "50%",
                border: "3px solid rgba(255, 201, 31, 0.3)",
              }}
            />
          </Box>
        )}

        {/* Card Principal */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            p: 3,
            maxWidth: 900,
            mx: "auto",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* TÍTULO + STATUS */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography  fontWeight={700} sx={{ color: "#fff", fontSize: "1.2rem" }}>
              {event.title}
            </Typography>

            <Chip
              label={event.is_active ? "Ativo" : "Inativo"}
              sx={{
                backgroundColor: event.is_active
                  ? "rgba(46, 204, 113, 0.2)"
                  : "rgba(158, 158, 158, 0.2)",
                color: event.is_active ? "#2ecc71" : "#9e9e9e",
                fontWeight: 600,
                border: `1px solid ${event.is_active ? "rgba(46, 204, 113, 0.3)" : "rgba(158, 158, 158, 0.3)"}`,
              }}
            />
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }} />

          {/* DESCRIÇÃO */}
          <Box sx={{ mb: 3 }}>
            <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Descrição
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
              {event.description || "Sem descrição"}
            </Typography>
          </Box>

          {/* LOCALIZAÇÃO */}
          {event.location && (
            <Box sx={{ mb: 3 }}>
              <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Localização
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {event.location}
              </Typography>
            </Box>
          )}

          {/* DIAS DO EVENTO (event_dates) */}
          {event.event_dates && (
            <Box sx={{ mb: 3 }}>
              <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Dias do Evento
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem", lineHeight: 1.6 }}>
                {formatEventDates(event)}
              </Typography>
            </Box>
          )}

          {/* DATA E HORÁRIO DE INÍCIO */}
          {event.starts_at && (
            <Box sx={{ mb: 3 }}>
              <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Data e Horário de Início
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {new Date(event.starts_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          )}

          {/* DATA E HORÁRIO DE TÉRMINO */}
          {event.ends_at && (
            <Box sx={{ mb: 3 }}>
              <Typography fontWeight={600} mb={1.5} sx={{ color: "#ffc91f", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Data e Horário de Término
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {new Date(event.ends_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          )}

          {/* CONFIGURAÇÃO DE APROVAÇÃO DE POSTS */}
          {isAdmin && (
            <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!event.requires_post_approval}
                    onChange={(e) => handleApprovalChange(!e.target.checked)}
                    disabled={updatingApproval}
                    sx={{
                      color: "#ffc91f",
                      "&.Mui-checked": {
                        color: "#ffc91f",
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9375rem" }}>
                    Tirar aprovação de segunda etapa de aprovação de posts desse evento
                  </Typography>
                }
              />
              {pendingCount !== null && pendingCount > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "rgba(255, 193, 7, 0.8)",
                    mt: 1,
                    ml: 4.5,
                    fontSize: "0.8125rem",
                  }}
                >
                  {pendingCount} {pendingCount === 1 ? "post pendente" : "posts pendentes"}
                </Typography>
              )}
            </Box>
          )}
        </Paper>

        {/* AÇÕES ADMIN - CRIAR ESCOLA DE SAMBA E MÚSICA/LETRA */}
        {isAdmin && (
          <Box
            sx={{
              maxWidth: 900,
              mx: "auto",
              mt: 3,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              startIcon={<SchoolIcon />}
              onClick={() => router.push(`/pages/admin/samba-schools/create/${eventId}`)}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" },
                backgroundColor: "#ffc91f",
                color: "#000",
                fontWeight: 600,
                py: 1.5,
                borderRadius: "14px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#e6b800",
                },
              }}
            >
              Adicionar Escola de Samba
            </Button>
            <Button
              variant="contained"
              startIcon={<MusicNoteIcon />}
              onClick={() => router.push(`/pages/admin/music-lyrics/create/${eventId}`)}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" },
                backgroundColor: "#ffc91f",
                color: "#000",
                fontWeight: 600,
                py: 1.5,
                borderRadius: "14px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#e6b800",
                },
              }}
            >
              Adicionar Música/Letra
            </Button>
          </Box>
        )}

        {/* LISTA DE ESCOLAS DE SAMBA */}
        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            mt: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff" }}>
              <SchoolIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Escolas de Samba
            </Typography>
          </Box>

          {loadingSchools ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress sx={{ color: "#ffc91f" }} />
            </Box>
          ) : schools.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 3,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                Nenhuma escola de samba cadastrada.
              </Typography>
            </Paper>
          ) : (
            schools.map((school) => (
              <Paper
                key={school.id}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  p: 2,
                  mb: 2,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    transform: "translateY(-2px)",
                    border: "1px solid rgba(255, 201, 31, 0.3)",
                  },
                }}
                onClick={() =>
                  router.push(
                    `/pages/admin/samba-schools/${eventId}/${school.id}`
                  )
                }
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {school.image_url && (
                    <Box
                      component="img"
                      src={school.image_url}
                      alt={school.name}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{ color: "#fff", mb: 0.5 }}
                    >
                      {school.name}
                    </Typography>
                    {school.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.7)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {school.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Box>

        {/* LISTA DE MÚSICAS/LETRAS */}
        <Box
          sx={{
            maxWidth: 900,
            mx: "auto",
            mt: 4,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ color: "#fff" }}>
              <MusicNoteIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Músicas/Letras
            </Typography>
          </Box>

          {loadingSchools ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress sx={{ color: "#ffc91f" }} />
            </Box>
          ) : musics.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 3,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
                Nenhuma música/letra cadastrada.
              </Typography>
            </Paper>
          ) : (
            <>
              {musics.map((music) => (
                <Paper
                  key={music.id}
                  elevation={0}
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 3,
                    p: 2,
                    mb: 2,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      transform: "translateY(-2px)",
                      border: "1px solid rgba(255, 201, 31, 0.3)",
                    },
                  }}
                  onClick={() =>
                    router.push(
                      `/pages/admin/music-lyrics/${eventId}/${music.id}`
                    )
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {music.image_url && (
                      <Box
                        component="img"
                        src={music.image_url}
                        alt={music.song_name}
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ color: "#fff", mb: 0.5 }}
                      >
                        {music.song_name}
                      </Typography>
                      {music.singer && (
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5 }}
                        >
                          Cantor: {music.singer}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.6)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {music.lyrics}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
              
              {/* Botão para carregar mais músicas */}
              {hasMoreMusics && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
                  <Button
                    onClick={loadMoreMusics}
                    disabled={loadingMoreMusics}
                    variant="outlined"
                    sx={{
                      color: "rgba(255,255,255,0.9)",
                      borderColor: "rgba(255,255,255,0.3)",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(5px)",
                      textTransform: "none",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      padding: "8px 24px",
                      minWidth: "200px",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.5)",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                      },
                      "&:disabled": {
                        color: "rgba(255,255,255,0.5)",
                        borderColor: "rgba(255,255,255,0.2)",
                        backgroundColor: "rgba(255,255,255,0.03)",
                      },
                    }}
                  >
                    {loadingMoreMusics ? (
                      <>
                        <CircularProgress size={16} sx={{ color: "#ffc91f", mr: 1 }} />
                        Carregando...
                      </>
                    ) : (
                      "Carregar mais músicas"
                    )}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Modal de Exclusão */}
      {event && (
        <DeleteEventModal
          open={deleteModalOpen}
          eventTitle={event.title}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}

      {/* Modal de confirmação para desativar aprovação */}
      <Dialog
        open={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "#fff",
            border: "1px solid rgba(255, 201, 31, 0.3)",
          },
        }}
      >
        <DialogTitle sx={{ color: "#ffc91f", fontWeight: 600 }}>
          Confirmar Desativação de Aprovação
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.9)", mb: 2 }}>
            Ao desativar a aprovação de posts, todos os posts pendentes serão automaticamente aprovados e publicados no feed.
          </DialogContentText>
          {pendingCount !== null && pendingCount > 0 && (
            <DialogContentText sx={{ color: "#ffc91f", fontWeight: 600 }}>
              {pendingCount} {pendingCount === 1 ? "post pendente será aprovado" : "posts pendentes serão aprovados"}.
            </DialogContentText>
          )}
          <DialogContentText sx={{ color: "rgba(255,255,255,0.7)", mt: 2, fontSize: "0.875rem" }}>
            Deseja continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setApprovalModalOpen(false)}
            sx={{ color: "rgba(255,255,255,0.7)" }}
            disabled={updatingApproval}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => updateApprovalRequirement(false)}
            variant="contained"
            sx={{
              backgroundColor: "#ffc91f",
              color: "#000",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#e6b800",
              },
            }}
            disabled={updatingApproval}
          >
            {updatingApproval ? (
              <CircularProgress size={20} sx={{ color: "#000" }} />
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
