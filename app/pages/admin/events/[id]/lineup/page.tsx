"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  Paper,
  Avatar,
  Tabs,
  Tab,
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import {
  getLineupItemsByEventAdmin,
  deleteLineupItem,
  reorderLineupItems,
  LineupItemResponse,
} from "@/app/services/lineup/lineupService";
import {
  getParadeLineupItemsByEventAdmin,
  deleteParadeLineupItem,
  ParadeLineupItemResponse,
} from "@/app/services/paradeLineup/paradeLineupService";
import {
  EventResponse,
  getEventById,
} from "@/app/services/events/eventAppService";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import DeleteLineupItemModal from "@/app/components/admin/lineup/DeleteLineupItemModal";

const NO_DATE_TAB = "__no_date__";

const formatTime = (timeString: string): string => {
  const parts = timeString.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeString;
};

const formatDateOnly = (
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
) => new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", options);

const extractEventDates = (event: EventResponse | null): string[] => {
  if (!event?.event_dates) {
    return [];
  }

  const matches = event.event_dates.match(/\d{4}-\d{2}-\d{2}/g);
  return matches ? Array.from(new Set(matches)).sort() : [];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object") {
    const apiError = error as {
      response?: { data?: { detail?: string } };
    };
    return apiError.response?.data?.detail || fallback;
  }

  return fallback;
};

const isItemInTab = (item: LineupItemResponse, tabValue: string | null) => {
  if (!tabValue) {
    return true;
  }

  if (tabValue === NO_DATE_TAB) {
    return !item.event_date;
  }

  return item.event_date === tabValue;
};

const replaceGroupOrder = (
  currentItems: LineupItemResponse[],
  reorderedGroup: LineupItemResponse[],
  tabValue: string | null
) => {
  const groupIds = new Set(
    currentItems.filter((item) => isItemInTab(item, tabValue)).map((item) => item.id)
  );
  let groupIndex = 0;

  return currentItems.map((item) => {
    if (!groupIds.has(item.id)) {
      return item;
    }
    return reorderedGroup[groupIndex++];
  });
};

