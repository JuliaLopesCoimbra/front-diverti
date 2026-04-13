"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HistoryIcon from "@mui/icons-material/History";
import ImageIcon from "@mui/icons-material/Image";
import InventoryIcon from "@mui/icons-material/Inventory";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/app/context/AuthContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { getLiveStandsByEvent, type LiveStandResponse } from "@/app/services/liveStands/liveStandService";
import { getEvents } from "@/app/services/events/eventAppService";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: number;
  date: string;
  time: string;
  type: "entrada" | "saida";
  source: "manual" | "roleta";
  quantity: number;
  prize: string;
  operator: string;
  notes?: string;
}

interface StandAnalytics {
  color: string;
  totalBrindes: number;
  entradas: number;
  saidas: number;
  dailyActivity: { day: string; entradas: number; saidas: number }[];
  recentActivity: { time: string; type: "entrada" | "saida"; quantity: number; description: string }[];
  hourActivity: { hour: string; count: number }[];
  history: HistoryEntry[];
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const analyticsMap: Record<string, StandAnalytics> = {
  coca: {
    color: "#CC0000",
    totalBrindes: 500,
    entradas: 500,
    saidas: 312,
    dailyActivity: [
      { day: "Seg", entradas: 100, saidas: 48 },
      { day: "Ter", entradas: 80,  saidas: 55 },
      { day: "Qua", entradas: 120, saidas: 62 },
      { day: "Qui", entradas: 0,   saidas: 71 },
      { day: "Sex", entradas: 100, saidas: 38 },
      { day: "Sab", entradas: 60,  saidas: 21 },
      { day: "Dom", entradas: 40,  saidas: 17 },
    ],
    recentActivity: [
      { time: "Hoje 22:14", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
      { time: "Hoje 21:52", type: "saida",   quantity: 5,  description: "Resgate via roleta" },
      { time: "Hoje 20:30", type: "entrada", quantity: 60, description: "Reabastecimento manual" },
      { time: "Hoje 19:11", type: "saida",   quantity: 2,  description: "Resgate via roleta" },
      { time: "Hoje 18:40", type: "saida",   quantity: 4,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 28 },
      { hour: "19h", count: 45 },
      { hour: "20h", count: 68 },
      { hour: "21h", count: 82 },
      { hour: "22h", count: 54 },
      { hour: "23h", count: 35 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "22:14", type: "saida",   source: "roleta", quantity: 3,  prize: "Copo Personalizado",  operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:52", type: "saida",   source: "roleta", quantity: 5,  prize: "Copo Personalizado",  operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "20:30", type: "entrada", source: "manual", quantity: 60, prize: "Copo Personalizado",  operator: "Admin", notes: "Reabastecimento noturno" },
      { id: 4,  date: "10/04/2026", time: "19:11", type: "saida",   source: "roleta", quantity: 2,  prize: "Lata Colecionavel",   operator: "Sistema" },
      { id: 5,  date: "10/04/2026", time: "18:40", type: "saida",   source: "roleta", quantity: 4,  prize: "Copo Personalizado",  operator: "Sistema" },
      { id: 6,  date: "10/04/2026", time: "17:05", type: "saida",   source: "manual", quantity: 10, prize: "Lata Colecionavel",   operator: "Joao Silva", notes: "Distribuicao evento principal" },
      { id: 7,  date: "09/04/2026", time: "23:15", type: "saida",   source: "roleta", quantity: 6,  prize: "Copo Personalizado",  operator: "Sistema" },
      { id: 8,  date: "09/04/2026", time: "22:01", type: "saida",   source: "roleta", quantity: 3,  prize: "Lata Colecionavel",   operator: "Sistema" },
      { id: 9,  date: "09/04/2026", time: "21:30", type: "entrada", source: "manual", quantity: 80, prize: "Copo Personalizado",  operator: "Admin", notes: "Lote 3 - Fornecedor Coca-Cola" },
      { id: 10, date: "09/04/2026", time: "20:45", type: "saida",   source: "roleta", quantity: 7,  prize: "Copo Personalizado",  operator: "Sistema" },
      { id: 11, date: "09/04/2026", time: "19:20", type: "saida",   source: "roleta", quantity: 4,  prize: "Lata Colecionavel",   operator: "Sistema" },
      { id: 12, date: "09/04/2026", time: "18:00", type: "entrada", source: "manual", quantity: 100, prize: "Lata Colecionavel", operator: "Admin", notes: "Abertura do dia" },
      { id: 13, date: "08/04/2026", time: "22:40", type: "saida",   source: "roleta", quantity: 5,  prize: "Copo Personalizado",  operator: "Sistema" },
      { id: 14, date: "08/04/2026", time: "21:10", type: "saida",   source: "manual", quantity: 15, prize: "Copo Personalizado",  operator: "Maria Lima", notes: "Parceria palco Sunset" },
      { id: 15, date: "08/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 120, prize: "Copo Personalizado", operator: "Admin", notes: "Reabastecimento lote 2" },
      { id: 16, date: "08/04/2026", time: "18:30", type: "saida",   source: "roleta", quantity: 8,  prize: "Lata Colecionavel",   operator: "Sistema" },
      { id: 17, date: "07/04/2026", time: "23:50", type: "saida",   source: "roleta", quantity: 4,  prize: "Copo Personalizado",  operator: "Sistema" },
      { id: 18, date: "07/04/2026", time: "22:30", type: "saida",   source: "roleta", quantity: 6,  prize: "Lata Colecionavel",   operator: "Sistema" },
      { id: 19, date: "07/04/2026", time: "20:15", type: "entrada", source: "manual", quantity: 100, prize: "Copo Personalizado", operator: "Admin", notes: "Estoque inicial dia 4" },
      { id: 20, date: "07/04/2026", time: "18:00", type: "entrada", source: "manual", quantity: 40,  prize: "Lata Colecionavel",  operator: "Admin", notes: "Complemento de estoque" },
    ],
  },
  "tic tac": {
    color: "#00A651",
    totalBrindes: 300,
    entradas: 300,
    saidas: 201,
    dailyActivity: [
      { day: "Seg", entradas: 60,  saidas: 31 },
      { day: "Ter", entradas: 50,  saidas: 38 },
      { day: "Qua", entradas: 80,  saidas: 42 },
      { day: "Qui", entradas: 0,   saidas: 29 },
      { day: "Sex", entradas: 60,  saidas: 33 },
      { day: "Sab", entradas: 30,  saidas: 18 },
      { day: "Dom", entradas: 20,  saidas: 10 },
    ],
    recentActivity: [
      { time: "Hoje 22:01", type: "saida",   quantity: 2,  description: "Resgate via roleta" },
      { time: "Hoje 21:30", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
      { time: "Hoje 20:15", type: "entrada", quantity: 30, description: "Reabastecimento manual" },
      { time: "Hoje 19:44", type: "saida",   quantity: 4,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 18 },
      { hour: "19h", count: 32 },
      { hour: "20h", count: 51 },
      { hour: "21h", count: 60 },
      { hour: "22h", count: 29 },
      { hour: "23h", count: 11 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "22:01", type: "saida",   source: "roleta", quantity: 2,  prize: "Porta-chaves Tic Tac",  operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:30", type: "saida",   source: "roleta", quantity: 3,  prize: "Miniatura Tic Tac",     operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "20:15", type: "entrada", source: "manual", quantity: 30, prize: "Porta-chaves Tic Tac",  operator: "Admin", notes: "Reabastecimento" },
      { id: 4,  date: "10/04/2026", time: "19:44", type: "saida",   source: "roleta", quantity: 4,  prize: "Porta-chaves Tic Tac",  operator: "Sistema" },
      { id: 5,  date: "10/04/2026", time: "18:20", type: "saida",   source: "manual", quantity: 5,  prize: "Miniatura Tic Tac",     operator: "Carlos Souza", notes: "Acao no palco" },
      { id: 6,  date: "09/04/2026", time: "23:00", type: "saida",   source: "roleta", quantity: 3,  prize: "Porta-chaves Tic Tac",  operator: "Sistema" },
      { id: 7,  date: "09/04/2026", time: "21:45", type: "entrada", source: "manual", quantity: 50, prize: "Miniatura Tic Tac",     operator: "Admin", notes: "Lote 2" },
      { id: 8,  date: "09/04/2026", time: "20:30", type: "saida",   source: "roleta", quantity: 5,  prize: "Miniatura Tic Tac",     operator: "Sistema" },
      { id: 9,  date: "09/04/2026", time: "19:00", type: "saida",   source: "roleta", quantity: 4,  prize: "Porta-chaves Tic Tac",  operator: "Sistema" },
      { id: 10, date: "09/04/2026", time: "18:00", type: "entrada", source: "manual", quantity: 80, prize: "Porta-chaves Tic Tac",  operator: "Admin", notes: "Abertura" },
      { id: 11, date: "08/04/2026", time: "22:30", type: "saida",   source: "roleta", quantity: 2,  prize: "Miniatura Tic Tac",     operator: "Sistema" },
      { id: 12, date: "08/04/2026", time: "21:00", type: "saida",   source: "manual", quantity: 8,  prize: "Porta-chaves Tic Tac",  operator: "Ana Paula", notes: "Stand parceiro" },
      { id: 13, date: "08/04/2026", time: "19:30", type: "entrada", source: "manual", quantity: 80, prize: "Miniatura Tic Tac",     operator: "Admin", notes: "Estoque inicial" },
      { id: 14, date: "08/04/2026", time: "18:10", type: "saida",   source: "roleta", quantity: 6,  prize: "Porta-chaves Tic Tac",  operator: "Sistema" },
      { id: 15, date: "07/04/2026", time: "23:20", type: "saida",   source: "roleta", quantity: 3,  prize: "Miniatura Tic Tac",     operator: "Sistema" },
      { id: 16, date: "07/04/2026", time: "21:00", type: "entrada", source: "manual", quantity: 60, prize: "Porta-chaves Tic Tac",  operator: "Admin", notes: "Reposicao dia 4" },
      { id: 17, date: "07/04/2026", time: "19:30", type: "saida",   source: "roleta", quantity: 4,  prize: "Porta-chaves Tic Tac",  operator: "Sistema" },
    ],
  },
  bauducco: {
    color: "#E8850C",
    totalBrindes: 400,
    entradas: 400,
    saidas: 178,
    dailyActivity: [
      { day: "Seg", entradas: 80,  saidas: 24 },
      { day: "Ter", entradas: 70,  saidas: 31 },
      { day: "Qua", entradas: 100, saidas: 38 },
      { day: "Qui", entradas: 0,   saidas: 22 },
      { day: "Sex", entradas: 80,  saidas: 29 },
      { day: "Sab", entradas: 40,  saidas: 21 },
      { day: "Dom", entradas: 30,  saidas: 13 },
    ],
    recentActivity: [
      { time: "Hoje 21:58", type: "saida",   quantity: 1,  description: "Resgate via roleta" },
      { time: "Hoje 21:10", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
      { time: "Hoje 20:00", type: "entrada", quantity: 40, description: "Reabastecimento manual" },
      { time: "Hoje 18:33", type: "saida",   quantity: 2,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 14 },
      { hour: "19h", count: 26 },
      { hour: "20h", count: 44 },
      { hour: "21h", count: 55 },
      { hour: "22h", count: 26 },
      { hour: "23h", count: 9 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "21:58", type: "saida",   source: "roleta", quantity: 1,   prize: "Panetone Miniatura",  operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:10", type: "saida",   source: "roleta", quantity: 3,   prize: "Cookie Bauducco",     operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 40,  prize: "Panetone Miniatura",  operator: "Admin", notes: "Reabastecimento" },
      { id: 4,  date: "10/04/2026", time: "18:33", type: "saida",   source: "roleta", quantity: 2,   prize: "Cookie Bauducco",     operator: "Sistema" },
      { id: 5,  date: "10/04/2026", time: "17:15", type: "saida",   source: "manual", quantity: 8,   prize: "Panetone Miniatura",  operator: "Lucas Mota", notes: "Acao backstage" },
      { id: 6,  date: "09/04/2026", time: "22:45", type: "saida",   source: "roleta", quantity: 4,   prize: "Cookie Bauducco",     operator: "Sistema" },
      { id: 7,  date: "09/04/2026", time: "21:20", type: "entrada", source: "manual", quantity: 60,  prize: "Cookie Bauducco",     operator: "Admin", notes: "Lote 3" },
      { id: 8,  date: "09/04/2026", time: "20:10", type: "saida",   source: "roleta", quantity: 3,   prize: "Panetone Miniatura",  operator: "Sistema" },
      { id: 9,  date: "09/04/2026", time: "19:05", type: "saida",   source: "roleta", quantity: 5,   prize: "Cookie Bauducco",     operator: "Sistema" },
      { id: 10, date: "09/04/2026", time: "18:00", type: "entrada", source: "manual", quantity: 100, prize: "Panetone Miniatura",  operator: "Admin", notes: "Abertura" },
      { id: 11, date: "08/04/2026", time: "23:10", type: "saida",   source: "roleta", quantity: 2,   prize: "Cookie Bauducco",     operator: "Sistema" },
      { id: 12, date: "08/04/2026", time: "22:00", type: "saida",   source: "manual", quantity: 12,  prize: "Panetone Miniatura",  operator: "Pedro Nunes", notes: "Degustacao palco" },
      { id: 13, date: "08/04/2026", time: "20:30", type: "entrada", source: "manual", quantity: 100, prize: "Cookie Bauducco",     operator: "Admin", notes: "Reabastecimento" },
      { id: 14, date: "08/04/2026", time: "19:00", type: "saida",   source: "roleta", quantity: 6,   prize: "Panetone Miniatura",  operator: "Sistema" },
      { id: 15, date: "07/04/2026", time: "23:30", type: "saida",   source: "roleta", quantity: 3,   prize: "Cookie Bauducco",     operator: "Sistema" },
      { id: 16, date: "07/04/2026", time: "22:15", type: "saida",   source: "roleta", quantity: 4,   prize: "Panetone Miniatura",  operator: "Sistema" },
      { id: 17, date: "07/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 100, prize: "Cookie Bauducco",     operator: "Admin", notes: "Estoque inicial" },
      { id: 18, date: "07/04/2026", time: "18:00", type: "entrada", source: "manual", quantity: 100, prize: "Panetone Miniatura",  operator: "Admin", notes: "Estoque inicial" },
    ],
  },
};

const defaultAnalytics: StandAnalytics = {
  color: "#ff1f21",
  totalBrindes: 0,
  entradas: 0,
  saidas: 0,
  dailyActivity: [],
  recentActivity: [],
  hourActivity: [],
  history: [],
};

function getAnalytics(standName: string): StandAnalytics {
  const lower = standName.toLowerCase();
  for (const key of Object.keys(analyticsMap)) {
    if (lower.includes(key)) return analyticsMap[key];
  }
  return defaultAnalytics;
}

const chartTooltipSx = {
  backgroundColor: "#111827",
  borderColor: "rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#fff",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: ReactNode; color?: string;
}) {
  return (
    <Card sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
      <CardContent sx={{ p: "20px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", mb: 0.75 }}>{label}</Typography>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: "1.6rem", md: "2rem" }, lineHeight: 1 }}>
              {value}
            </Typography>
            {sub && <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", mt: 0.5 }}>{sub}</Typography>}
          </Box>
          <Box sx={{
            width: 44, height: 44, borderRadius: "50%",
            backgroundColor: color ? `${color}22` : "rgba(255,31,33,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper sx={{ p: 2.5, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

function HistoryRow({ entry, color }: { entry: HistoryEntry; color: string }) {
  const isEntrada = entry.type === "entrada";
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, py: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, minWidth: 0, flex: 1 }}>
        <Box sx={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0, mt: "7px",
          backgroundColor: isEntrada ? "#4fc3f7" : color,
        }} />
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 0.5 }}>
            <Chip
              label={isEntrada ? "Entrada" : "Saida"}
              size="small"
              sx={{
                backgroundColor: isEntrada ? "rgba(79,195,247,0.15)" : `${color}22`,
                color: isEntrada ? "#4fc3f7" : color,
                border: `1px solid ${isEntrada ? "rgba(79,195,247,0.35)" : `${color}55`}`,
                fontWeight: 700, fontSize: "0.68rem", height: 22,
              }}
            />
            <Chip
              label={entry.source === "manual" ? "Manual" : "Roleta"}
              size="small"
              sx={{
                backgroundColor: entry.source === "manual" ? "rgba(255,255,255,0.07)" : "rgba(255,165,0,0.1)",
                color: entry.source === "manual" ? "rgba(255,255,255,0.65)" : "#FFA040",
                border: `1px solid ${entry.source === "manual" ? "rgba(255,255,255,0.12)" : "rgba(255,165,0,0.25)"}`,
                fontWeight: 600, fontSize: "0.68rem", height: 22,
              }}
            />
          </Box>
          <Typography sx={{ color: "#fff", fontSize: "0.88rem", fontWeight: 600, lineHeight: 1.3 }}>
            {entry.prize}
          </Typography>
          {entry.notes && (
            <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", mt: 0.25 }}>
              {entry.notes}
            </Typography>
          )}
          <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: "0.72rem", mt: 0.25 }}>
            por {entry.operator}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography sx={{ color: isEntrada ? "#4fc3f7" : color, fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>
          {isEntrada ? "+" : "-"}{entry.quantity}
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: "0.72rem", mt: 0.5 }}>
          {entry.date}
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: "0.72rem" }}>
          {entry.time}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BrindesPage() {
  const router = useRouter();
  const { isAdmin, authReady } = useAuth();

  // Stand list
  const [stands, setStands] = useState<LiveStandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStand, setSelectedStand] = useState<LiveStandResponse | null>(null);

  // Dashboard tabs
  const [dashTab, setDashTab] = useState<"overview" | "add" | "history">("overview");

  // Add-brinde form
  const [formType, setFormType] = useState<"entrada" | "saida">("entrada");
  const [formPrize, setFormPrize] = useState("");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formNotes, setFormNotes] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [addedEntries, setAddedEntries] = useState<HistoryEntry[]>([]);
  const [nextId, setNextId] = useState(9000);

