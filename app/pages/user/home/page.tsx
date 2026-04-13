"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box } from "@mui/material";
import HomeHeader from "@/app/components/home/HeaderHome";
import HomeTabs from "@/app/components/home/HomeTabs";
import BottomNav from "@/app/components/layout/BottomNav";
import { EventResponse, getEvents } from "@/app/services/events/eventAppService";
import { Skeleton } from "@mui/material";
import NewsFeed from "@/app/components/home/NewsFeed";
import AdBanner from "@/app/components/ads/AdBanner";
import EventDetails from "@/app/components/home/EventDetails";
import InteractiveStandMap from "@/app/components/home/InteractiveStandMap";
import { useAuth } from "@/app/context/AuthContext";
import PhotoAI from "@/app/components/home/PhotoAI";
import EventMap from "@/app/components/home/EventMap";
import LineUp from "@/app/components/home/LineUp";
import EventIndisponivel from "@/app/components/event/EventIndisponivel";
import NotificationPermissionPopup from "@/app/components/home/NotificationPermissionPopup";
import DashboardRoulette from "@/app/components/home/DashboardRoulette";
import { getProfile, ProfileResponse } from "@/app/services/profile/profileService";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/app/services/notifications/notificationPreferenceService";
import { subscribeForPush } from "@/app/services/notifications/pushService";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

const NOTIFICATION_POPUP_DISMISSED_KEY = "n1_notification_popup_dismissed_at";
const NOTIFICATION_POPUP_DISMISS_DAYS = 7;

const STORAGE_KEY = "selectedEventId";
const SCROLL_KEY = "homeScrollY";
const TAB_KEY = "homeActiveTab";

type Tab = "home" | "eventos" | "estandes" | "mapa" | "lineup" | "foto" | "roleta";

const VALID_TABS: Tab[] = ["home", "eventos", "estandes", "mapa", "lineup", "foto", "roleta"];

const normalizeTab = (tab: string | null): Tab | null => {
  if (!tab) return null;
  if (tab === "enredo") return "roleta";
  return VALID_TABS.includes(tab as Tab) ? (tab as Tab) : null;
};