export default function LineupManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [lineupType, setLineupType] = useState<"shows" | "parade">("shows");
  const [lineupItems, setLineupItems] = useState<LineupItemResponse[]>([]);
  const [paradeLineupItems, setParadeLineupItems] = useState<
    ParadeLineupItemResponse[]
  >([]);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<
    LineupItemResponse | ParadeLineupItemResponse | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedShowTab, setSelectedShowTab] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const loadShows = useCallback(async () => {
    const [items, eventData] = await Promise.all([
      getLineupItemsByEventAdmin(eventId),
      getEventById(eventId),
    ]);
    setLineupItems(items);
    setEvent(eventData);
  }, [eventId]);

  const loadParade = useCallback(async () => {
    const [items, eventData] = await Promise.all([
      getParadeLineupItemsByEventAdmin(eventId),
      getEventById(eventId),
    ]);
    setParadeLineupItems(items);
    setEvent(eventData);
  }, [eventId]);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/pages/user/home");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        if (lineupType === "shows") {
          await loadShows();
        } else {
          await loadParade();
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        showToast("Erro ao carregar lineup", "error");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId, isAdmin, lineupType, loadParade, loadShows, router, showToast]);

  const showTabs = useMemo(() => {
    const datesFromEvent = extractEventDates(event);
    const datesFromItems = lineupItems
      .map((item) => item.event_date)
      .filter(Boolean) as string[];
    const uniqueDates = Array.from(new Set([...datesFromEvent, ...datesFromItems])).sort();
    const hasUndatedItems = lineupItems.some((item) => !item.event_date);

    const dateTabs = uniqueDates.map((date) => ({
      value: date,
      label: formatDateOnly(date, {
        day: "2-digit",
        month: "short",
      }),
    }));

    if (hasUndatedItems) {
      dateTabs.push({ value: NO_DATE_TAB, label: "Sem data" });
    }

    return dateTabs;
  }, [event, lineupItems]);

  useEffect(() => {
    if (lineupType !== "shows") {
      return;
    }

    if (showTabs.length === 0) {
      setSelectedShowTab(null);
      return;
    }

    const hasCurrentTab = showTabs.some((tab) => tab.value === selectedShowTab);
    if (!selectedShowTab || !hasCurrentTab) {
      setSelectedShowTab(showTabs[0].value);
    }
  }, [lineupType, selectedShowTab, showTabs]);

  const filteredShowItems = useMemo(() => {
    if (!selectedShowTab) {
      return lineupItems;
    }

    return lineupItems.filter((item) => isItemInTab(item, selectedShowTab));
  }, [lineupItems, selectedShowTab]);

  const handleDeleteClick = (
    item: LineupItemResponse | ParadeLineupItemResponse
  ) => {
    setDeletingItem(item);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) {
      return;
    }

    setDeleting(true);
    try {
      if (lineupType === "shows") {
        await deleteLineupItem((deletingItem as LineupItemResponse).id);
        showToast("Artista deletado com sucesso!", "success");
        await loadShows();
      } else {
        await deleteParadeLineupItem((deletingItem as ParadeLineupItemResponse).id);
        showToast("Escola de samba deletada com sucesso!", "success");
        await loadParade();
      }

      setDeleteModalOpen(false);
      setDeletingItem(null);
    } catch (err) {
      console.error("Erro ao deletar item:", err);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const handleDropOnShowItem = async (targetItemId: number) => {
    if (
      draggedItemId === null ||
      draggedItemId === targetItemId ||
      reordering
    ) {
      setDraggedItemId(null);
      return;
    }

    const currentGroupItems = [...filteredShowItems];
    const draggedIndex = currentGroupItems.findIndex((item) => item.id === draggedItemId);
    const targetIndex = currentGroupItems.findIndex((item) => item.id === targetItemId);

    if (draggedIndex < 0 || targetIndex < 0) {
      setDraggedItemId(null);
      return;
    }

    const reorderedGroup = [...currentGroupItems];
    const [draggedItem] = reorderedGroup.splice(draggedIndex, 1);
    reorderedGroup.splice(targetIndex, 0, draggedItem);

    const previousItems = lineupItems;
    setLineupItems((currentItems) =>
      replaceGroupOrder(currentItems, reorderedGroup, selectedShowTab)
    );
    setDraggedItemId(null);
    setReordering(true);

    try {
      await reorderLineupItems(eventId, {
        event_date:
          selectedShowTab && selectedShowTab !== NO_DATE_TAB
            ? selectedShowTab
            : undefined,
        item_ids: reorderedGroup.map((item) => item.id),
      });

      await loadShows();
      showToast("Ordem do lineup atualizada!", "success");
    } catch (err) {
      console.error("Erro ao reordenar lineup:", err);
      setLineupItems(previousItems);
      showToast(getErrorMessage(err, "Erro ao salvar a nova ordem do lineup"), "error");
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
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
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        color: "#fff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
        }}
      >
        <IconButton
          onClick={() => router.push(`/pages/admin/events/${eventId}`)}
          sx={{
            position: "absolute",
            left: 16,
            color: "#fff",
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Gerenciar Line Up
        </Typography>
        {event && (
          <Typography sx={{ color: "rgba(255,255,255,0.7)", ml: 1 }}>
            - {event.title}
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 3, position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 1, md: 1.5, lg: 2 },
            mb: 3,
            px: { xs: 1, sm: 2 },
            width: "100%",
          }}
        >
          <Button
            onClick={() => setLineupType("shows")}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 600,
              lineHeight: 1.2,
              px: { xs: 1.5, md: 2, lg: 2.5 },
              minHeight: { xs: 40, md: 44, lg: 48 },
              height: { xs: 40, md: 44, lg: 48 },
              flex: 1,
              maxWidth: { xs: 200, md: 250 },
              fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
              backgroundColor: lineupType === "shows" ? "primary.main" : "transparent",
              color: "#fff",
              border: `1px solid ${lineupType === "shows" ? "primary.main" : "#fff"}`,
              "&:hover": {
                backgroundColor:
                  lineupType === "shows" ? "primary.dark" : "rgba(255,255,255,0.1)",
                borderColor: lineupType === "shows" ? "primary.dark" : "#fff",
                fontWeight: 900,
              },
            }}
          >
            Line Up de Shows
          </Button>
          <Button
            onClick={() => setLineupType("parade")}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              fontWeight: 600,
              lineHeight: 1.2,
              px: { xs: 1.5, md: 2, lg: 2.5 },
              minHeight: { xs: 40, md: 44, lg: 48 },
              height: { xs: 40, md: 44, lg: 48 },
              flex: 1,
              maxWidth: { xs: 200, md: 250 },
              fontSize: { xs: "0.875rem", md: "1rem", lg: "1.125rem" },
              backgroundColor: lineupType === "parade" ? "primary.main" : "transparent",
              color: "#fff",
              border: `1px solid ${lineupType === "parade" ? "primary.main" : "#fff"}`,
              "&:hover": {
                backgroundColor:
                  lineupType === "parade" ? "primary.dark" : "rgba(255,255,255,0.1)",
                borderColor: lineupType === "parade" ? "primary.dark" : "#fff",
                fontWeight: 900,
              },
            }}
          >
            Line Up de Desfile
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 100 }}>
              {lineupType === "shows"
                ? "Artistas que farão parte do line up"
                : "Escolas de Samba que farao parte do line up de desfile"}
            </Typography>
            {lineupType === "shows" && (
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", mt: 0.5 }}>
                Arraste os cards para mudar a ordem dentro de cada dia.
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => {
              if (lineupType === "shows") {
                router.push(`/pages/admin/events/${eventId}/lineup/create`);
              } else {
                router.push(`/pages/admin/events/${eventId}/parade-lineup/create`);
              }
            }}
            sx={{
              backgroundColor: "primary.main",
              color: "#fff",
              width: 48,
              height: 48,
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>

        {lineupType === "shows" ? (
          lineupItems.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <MusicNoteIcon
                sx={{ fontSize: 64, color: "rgba(255,255,255,0.3)", mb: 2 }}
              />
              <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
                Nenhum artista cadastrado no lineup ainda.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {showTabs.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    overflow: "hidden",
                  }}
                >
                  <Tabs
                    value={selectedShowTab || false}
                    onChange={(_, value) => setSelectedShowTab(value)}
                    variant={showTabs.length <= 5 ? "fullWidth" : "scrollable"}
                    scrollButtons={showTabs.length > 5 ? "auto" : false}
                    sx={{
                      "& .MuiTab-root": {
                        color: "rgba(255,255,255,0.7)",
                        textTransform: "none",
                        "&.Mui-selected": {
                          color: "primary.main",
                          fontWeight: 600,
                        },
                      },
                      "& .MuiTabs-indicator": {
                        backgroundColor: "primary.main",
                        height: 3,
                      },
                    }}
                  >
                    {showTabs.map((tab) => (
                      <Tab key={tab.value} value={tab.value} label={tab.label} />
                    ))}
                  </Tabs>
                </Paper>
              )}

              {reordering && (
                <Typography sx={{ color: "primary.main", fontSize: "0.9rem" }}>
                  Salvando nova ordem...
                </Typography>
              )}

              {filteredShowItems.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 3,
                    p: 4,
                    textAlign: "center",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>
                    Nenhum artista cadastrado para este dia.
                  </Typography>
                </Paper>
              ) : (
                filteredShowItems.map((item, index) => (
                  <Paper
                    key={item.id}
                    elevation={0}
                    draggable={!reordering}
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragEnd={() => setDraggedItemId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropOnShowItem(item.id)}
                    sx={{
                      backgroundColor:
                        draggedItemId === item.id
                          ? "rgba(255, 31, 33, 0.12)"
                          : "rgba(0, 0, 0, 0.4)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 3,
                      p: 3,
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 3,
                      position: "relative",
                      cursor: reordering ? "progress" : "grab",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "rgba(255,255,255,0.45)",
                        minWidth: 54,
                        pt: 0.5,
                      }}
                    >
                      <DragIndicatorIcon />
                      <Typography sx={{ fontWeight: 700 }}>{index + 1}</Typography>
                    </Box>

                    <IconButton
                      onClick={() => handleDeleteClick(item)}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        color: "#ff3040",
                        "&:hover": {
                          backgroundColor: "rgba(255, 48, 64, 0.1)",
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        router.push(`/pages/admin/events/${eventId}/lineup/${item.id}/edit`)
                      }
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 48,
                        color: "primary.main",
                        "&:hover": {
                          backgroundColor: "rgba(255, 31, 33, 0.1)",
                        },
                      }}
                    >
                      <EditIcon />
                    </IconButton>

                    {item.artist_image_url ? (
                      <Avatar
                        src={item.artist_image_url}
                        alt={item.artist_name}
                        sx={{
                          width: 100,
                          height: 100,
                          border: "3px solid rgba(255, 31, 33, 0.35)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 100,
                          height: 100,
                          backgroundColor: "rgba(255, 31, 33, 0.2)",
                          border: "3px solid rgba(255, 31, 33, 0.35)",
                          flexShrink: 0,
                        }}
                      >
                        <MusicNoteIcon sx={{ fontSize: "2.5rem" }} />
                      </Avatar>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        flex: 1,
                        pr: 8,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#fff",
                          fontSize: "1.25rem",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.artist_name}
                      </Typography>

                      <Typography
                        sx={{
                          color: "primary.main",
                          fontSize: "1rem",
                          fontWeight: 500,
                        }}
                      >
                        {formatTime(item.performance_time)}
                        {item.performance_end_time
                          ? ` - ${formatTime(item.performance_end_time)}`
                          : ""}
                      </Typography>

                      {item.stage && (
                        <Typography sx={{ color: "rgba(255,255,255,0.75)" }}>
                          {item.stage}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          )
        ) : paradeLineupItems.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              p: 4,
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <MusicNoteIcon
              sx={{ fontSize: 64, color: "rgba(255,255,255,0.3)", mb: 2 }}
            />
            <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
              Nenhuma escola de samba cadastrada no lineup de desfile ainda.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {paradeLineupItems.map((item) => (
              <Paper
                key={item.id}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  p: 3,
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 3,
                  position: "relative",
                }}
              >
                <IconButton
                  onClick={() => handleDeleteClick(item)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    color: "#ff3040",
                    "&:hover": {
                      backgroundColor: "rgba(255, 48, 64, 0.1)",
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  onClick={() =>
                    router.push(`/pages/admin/events/${eventId}/parade-lineup/${item.id}/edit`)
                  }
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 48,
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: "rgba(255, 31, 33, 0.1)",
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>

                {item.samba_school_image_url ? (
                  <Avatar
                    src={item.samba_school_image_url}
                    alt={item.samba_school_name}
                    sx={{
                      width: 100,
                      height: 100,
                      border: "3px solid rgba(255, 31, 33, 0.35)",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      backgroundColor: "rgba(255, 31, 33, 0.2)",
                      border: "3px solid rgba(255, 31, 33, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <MusicNoteIcon sx={{ fontSize: "2.5rem" }} />
                  </Avatar>
                )}

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    flex: 1,
                    pr: 8,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      color: "#fff",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.samba_school_name || "Escola de Samba"}
                  </Typography>

                  <Typography
                    sx={{
                      color: "primary.main",
                      fontSize: "1rem",
                      fontWeight: 500,
                    }}
                  >
                    {formatTime(item.performance_time)}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    Ordem: {item.display_order}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {deletingItem && (
        <DeleteLineupItemModal
          open={deleteModalOpen}
          artistName={
            lineupType === "shows"
              ? (deletingItem as LineupItemResponse).artist_name
              : (deletingItem as ParadeLineupItemResponse).samba_school_name ||
                "Escola de Samba"
          }
          onClose={() => {
            setDeleteModalOpen(false);
            setDeletingItem(null);
          }}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
        />
      )}
    </Box>
  );
}