  // History filters
  const [typeFilter, setTypeFilter] = useState<"all" | "entrada" | "saida">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "roleta">("all");

  useEffect(() => {
    if (!authReady || !isAdmin) return;
    const load = async () => {
      setLoading(true);
      try {
        const events = await getEvents(1, 0);
        if (!events.length) return;
        const data = await getLiveStandsByEvent(events[0].id);
        setStands(data);
      } catch (err) {
        console.error("Erro ao carregar estandes:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authReady, isAdmin]);

  // Reset form & filters when switching stands
  useEffect(() => {
    setDashTab("overview");
    setAddedEntries([]);
    setFormType("entrada");
    setFormPrize("");
    setFormQuantity(1);
    setFormNotes("");
    setFormSuccess(false);
    setTypeFilter("all");
    setSourceFilter("all");
  }, [selectedStand?.id]);

  if (!authReady) return null;
  if (!isAdmin) {
    router.push("/pages/user/home");
    return null;
  }

  const baseAnalytics = selectedStand ? getAnalytics(selectedStand.name) : defaultAnalytics;

  // Merge added entries into analytics totals
  const addedEntradas = addedEntries.filter(e => e.type === "entrada").reduce((s, e) => s + e.quantity, 0);
  const addedSaidas   = addedEntries.filter(e => e.type === "saida").reduce((s, e) => s + e.quantity, 0);
  const analytics: StandAnalytics = {
    ...baseAnalytics,
    entradas: baseAnalytics.entradas + addedEntradas,
    saidas:   baseAnalytics.saidas   + addedSaidas,
  };

  const disponivel  = analytics.entradas - analytics.saidas;
  const taxaResgate = analytics.entradas > 0
    ? ((analytics.saidas / analytics.entradas) * 100).toFixed(1)
    : "0";

  // All history: newly added first, then mock
  const allHistory = [...addedEntries, ...baseAnalytics.history];
  const filteredHistory = allHistory
    .filter(e => typeFilter   === "all" || e.type   === typeFilter)
    .filter(e => sourceFilter === "all" || e.source === sourceFilter);

  const handleAddSubmit = () => {
    if (!formPrize.trim() || formQuantity < 1) return;
    const now = new Date();
    const newEntry: HistoryEntry = {
      id: nextId,
      date: now.toLocaleDateString("pt-BR"),
      time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      type: formType,
      source: "manual",
      quantity: formQuantity,
      prize: formPrize.trim(),
      operator: "Admin",
      notes: formNotes.trim() || undefined,
    };
    setAddedEntries(prev => [newEntry, ...prev]);
    setNextId(n => n + 1);
    setFormSuccess(true);
    setFormPrize("");
    setFormQuantity(1);
    setFormNotes("");
    setTimeout(() => setFormSuccess(false), 3500);
  };

  return (
    <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, py: { xs: 2, md: 4 }, px: { xs: 2, md: 0 } }}>
      <Container maxWidth="lg">
        <Paper sx={{
          p: { xs: 3, md: 4 },
          backgroundColor: "rgba(26,26,26,0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}>

          {/* ── Header ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
            <IconButton
              onClick={() => selectedStand ? setSelectedStand(null) : router.back()}
              sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" } }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{
              width: 52, height: 52, borderRadius: "50%",
              backgroundColor: "rgba(255,31,33,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <CardGiftcardIcon sx={{ color: "rgb(255,31,33)", fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.5rem", md: "1.9rem" } }}>
                {selectedStand ? selectedStand.name : "Brindes"}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mt: 0.25 }}>
                Rock in Rio
              </Typography>
            </Box>
            {selectedStand && (
              <Chip
                label={selectedStand.name}
                sx={{
                  ml: "auto",
                  color: "#fff",
                  backgroundColor: `${analytics.color}33`,
                  border: `1px solid ${analytics.color}66`,
                  fontWeight: 700,
                }}
              />
            )}
          </Box>

          {/* ── Stand list ── */}
          {!selectedStand && (
            <Box>
              <Typography sx={{
                color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", mb: 2.5,
                letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700,
              }}>
                Selecione um estande
              </Typography>

              {loading ? (
                <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
                  <CircularProgress sx={{ color: "#ff1f21" }} />
                </Box>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
                  {stands.map((stand) => {
                    const a = getAnalytics(stand.name);
                    const disp = a.entradas - a.saidas;
                    const taxa = a.entradas > 0 ? ((a.saidas / a.entradas) * 100).toFixed(0) : "0";
                    return (
                      <Card
                        key={stand.id}
                        onClick={() => setSelectedStand(stand)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 3,
                          overflow: "hidden",
                          transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            borderColor: `${a.color}66`,
                            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                          },
                        }}
                      >
                        <Box sx={{ height: 5, background: a.color }} />
                        {stand.image_url ? (
                          <Box
                            component="img"
                            src={stand.image_url}
                            alt={stand.name}
                            sx={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <Box sx={{ width: "100%", height: 160, backgroundColor: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ImageIcon sx={{ fontSize: 48, color: "rgba(255,255,255,0.2)" }} />
                          </Box>
                        )}
                        <CardContent sx={{ p: "16px !important" }}>
                          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem", mb: 1.5 }}>
                            {stand.name}
                          </Typography>
                          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 1.5 }}>
                            {[
                              { label: "Total",      value: a.totalBrindes },
                              { label: "Saidas",     value: a.saidas },
                              { label: "Disponivel", value: disp },
                            ].map((m) => (
                              <Box key={m.label} sx={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 2, p: 1 }}>
                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.68rem" }}>{m.label}</Typography>
                                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{m.value}</Typography>
                              </Box>
                            ))}
                          </Box>
                          <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                              <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem" }}>Taxa de resgate</Typography>
                              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.72rem" }}>{taxa}%</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Number(taxa)}
                              sx={{ height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", "& .MuiLinearProgress-bar": { backgroundColor: a.color } }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          {/* ── Stand dashboard ── */}
          {selectedStand && (
            <Box>
              {/* Tabs */}
              <Tabs
                value={dashTab}
                onChange={(_, v) => setDashTab(v)}
                sx={{
                  mb: 3,
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  "& .MuiTab-root": {
                    color: "rgba(255,255,255,0.45)",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    minHeight: 48,
                    gap: 0.75,
                  },
                  "& .Mui-selected": { color: "#fff" },
                  "& .MuiTabs-indicator": { backgroundColor: "#ff1f21", height: 3, borderRadius: "3px 3px 0 0" },
                }}
              >
                <Tab
                  label="Visão Geral"
                  value="overview"
                  icon={<InventoryIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                />
                <Tab
                  label="Adicionar Brindes"
                  value="add"
                  icon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                />
                <Tab
                  label="Histórico"
                  value="history"
                  icon={<HistoryIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                />
              </Tabs>

              {/* ── Tab: Visao Geral ── */}
              {dashTab === "overview" && (
                <Box sx={{ display: "grid", gap: 3 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                    <StatCard label="Total de brindes" value={analytics.totalBrindes} sub="cadastrados no sistema"
                      icon={<InventoryIcon sx={{ color: "#fff", fontSize: 22 }} />} />
                    <StatCard label="Entradas" value={analytics.entradas} sub="adicionados ao estoque" color="#4fc3f7"
                      icon={<TrendingUpIcon sx={{ color: "#4fc3f7", fontSize: 22 }} />} />
                    <StatCard label="Saidas" value={analytics.saidas} sub="distribuidos / resgatados" color={analytics.color}
                      icon={<TrendingDownIcon sx={{ color: analytics.color, fontSize: 22 }} />} />
                    <StatCard label="Disponivel" value={disponivel} sub={`${taxaResgate}% resgatado`} color="#66bb6a"
                      icon={<CardGiftcardIcon sx={{ color: "#66bb6a", fontSize: 22 }} />} />
                  </Box>

                  <Paper sx={{ p: 2.5, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Typography sx={{ color: "#fff", fontWeight: 700 }}>Estoque atual</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                        {disponivel} de {analytics.totalBrindes} disponiveis
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={analytics.totalBrindes > 0 ? (disponivel / analytics.totalBrindes) * 100 : 0}
                      sx={{ height: 14, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", "& .MuiLinearProgress-bar": { backgroundColor: analytics.color, borderRadius: 999 } }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>0</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>{analytics.totalBrindes}</Typography>
                    </Box>
                  </Paper>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
                    <ChartPanel title="Entradas e saidas por dia">
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={analytics.dailyActivity}>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="day" tick={{ fill: "#d1d5db" }} />
                          <YAxis tick={{ fill: "#d1d5db" }} />
                          <Tooltip contentStyle={chartTooltipSx} />
                          <Bar dataKey="entradas" name="Entradas" fill="#4fc3f7" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="saidas"   name="Saidas"   fill={analytics.color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartPanel>
                    <ChartPanel title="Resgates por horario">
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={analytics.hourActivity}>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="hour" tick={{ fill: "#d1d5db" }} />
                          <YAxis tick={{ fill: "#d1d5db" }} />
                          <Tooltip contentStyle={chartTooltipSx} />
                          <Line type="monotone" dataKey="count" name="Resgates" stroke={analytics.color} strokeWidth={3} dot={{ fill: analytics.color, strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartPanel>
                  </Box>

                  <Paper sx={{ p: 2.5, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>Atividade recente</Typography>
                    <Box sx={{ display: "grid", gap: 1.5 }}>
                      {analytics.recentActivity.map((item, i) => (
                        <Box key={i}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: item.type === "entrada" ? "#4fc3f7" : analytics.color }} />
                              <Box>
                                <Typography sx={{ color: "#fff", fontSize: "0.88rem", fontWeight: 600 }}>
                                  {item.type === "entrada" ? `+${item.quantity} entrada` : `-${item.quantity} saida`}{item.quantity !== 1 ? "s" : ""}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>{item.description}</Typography>
                              </Box>
                            </Box>
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>{item.time}</Typography>
                          </Box>
                          {i < analytics.recentActivity.length - 1 && (
                            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mt: 1.5 }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* ── Tab: Adicionar Brindes ── */}
              {dashTab === "add" && (
                <Box sx={{ maxWidth: 560 }}>
                  {formSuccess && (
                    <Box sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      p: 2, mb: 3, borderRadius: 2.5,
                      backgroundColor: "rgba(102,187,106,0.12)",
                      border: "1px solid rgba(102,187,106,0.35)",
                    }}>
                      <CheckCircleIcon sx={{ color: "#66bb6a", fontSize: 22 }} />
                      <Typography sx={{ color: "#66bb6a", fontWeight: 600, fontSize: "0.92rem" }}>
                        Brinde registrado com sucesso!
                      </Typography>
                    </Box>
                  )}

                  <Paper sx={{ p: 3, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", mb: 3 }}>
                      Registrar movimentação
                    </Typography>

                    {/* Tipo: Entrada / Saida */}
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", mb: 1.25, fontWeight: 600 }}>
                        Tipo de movimentação
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        {(["entrada", "saida"] as const).map((t) => (
                          <Box
                            key={t}
                            onClick={() => setFormType(t)}
                            sx={{
                              flex: 1, py: 1.5, borderRadius: 2, textAlign: "center", cursor: "pointer",
                              border: formType === t
                                ? `2px solid ${t === "entrada" ? "#4fc3f7" : analytics.color}`
                                : "2px solid rgba(255,255,255,0.1)",
                              backgroundColor: formType === t
                                ? (t === "entrada" ? "rgba(79,195,247,0.1)" : `${analytics.color}18`)
                                : "rgba(255,255,255,0.03)",
                              transition: "all 0.18s ease",
                            }}
                          >
                            <Typography sx={{
                              color: formType === t ? (t === "entrada" ? "#4fc3f7" : analytics.color) : "rgba(255,255,255,0.5)",
                              fontWeight: 700, fontSize: "0.9rem",
                            }}>
                              {t === "entrada" ? "Entrada" : "Saida"}
                            </Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
                              {t === "entrada" ? "Adicionar ao estoque" : "Retirar do estoque"}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    {/* Nome do brinde */}
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", mb: 1.25, fontWeight: 600 }}>
                        Nome do brinde
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="Ex: Copo Personalizado, Lata Colecao..."
                        value={formPrize}
                        onChange={e => setFormPrize(e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: 2,
                            "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                            "&.Mui-focused fieldset": { borderColor: analytics.color },
                          },
                          "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.3)" },
                        }}
                      />
                    </Box>

                    {/* Quantidade */}
                    <Box sx={{ mb: 3 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", mb: 1.25, fontWeight: 600 }}>
                        Quantidade
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <IconButton
                          onClick={() => setFormQuantity(q => Math.max(1, q - 1))}
                          sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.08)", "&:hover": { backgroundColor: "rgba(255,255,255,0.14)" }, width: 44, height: 44 }}
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                        <TextField
                          type="number"
                          value={formQuantity}
                          onChange={e => setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          inputProps={{ min: 1, style: { textAlign: "center", color: "#fff", fontWeight: 800, fontSize: "1.3rem" } }}
                          sx={{
                            width: 100,
                            "& .MuiOutlinedInput-root": {
                              color: "#fff",
                              backgroundColor: "rgba(255,255,255,0.05)",
                              borderRadius: 2,
                              "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                              "&.Mui-focused fieldset": { borderColor: analytics.color },
                            },
                          }}
                        />
                        <IconButton
                          onClick={() => setFormQuantity(q => q + 1)}
                          sx={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.08)", "&:hover": { backgroundColor: "rgba(255,255,255,0.14)" }, width: 44, height: 44 }}
                        >
                          <AddCircleOutlineIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Observacao */}
                    <Box sx={{ mb: 3.5 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", mb: 1.25, fontWeight: 600 }}>
                        Observacao <Typography component="span" sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>(opcional)</Typography>
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Ex: Reabastecimento lote 2, acao parceiro..."
                        value={formNotes}
                        onChange={e => setFormNotes(e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: "#fff",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: 2,
                            "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                            "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                            "&.Mui-focused fieldset": { borderColor: analytics.color },
                          },
                          "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.3)" },
                        }}
                      />
                    </Box>

                    {/* Resumo */}
                    <Box sx={{
                      p: 2, mb: 3, borderRadius: 2,
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        Resumo
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>Tipo</Typography>
                        <Typography sx={{ color: formType === "entrada" ? "#4fc3f7" : analytics.color, fontWeight: 700, fontSize: "0.88rem" }}>
                          {formType === "entrada" ? "Entrada" : "Saida"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>Brinde</Typography>
                        <Typography sx={{ color: formPrize ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: "0.88rem" }}>
                          {formPrize || "—"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>Quantidade</Typography>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>{formQuantity}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>Estoque apos</Typography>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem" }}>
                          {formType === "entrada" ? disponivel + formQuantity : Math.max(0, disponivel - formQuantity)}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      disabled={!formPrize.trim() || formQuantity < 1}
                      onClick={handleAddSubmit}
                      sx={{
                        background: `linear-gradient(180deg, ${analytics.color} 0%, ${analytics.color}cc 100%)`,
                        color: "#fff",
                        fontWeight: 700,
                        borderRadius: 2,
                        textTransform: "none",
                        py: 1.5,
                        fontSize: "1rem",
                        "&:disabled": { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" },
                        "&:hover": { background: `linear-gradient(180deg, ${analytics.color}dd 0%, ${analytics.color}aa 100%)` },
                      }}
                    >
                      Registrar {formType === "entrada" ? "entrada" : "saida"} de {formQuantity} brinde{formQuantity !== 1 ? "s" : ""}
                    </Button>
                  </Paper>
                </Box>
              )}

              {/* ── Tab: Historico ── */}
              {dashTab === "history" && (
                <Box>
                  {/* Resumo rapido */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 3 }}>
                    {[
                      { label: "Total entradas", value: analytics.entradas, color: "#4fc3f7" },
                      { label: "Total saidas",   value: analytics.saidas,   color: analytics.color },
                      { label: "Disponivel",     value: disponivel,         color: "#66bb6a" },
                    ].map(m => (
                      <Box key={m.label} sx={{ p: 2, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", mb: 0.5 }}>{m.label}</Typography>
                        <Typography sx={{ color: m.color, fontWeight: 800, fontSize: "1.4rem", lineHeight: 1 }}>{m.value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Filtros */}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", alignSelf: "center", mr: 0.5 }}>
                      Tipo:
                    </Typography>
                    {(["all", "entrada", "saida"] as const).map(f => (
                      <Chip
                        key={f}
                        label={f === "all" ? "Todos" : f === "entrada" ? "Entradas" : "Saidas"}
                        onClick={() => setTypeFilter(f)}
                        size="small"
                        sx={{
                          cursor: "pointer",
                          backgroundColor: typeFilter === f ? (f === "entrada" ? "rgba(79,195,247,0.2)" : f === "saida" ? `${analytics.color}22` : "rgba(255,255,255,0.15)") : "rgba(255,255,255,0.06)",
                          color: typeFilter === f ? (f === "entrada" ? "#4fc3f7" : f === "saida" ? analytics.color : "#fff") : "rgba(255,255,255,0.5)",
                          border: typeFilter === f ? `1px solid ${f === "entrada" ? "rgba(79,195,247,0.4)" : f === "saida" ? `${analytics.color}55` : "rgba(255,255,255,0.3)"}` : "1px solid transparent",
                          fontWeight: 600, fontSize: "0.75rem",
                        }}
                      />
                    ))}
                    <Box sx={{ width: 1, height: "auto" }} />
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", alignSelf: "center", mr: 0.5 }}>
                      Origem:
                    </Typography>
                    {(["all", "manual", "roleta"] as const).map(f => (
                      <Chip
                        key={f}
                        label={f === "all" ? "Todas" : f === "manual" ? "Manual" : "Roleta"}
                        onClick={() => setSourceFilter(f)}
                        size="small"
                        sx={{
                          cursor: "pointer",
                          backgroundColor: sourceFilter === f ? (f === "manual" ? "rgba(255,255,255,0.15)" : f === "roleta" ? "rgba(255,165,0,0.15)" : "rgba(255,255,255,0.15)") : "rgba(255,255,255,0.06)",
                          color: sourceFilter === f ? (f === "roleta" ? "#FFA040" : "#fff") : "rgba(255,255,255,0.5)",
                          border: sourceFilter === f ? `1px solid ${f === "roleta" ? "rgba(255,165,0,0.35)" : "rgba(255,255,255,0.3)"}` : "1px solid transparent",
                          fontWeight: 600, fontSize: "0.75rem",
                        }}
                      />
                    ))}
                  </Box>

                  {/* Count */}
                  <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", mb: 1.5 }}>
                    {filteredHistory.length} registro{filteredHistory.length !== 1 ? "s" : ""}
                  </Typography>

                  {/* List */}
                  <Paper sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                    {filteredHistory.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>
                          Nenhum registro encontrado para os filtros selecionados.
                        </Typography>
                      </Box>
                    ) : (
                      filteredHistory.map((entry, i) => (
                        <Box key={entry.id}>
                          <Box sx={{ px: 2.5 }}>
                            <HistoryRow entry={entry} color={analytics.color} />
                          </Box>
                          {i < filteredHistory.length - 1 && (
                            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
                          )}
                        </Box>
                      ))
                    )}
                  </Paper>
                </Box>
              )}
            </Box>
          )}

        </Paper>
      </Container>
    </Box>
  );
}