const HomeContent: React.FC = () => {
  const searchParams = useSearchParams();
  // Inicializa sempre "home" para evitar hydration mismatch (server vs client).
  // A aba é sincronizada da URL/sessionStorage no useEffect.
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const currentEventIdRef = useRef<number | null>(null);
  const isCheckingRef = useRef(false); // Previne múltiplas verificações simultâneas
  const scrollExecutedRef = useRef(false);
  const router = useRouter();
  const { isAdmin, authReady, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [pushPopupLoading, setPushPopupLoading] = useState(false);

  // Persist tab selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TAB_KEY, activeTab);
    }
  }, [activeTab]);

  // Controla animações quando a aba muda
  useEffect(() => {
    setShouldAnimate(true);
    // Reset animação após um tempo para permitir nova animação na próxima mudança
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Monitora mudanças na URL e atualiza a aba e evento se necessário
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Usa searchParams se disponível, senão lê diretamente da URL
    const urlParams = searchParams 
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams(window.location.search);
    
    const urlTab = normalizeTab(urlParams.get("tab"));
    const urlEventId = urlParams.get("eventId") || urlParams.get("event"); // Suporta ambos "eventId" e "event"

    // Define aba: URL tem prioridade, senão sessionStorage, senão "home"
    const targetTab: Tab =
      urlTab ??
      (() => {
        const saved = normalizeTab(sessionStorage.getItem(TAB_KEY));
        return saved ?? "home";
      })();
    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }

    // Atualiza o evento se houver parâmetro na URL e eventos já carregados
    if (urlEventId && events.length > 0) {
      const urlId = parseInt(urlEventId, 10);
      const urlEvent = events.find((event) => event.id === urlId);
      if (urlEvent && (!currentEvent || currentEvent.id !== urlEvent.id)) {
        setCurrentEvent(urlEvent);
        currentEventIdRef.current = urlEvent.id;
        localStorage.setItem(STORAGE_KEY, urlEvent.id.toString());
        
        // Limpa o parâmetro event/eventId da URL após processar, mas mantém tab se existir
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("event");
        newUrl.searchParams.delete("eventId");
        // Mantém outros parâmetros como "tab" e "post" se existirem
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  }, [searchParams, events, currentEvent]); // Removido activeTab das dependências para evitar loop

  // Scroll para o line up quando houver o parâmetro scrollToLineup na URL
  useEffect(() => {
    const scrollToLineup = searchParams?.get("scrollToLineup");
    const eventIdParam = searchParams?.get("eventId");
    
    if (!scrollToLineup || !currentEvent || !currentEvent.line_up || scrollExecutedRef.current || activeTab !== "eventos") {
      return;
    }
    
    // Verifica se é o evento correto
    if (eventIdParam && parseInt(eventIdParam) !== currentEvent.id) {
      return;
    }

    const tryScrollToLineup = () => {
      const lineupElement = document.getElementById("event-lineup-section");
      
      if (!lineupElement) {
        // Tenta novamente após um delay se o elemento ainda não estiver renderizado
        setTimeout(tryScrollToLineup, 200);
        return;
      }

      scrollExecutedRef.current = true;

      // Encontra o container scrollável
      let scrollContainer: HTMLElement | null = null;
      
      // Procura pelo elemento scrollável mais próximo
      let parent = lineupElement.parentElement;
      while (parent && parent !== document.body) {
        const hasScroll = parent.scrollHeight > parent.clientHeight;
        if (hasScroll || getComputedStyle(parent).overflowY !== "visible") {
          scrollContainer = parent;
          break;
        }
        parent = parent.parentElement;
      }

      // Se não encontrou, usa window
      if (!scrollContainer) {
        scrollContainer = document.documentElement;
      }

      // Função para fazer scroll e destacar
      const highlightAndScroll = () => {
        const rect = lineupElement.getBoundingClientRect();
        const containerRect = scrollContainer === document.documentElement 
          ? { top: 0, left: 0 } 
          : scrollContainer!.getBoundingClientRect();
        
        const scrollTop = scrollContainer === document.documentElement
          ? window.pageYOffset || document.documentElement.scrollTop
          : scrollContainer!.scrollTop;
        
        const targetScroll = scrollTop + rect.top - containerRect.top - 100; // 100px de margem

        // Aplica destaque visual
        lineupElement.style.borderLeft = "4px solid white";
        lineupElement.style.transition = "border-left 0.3s ease";

        // Faz scroll
        if (scrollContainer === document.documentElement) {
          window.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        } else {
          scrollContainer!.scrollTo({
            top: targetScroll,
            behavior: "smooth",
          });
        }

        // Remove o destaque após 3 segundos
        setTimeout(() => {
          lineupElement.style.borderLeft = "";
        }, 3000);

        // Remove o parâmetro da URL após 4.5 segundos
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("scrollToLineup");
          url.searchParams.delete("eventId");
          url.searchParams.delete("tab");
          window.history.replaceState({}, "", url.toString());
          scrollExecutedRef.current = false; // Permite scroll novamente se necessário
        }, 4500);
      };

      // Aguarda um pouco para garantir que o layout está estável
      setTimeout(highlightAndScroll, 100);
    };

    // Aguarda um pouco antes de tentar fazer scroll
    setTimeout(tryScrollToLineup, 300);
  }, [currentEvent, activeTab, searchParams]);

  // Função para verificar e atualizar eventos
  const checkAndUpdateEvents = useCallback(async () => {
    // Previne múltiplas chamadas simultâneas
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      const data = await getEvents();
      setEvents(data);
      
      const currentId = currentEventIdRef.current;
      if (currentId) {
        const updatedEvent = data.find((event) => event.id === currentId);
          
        // Se o evento não foi encontrado (foi deletado), troca para um ativo
        if (!updatedEvent) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            currentEventIdRef.current = activeEvent.id;
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
          } else {
            // Não há eventos disponíveis
            setCurrentEvent(null);
            currentEventIdRef.current = null;
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        // Se o evento atual foi desativado e o usuário NÃO é admin/subadmin, troca para um ativo
        else if (!updatedEvent.is_active && !isAdmin) {
          const activeEvent = data.find((event) => event.is_active);
          if (activeEvent) {
            setCurrentEvent(activeEvent);
            currentEventIdRef.current = activeEvent.id;
            localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
          } else {
            // Não há eventos ativos disponíveis para usuário não-admin
            setCurrentEvent(null);
            currentEventIdRef.current = null;
          }
        } else if (updatedEvent) {
          // Atualiza o evento atual com os dados mais recentes
          setCurrentEvent(updatedEvent);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar eventos:", error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [isAdmin]);

  // Função para salvar evento selecionado no localStorage
  const handleSelectEvent = (event: EventResponse) => {
    localStorage.setItem(STORAGE_KEY, event.id.toString());
    setCurrentEvent(event);
    currentEventIdRef.current = event.id;
    
    // Limpa parâmetros event/eventId da URL para permitir troca livre
    const url = new URL(window.location.href);
    url.searchParams.delete("event");
    url.searchParams.delete("eventId");
    window.history.replaceState({}, "", url.toString());
    
    // Verifica eventos quando o usuário troca manualmente
    checkAndUpdateEvents();
  };

  useEffect(() => {
    // restaura scroll salvo apenas se não estiver na aba "home" (NewsFeed cuida disso)
    // ou se não houver cache do feed
    const savedScroll = sessionStorage.getItem(SCROLL_KEY);
    if (savedScroll && activeTab !== "home") {
      // Aguarda um pouco para garantir que o conteúdo está renderizado
      setTimeout(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScroll, 10) || 0);
        });
      }, 100);
    }
    const onScroll = () => {
      // Só salva scroll se não estiver na aba "home" (NewsFeed cuida disso)
      if (activeTab !== "home") {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      }
    };
    window.addEventListener("scroll", onScroll);

    // Se BottomNav marcou para restaurar home (volta da my-photos/liked), não mudar aba
    // Caso contrário, deixar aba conforme saved/default
    const forceRestore = sessionStorage.getItem("forceHomeRestore");
    if (forceRestore) {
      sessionStorage.removeItem("forceHomeRestore");
    }

    // Aguarda o contexto de autenticação estar pronto
    if (!authReady) {
      return () => window.removeEventListener("scroll", onScroll);
    }

    // Carrega o perfil do usuário
    const fetchProfile = async () => {
      try {
        const profileData = await getProfile();
        setProfile(profileData);
        setProfileLoaded(true);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        setProfileLoaded(true); // Marca como carregado mesmo em caso de erro para não travar a tela
      }
    };

    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
        setEventsLoaded(true);
        
        if (data.length > 0) {
          // Verifica se há eventId ou event na URL (vindo de notificação)
          const urlParams = new URLSearchParams(window.location.search);
          const urlEventId = urlParams.get("eventId") || urlParams.get("event");
          if (urlEventId) {
            const urlId = parseInt(urlEventId, 10);
            const urlEvent = data.find((event) => event.id === urlId);
            if (urlEvent) {
              setCurrentEvent(urlEvent);
              currentEventIdRef.current = urlEvent.id;
              localStorage.setItem(STORAGE_KEY, urlEvent.id.toString());
              // Se houver tab na URL, atualiza a aba
              const urlTab = normalizeTab(urlParams.get("tab"));
              if (urlTab) {
                setActiveTab(urlTab);
              }
              
              // Limpa o parâmetro event/eventId da URL após processar para permitir troca manual
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete("event");
              newUrl.searchParams.delete("eventId");
              // Mantém outros parâmetros como "tab" e "post" se existirem
              window.history.replaceState({}, "", newUrl.toString());
              
              return;
            }
          }
          
          // Tenta carregar o evento salvo do localStorage
          const savedEventId = localStorage.getItem(STORAGE_KEY);
          if (savedEventId) {
            const savedId = parseInt(savedEventId, 10);
            const savedEvent = data.find((event) => event.id === savedId);
            if (savedEvent) {
              // Se o evento salvo foi desativado e o usuário NÃO é admin/subadmin, troca para um ativo
              if (!savedEvent.is_active && !isAdmin) {
                const activeEvent = data.find((event) => event.is_active);
                if (activeEvent) {
                  setCurrentEvent(activeEvent);
                  currentEventIdRef.current = activeEvent.id;
                  localStorage.setItem(STORAGE_KEY, activeEvent.id.toString());
                } else {
                  // Não há eventos ativos, mas mantém o evento salvo para admin
                  setCurrentEvent(savedEvent);
                  currentEventIdRef.current = savedEvent.id;
                }
              } else {
                // Admin/subadmin podem permanecer em eventos desativados
                setCurrentEvent(savedEvent);
                currentEventIdRef.current = savedEvent.id;
              }
              return;
            }
          }
          // Se não encontrou evento salvo ou não existe mais, usa o primeiro ativo ou o primeiro disponível
          const activeEvent = data.find((event) => event.is_active);
          const selectedEvent = activeEvent || (isAdmin ? data[0] : null);
          if (selectedEvent) {
            setCurrentEvent(selectedEvent);
            currentEventIdRef.current = selectedEvent.id;
          }
        } else {
          // Não há eventos disponíveis
          setEventsLoaded(true);
        }
      } catch {
        setEventsLoaded(true);
        router.push("/");
      }
    };

    // Carrega eventos e perfil em paralelo
    Promise.all([fetchEvents(), fetchProfile()]);

    // Verifica quando a página/aba fica visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndUpdateEvents();
      }
    };

    // Verifica quando a janela ganha foco
    const handleFocus = () => {
      checkAndUpdateEvents();
    };

    // Adiciona listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener("scroll", onScroll);
    };
  }, [router, isAdmin, authReady, checkAndUpdateEvents, activeTab]);

  // Popup de permissão de notificações na tela inicial (uma vez por período ou até ativar)
  useEffect(() => {
    if (typeof window === "undefined" || !authReady || !isAuthenticated || !profileLoaded) return;
    const dismissedAt = localStorage.getItem(NOTIFICATION_POPUP_DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < NOTIFICATION_POPUP_DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const prefs = await getNotificationPreferences();
        if (cancelled || prefs.push_enabled) return;
        setShowNotificationPopup(true);
      } catch {
        // Ignora erro (ex.: usuário não autenticado na API)
      }
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [authReady, isAuthenticated, profileLoaded]);

  const handleNotificationPopupAllow = async () => {
    setPushPopupLoading(true);
    try {
      await subscribeForPush();
      await updateNotificationPreferences({ push_enabled: true });
      setShowNotificationPopup(false);
      showToast("Notificações push ativadas com sucesso.", "success");
    } catch (e: any) {
      showToast(
        e?.message || "Não foi possível ativar. Tente novamente nas preferências de notificações.",
        "error"
      );
    } finally {
      setPushPopupLoading(false);
    }
  };

  const handleNotificationPopupDismiss = () => {
    localStorage.setItem(NOTIFICATION_POPUP_DISMISSED_KEY, String(Date.now()));
    setShowNotificationPopup(false);
  };

  // Se não há eventos ativos disponíveis para usuário não-admin, mostra Evento Indisponível
  if (eventsLoaded && !currentEvent) {
    const hasActiveEvents = events.some((event) => event.is_active);
    if (!isAdmin && !hasActiveEvents) {
      return <EventIndisponivel />;
    }
  }

  // Todas as abas usam o fundo responsivo (prizebackgroundpc no PC, dashboard no mobile)
  const pageBackgroundSx = dashboardBackgroundSx;

  // Mostra skeleton até que tanto o evento quanto o perfil estejam carregados
  if (!currentEvent || !profileLoaded) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          ...pageBackgroundSx,
          paddingBottom: "72px",
        }}
      >
        {/* Header Skeleton */}
        <Box
          sx={{
            padding: 2,
            borderBottom: "solid 1px rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Skeleton
                variant="rectangular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.4,
            }}
          >
            <Skeleton
              variant="text"
              width={200}
              height={24}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
            <Skeleton
              variant="text"
              width={120}
              height={20}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
        </Box>

        {/* Tabs Skeleton */}
        <Box sx={{ display: "flex", gap: 1, padding: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={100}
              height={36}
              sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: "999px" }}
            />
          ))}
        </Box>

        {/* Content Skeleton */}
        <Box padding={2}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={200}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2, mb: 2 }}
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={150}
            sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2 }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          ...pageBackgroundSx,
          paddingBottom: "72px", // espaço pro rodapé
        }}
      >
        {/* Header com nome, foto e data */}
        <Box className={shouldAnimate ? "slide-up-animation" : ""}>
          <HomeHeader
            event={currentEvent}
            events={events}
            currentEvent={currentEvent}
            onSelectEvent={handleSelectEvent}
            profile={profile}
          />
        </Box>

        {/* Tabs */}
        <Box className={shouldAnimate ? "slide-up-delay-1" : ""}>
          <HomeTabs 
            active={activeTab} 
            onChange={(newTab) => {
              setActiveTab(newTab);
              // Atualiza a URL para refletir a aba selecionada, mas não força navegação
              const url = new URL(window.location.href);
              url.searchParams.set("tab", newTab);
              window.history.replaceState({}, "", url.toString());
            }} 
          />
        </Box>

        {/* Conteúdo baseado na aba selecionada */}
        {activeTab === "home" && currentEvent && (
          <>
            <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
              <AdBanner isFirst={true} eventId={currentEvent.id} />
            </Box>
            <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
              <NewsFeed eventId={currentEvent.id} event={currentEvent} />
            </Box>
          </>
        )}
        {activeTab === "eventos" && currentEvent && (
          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
            <EventDetails event={currentEvent} />
          </Box>
        )}
        {activeTab === "estandes" && currentEvent && (
          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
            <InteractiveStandMap eventId={currentEvent.id} />
          </Box>
        )}
  {activeTab === "roleta" && currentEvent && (
          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
            <DashboardRoulette eventId={currentEvent.id} />
          </Box>
        )}
        {activeTab === "mapa" && currentEvent && (
          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
            <EventMap event={currentEvent} />
          </Box>
        )}

        {activeTab === "lineup" && currentEvent && (
          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
            <LineUp eventId={currentEvent.id} />
          </Box>
        )}

        {activeTab === "foto" && currentEvent && (
          <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
            <PhotoAI eventId={currentEvent.id} />
          </Box>
        )}

      
      </Box>
      <BottomNav />
      <NotificationPermissionPopup
        open={showNotificationPopup}
        onClose={handleNotificationPopupDismiss}
        onAllow={handleNotificationPopupAllow}
        loading={pushPopupLoading}
      />
    </>
  );
};

const Home: React.FC = () => {
  return (
    <Suspense fallback={
      <Box
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          paddingBottom: "72px",
        }}
      >
        <Box
          sx={{
            padding: 2,
            borderBottom: "solid 1px rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Skeleton
                variant="rectangular"
                width={40}
                height={40}
                sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 1 }}
              />
              <Skeleton
                variant="text"
                width={150}
                height={32}
                sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
              />
            </Box>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "rgba(255,255,255,0.1)" }}
            />
          </Box>
        </Box>
      </Box>
    }>
      <HomeContent />
    </Suspense>
  );
};

export default Home;
