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
  user?: {
    name: string;
    email: string;
    cpf: string;
  };
}

interface StandAnalytics {
  color: string;
  totalBrindes: number;
  entradas: number;
  saidas: number;
  dailyActivity: { day: string; entradas: number; saidas: number }[];
  recentActivity: {
    time: string;
    type: "entrada" | "saida";
    source?: "manual" | "roleta";
    quantity: number;
    description: string;
    prize?: string;
    user?: {
      name: string;
      email: string;
      cpf: string;
    };
  }[];
  hourActivity: { hour: string; count: number }[];
  history: HistoryEntry[];
}

const rouletteUsers = [
  { name: "Julia Costa", email: "julia.costa@email.com", cpf: "123.456.789-10" },
  { name: "Marcos Lima", email: "marcos.lima@email.com", cpf: "234.567.890-11" },
  { name: "Renata Souza", email: "renata.souza@email.com", cpf: "345.678.901-22" },
  { name: "Thiago Alves", email: "thiago.alves@email.com", cpf: "456.789.012-33" },
  { name: "Camila Rocha", email: "camila.rocha@email.com", cpf: "567.890.123-44" },
  { name: "Bruno Nunes", email: "bruno.nunes@email.com", cpf: "678.901.234-55" },
  { name: "Amanda Pereira", email: "amanda.pereira@email.com", cpf: "789.012.345-66" },
];

function normalizeRouletteEntry(entry: HistoryEntry): HistoryEntry {
  if (entry.source !== "roleta" || entry.type !== "saida") {
    return entry;
  }
  const user = rouletteUsers[Math.abs(entry.id) % rouletteUsers.length];
  return {
    ...entry,
    quantity: 1,
    user: entry.user ?? user,
  };
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const analyticsMap: Record<string, StandAnalytics> = {
  coca: {
    color: "#CC0000",
    totalBrindes: 500, entradas: 500, saidas: 312,
    dailyActivity: [
      { day: "Seg", entradas: 100, saidas: 48 }, { day: "Ter", entradas: 80,  saidas: 55 },
      { day: "Qua", entradas: 120, saidas: 62 }, { day: "Qui", entradas: 0,   saidas: 71 },
      { day: "Sex", entradas: 100, saidas: 38 }, { day: "Sab", entradas: 60,  saidas: 21 },
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
      { hour: "18h", count: 28 }, { hour: "19h", count: 45 }, { hour: "20h", count: 68 },
      { hour: "21h", count: 82 }, { hour: "22h", count: 54 }, { hour: "23h", count: 35 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "22:14", type: "saida",   source: "roleta", quantity: 3,   prize: "Copo Personalizado", operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:52", type: "saida",   source: "roleta", quantity: 5,   prize: "Copo Personalizado", operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "20:30", type: "entrada", source: "manual", quantity: 60,  prize: "Copo Personalizado", operator: "Admin", notes: "Reabastecimento noturno" },
      { id: 4,  date: "10/04/2026", time: "19:11", type: "saida",   source: "roleta", quantity: 2,   prize: "Lata Colecionavel",  operator: "Sistema" },
      { id: 5,  date: "10/04/2026", time: "18:40", type: "saida",   source: "roleta", quantity: 4,   prize: "Copo Personalizado", operator: "Sistema" },
      { id: 6,  date: "10/04/2026", time: "17:05", type: "saida",   source: "manual", quantity: 10,  prize: "Lata Colecionavel",  operator: "Joao Silva", notes: "Distribuicao evento principal" },
      { id: 7,  date: "09/04/2026", time: "23:15", type: "saida",   source: "roleta", quantity: 6,   prize: "Copo Personalizado", operator: "Sistema" },
      { id: 8,  date: "09/04/2026", time: "22:01", type: "saida",   source: "roleta", quantity: 3,   prize: "Lata Colecionavel",  operator: "Sistema" },
      { id: 9,  date: "09/04/2026", time: "21:30", type: "entrada", source: "manual", quantity: 80,  prize: "Copo Personalizado", operator: "Admin", notes: "Lote 3 - Fornecedor Coca-Cola" },
      { id: 10, date: "09/04/2026", time: "20:45", type: "saida",   source: "roleta", quantity: 7,   prize: "Copo Personalizado", operator: "Sistema" },
      { id: 11, date: "09/04/2026", time: "19:20", type: "saida",   source: "roleta", quantity: 4,   prize: "Lata Colecionavel",  operator: "Sistema" },
      { id: 12, date: "09/04/2026", time: "18:00", type: "entrada", source: "manual", quantity: 100, prize: "Lata Colecionavel",  operator: "Admin", notes: "Abertura do dia" },
      { id: 13, date: "08/04/2026", time: "22:40", type: "saida",   source: "roleta", quantity: 5,   prize: "Copo Personalizado", operator: "Sistema" },
      { id: 14, date: "08/04/2026", time: "21:10", type: "saida",   source: "manual", quantity: 15,  prize: "Copo Personalizado", operator: "Maria Lima", notes: "Parceria palco Sunset" },
      { id: 15, date: "08/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 120, prize: "Copo Personalizado", operator: "Admin", notes: "Reabastecimento lote 2" },
      { id: 16, date: "08/04/2026", time: "18:30", type: "saida",   source: "roleta", quantity: 8,   prize: "Lata Colecionavel",  operator: "Sistema" },
      { id: 17, date: "07/04/2026", time: "23:50", type: "saida",   source: "roleta", quantity: 4,   prize: "Copo Personalizado", operator: "Sistema" },
      { id: 18, date: "07/04/2026", time: "22:30", type: "saida",   source: "roleta", quantity: 6,   prize: "Lata Colecionavel",  operator: "Sistema" },
      { id: 19, date: "07/04/2026", time: "20:15", type: "entrada", source: "manual", quantity: 100, prize: "Copo Personalizado", operator: "Admin", notes: "Estoque inicial dia 4" },
      { id: 20, date: "07/04/2026", time: "18:00", type: "entrada", source: "manual", quantity: 40,  prize: "Lata Colecionavel",  operator: "Admin", notes: "Complemento de estoque" },
    ],
  },
  vivo: {
    color: "#6600CC",
    totalBrindes: 350, entradas: 350, saidas: 198,
    dailyActivity: [
      { day: "Seg", entradas: 70,  saidas: 28 }, { day: "Ter", entradas: 60,  saidas: 35 },
      { day: "Qua", entradas: 80,  saidas: 41 }, { day: "Qui", entradas: 0,   saidas: 30 },
      { day: "Sex", entradas: 80,  saidas: 27 }, { day: "Sab", entradas: 40,  saidas: 23 },
      { day: "Dom", entradas: 20,  saidas: 14 },
    ],
    recentActivity: [
      { time: "Hoje 22:05", type: "saida",   quantity: 2,  description: "Resgate via roleta" },
      { time: "Hoje 21:33", type: "saida",   quantity: 4,  description: "Resgate via roleta" },
      { time: "Hoje 20:10", type: "entrada", quantity: 50, description: "Reabastecimento manual" },
      { time: "Hoje 18:55", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 22 }, { hour: "19h", count: 38 }, { hour: "20h", count: 55 },
      { hour: "21h", count: 64 }, { hour: "22h", count: 43 }, { hour: "23h", count: 19 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "22:05", type: "saida",   source: "roleta", quantity: 2,  prize: "Carregador Portatil",  operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:33", type: "saida",   source: "roleta", quantity: 4,  prize: "Chip Vivo Gratis",     operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "20:10", type: "entrada", source: "manual", quantity: 50, prize: "Carregador Portatil",  operator: "Admin", notes: "Reabastecimento" },
      { id: 4,  date: "10/04/2026", time: "18:55", type: "saida",   source: "roleta", quantity: 3,  prize: "Chip Vivo Gratis",     operator: "Sistema" },
      { id: 5,  date: "09/04/2026", time: "23:10", type: "saida",   source: "roleta", quantity: 5,  prize: "Carregador Portatil",  operator: "Sistema" },
      { id: 6,  date: "09/04/2026", time: "21:00", type: "entrada", source: "manual", quantity: 80, prize: "Chip Vivo Gratis",     operator: "Admin", notes: "Lote 2" },
      { id: 7,  date: "09/04/2026", time: "19:30", type: "saida",   source: "roleta", quantity: 4,  prize: "Carregador Portatil",  operator: "Sistema" },
      { id: 8,  date: "08/04/2026", time: "22:20", type: "saida",   source: "roleta", quantity: 3,  prize: "Chip Vivo Gratis",     operator: "Sistema" },
      { id: 9,  date: "08/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 100, prize: "Carregador Portatil", operator: "Admin", notes: "Estoque inicial" },
      { id: 10, date: "07/04/2026", time: "21:45", type: "saida",   source: "roleta", quantity: 6,  prize: "Carregador Portatil",  operator: "Sistema" },
    ],
  },
  volkswagen: {
    color: "#1D1D1B",
    totalBrindes: 420, entradas: 420, saidas: 241,
    dailyActivity: [
      { day: "Seg", entradas: 80,  saidas: 33 }, { day: "Ter", entradas: 70,  saidas: 42 },
      { day: "Qua", entradas: 100, saidas: 51 }, { day: "Qui", entradas: 0,   saidas: 38 },
      { day: "Sex", entradas: 90,  saidas: 31 }, { day: "Sab", entradas: 50,  saidas: 28 },
      { day: "Dom", entradas: 30,  saidas: 18 },
    ],
    recentActivity: [
      { time: "Hoje 22:18", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
      { time: "Hoje 21:44", type: "saida",   quantity: 5,  description: "Resgate via roleta" },
      { time: "Hoje 20:20", type: "entrada", quantity: 55, description: "Reabastecimento manual" },
      { time: "Hoje 19:02", type: "saida",   quantity: 2,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 25 }, { hour: "19h", count: 41 }, { hour: "20h", count: 62 },
      { hour: "21h", count: 74 }, { hour: "22h", count: 49 }, { hour: "23h", count: 27 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "22:18", type: "saida",   source: "roleta", quantity: 3,  prize: "Miniatura VW Fusca",    operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:44", type: "saida",   source: "roleta", quantity: 5,  prize: "Boné VW Racing",        operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "20:20", type: "entrada", source: "manual", quantity: 55, prize: "Miniatura VW Fusca",    operator: "Admin", notes: "Reabastecimento noturno" },
      { id: 4,  date: "10/04/2026", time: "19:02", type: "saida",   source: "roleta", quantity: 2,  prize: "Boné VW Racing",        operator: "Sistema" },
      { id: 5,  date: "09/04/2026", time: "22:55", type: "saida",   source: "roleta", quantity: 4,  prize: "Miniatura VW Fusca",    operator: "Sistema" },
      { id: 6,  date: "09/04/2026", time: "21:10", type: "entrada", source: "manual", quantity: 90, prize: "Boné VW Racing",        operator: "Admin", notes: "Lote 2" },
      { id: 7,  date: "09/04/2026", time: "19:45", type: "saida",   source: "roleta", quantity: 7,  prize: "Miniatura VW Fusca",    operator: "Sistema" },
      { id: 8,  date: "08/04/2026", time: "22:30", type: "saida",   source: "manual", quantity: 12, prize: "Boné VW Racing",        operator: "Carlos R.", notes: "Acao no palco" },
      { id: 9,  date: "08/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 100, prize: "Miniatura VW Fusca",   operator: "Admin", notes: "Estoque inicial" },
      { id: 10, date: "07/04/2026", time: "21:20", type: "saida",   source: "roleta", quantity: 5,  prize: "Miniatura VW Fusca",    operator: "Sistema" },
    ],
  },
  fiat: {
    color: "#C9151E",
    totalBrindes: 280, entradas: 280, saidas: 155,
    dailyActivity: [
      { day: "Seg", entradas: 55,  saidas: 22 }, { day: "Ter", entradas: 45,  saidas: 28 },
      { day: "Qua", entradas: 70,  saidas: 34 }, { day: "Qui", entradas: 0,   saidas: 19 },
      { day: "Sex", entradas: 60,  saidas: 26 }, { day: "Sab", entradas: 30,  saidas: 16 },
      { day: "Dom", entradas: 20,  saidas: 10 },
    ],
    recentActivity: [
      { time: "Hoje 21:50", type: "saida",   quantity: 2,  description: "Resgate via roleta" },
      { time: "Hoje 21:15", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
      { time: "Hoje 19:45", type: "entrada", quantity: 40, description: "Reabastecimento manual" },
      { time: "Hoje 18:20", type: "saida",   quantity: 4,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 16 }, { hour: "19h", count: 29 }, { hour: "20h", count: 47 },
      { hour: "21h", count: 58 }, { hour: "22h", count: 36 }, { hour: "23h", count: 14 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "21:50", type: "saida",   source: "roleta", quantity: 2,  prize: "Miniatura Fiat Pulse",  operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:15", type: "saida",   source: "roleta", quantity: 3,  prize: "Boné Fiat",            operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "19:45", type: "entrada", source: "manual", quantity: 40, prize: "Miniatura Fiat Pulse",  operator: "Admin", notes: "Reabastecimento" },
      { id: 4,  date: "10/04/2026", time: "18:20", type: "saida",   source: "roleta", quantity: 4,  prize: "Boné Fiat",            operator: "Sistema" },
      { id: 5,  date: "09/04/2026", time: "22:40", type: "saida",   source: "roleta", quantity: 3,  prize: "Miniatura Fiat Pulse",  operator: "Sistema" },
      { id: 6,  date: "09/04/2026", time: "20:30", type: "entrada", source: "manual", quantity: 70, prize: "Boné Fiat",            operator: "Admin", notes: "Lote 2" },
      { id: 7,  date: "09/04/2026", time: "18:50", type: "saida",   source: "roleta", quantity: 5,  prize: "Miniatura Fiat Pulse",  operator: "Sistema" },
      { id: 8,  date: "08/04/2026", time: "21:30", type: "saida",   source: "manual", quantity: 8,  prize: "Boné Fiat",            operator: "Ana M.", notes: "Stand parceiro" },
      { id: 9,  date: "08/04/2026", time: "19:00", type: "entrada", source: "manual", quantity: 80, prize: "Miniatura Fiat Pulse",  operator: "Admin", notes: "Estoque inicial" },
      { id: 10, date: "07/04/2026", time: "20:40", type: "saida",   source: "roleta", quantity: 4,  prize: "Miniatura Fiat Pulse",  operator: "Sistema" },
    ],
  },
  sprite: {
    color: "#00A651",
    totalBrindes: 400, entradas: 400, saidas: 223,
    dailyActivity: [
      { day: "Seg", entradas: 80,  saidas: 30 }, { day: "Ter", entradas: 65,  saidas: 38 },
      { day: "Qua", entradas: 90,  saidas: 46 }, { day: "Qui", entradas: 0,   saidas: 32 },
      { day: "Sex", entradas: 85,  saidas: 29 }, { day: "Sab", entradas: 50,  saidas: 27 },
      { day: "Dom", entradas: 30,  saidas: 21 },
    ],
    recentActivity: [
      { time: "Hoje 22:10", type: "saida",   quantity: 4,  description: "Resgate via roleta" },
      { time: "Hoje 21:40", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
      { time: "Hoje 20:05", type: "entrada", quantity: 55, description: "Reabastecimento manual" },
      { time: "Hoje 18:50", type: "saida",   quantity: 5,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 20 }, { hour: "19h", count: 35 }, { hour: "20h", count: 58 },
      { hour: "21h", count: 70 }, { hour: "22h", count: 47 }, { hour: "23h", count: 22 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "22:10", type: "saida",   source: "roleta", quantity: 4,  prize: "Lata Sprite Gelada",   operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:40", type: "saida",   source: "roleta", quantity: 3,  prize: "Copo Sprite",          operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "20:05", type: "entrada", source: "manual", quantity: 55, prize: "Lata Sprite Gelada",   operator: "Admin", notes: "Reabastecimento" },
      { id: 4,  date: "10/04/2026", time: "18:50", type: "saida",   source: "roleta", quantity: 5,  prize: "Copo Sprite",          operator: "Sistema" },
      { id: 5,  date: "09/04/2026", time: "23:05", type: "saida",   source: "roleta", quantity: 3,  prize: "Lata Sprite Gelada",   operator: "Sistema" },
      { id: 6,  date: "09/04/2026", time: "21:20", type: "entrada", source: "manual", quantity: 100, prize: "Copo Sprite",         operator: "Admin", notes: "Lote 2" },
      { id: 7,  date: "09/04/2026", time: "19:10", type: "saida",   source: "roleta", quantity: 6,  prize: "Lata Sprite Gelada",   operator: "Sistema" },
      { id: 8,  date: "08/04/2026", time: "22:15", type: "saida",   source: "manual", quantity: 10, prize: "Copo Sprite",          operator: "Pedro K.", notes: "Acao palco" },
      { id: 9,  date: "08/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 100, prize: "Lata Sprite Gelada",  operator: "Admin", notes: "Estoque inicial" },
      { id: 10, date: "07/04/2026", time: "21:50", type: "saida",   source: "roleta", quantity: 5,  prize: "Copo Sprite",          operator: "Sistema" },
    ],
  },
  samsung: {
    color: "#1428A0",
    totalBrindes: 200, entradas: 200, saidas: 97,
    dailyActivity: [
      { day: "Seg", entradas: 40,  saidas: 13 }, { day: "Ter", entradas: 35,  saidas: 17 },
      { day: "Qua", entradas: 50,  saidas: 21 }, { day: "Qui", entradas: 0,   saidas: 14 },
      { day: "Sex", entradas: 40,  saidas: 12 }, { day: "Sab", entradas: 20,  saidas: 11 },
      { day: "Dom", entradas: 15,  saidas: 9  },
    ],
    recentActivity: [
      { time: "Hoje 22:00", type: "saida",   quantity: 1,  description: "Resgate via roleta" },
      { time: "Hoje 21:22", type: "saida",   quantity: 2,  description: "Resgate via roleta" },
      { time: "Hoje 19:30", type: "entrada", quantity: 30, description: "Reabastecimento manual" },
      { time: "Hoje 18:15", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 11 }, { hour: "19h", count: 19 }, { hour: "20h", count: 30 },
      { hour: "21h", count: 37 }, { hour: "22h", count: 22 }, { hour: "23h", count: 9  },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "22:00", type: "saida",   source: "roleta", quantity: 1,  prize: "Fone Galaxy Buds",     operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:22", type: "saida",   source: "roleta", quantity: 2,  prize: "Carregador Samsung",   operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "19:30", type: "entrada", source: "manual", quantity: 30, prize: "Fone Galaxy Buds",     operator: "Admin", notes: "Reabastecimento" },
      { id: 4,  date: "10/04/2026", time: "18:15", type: "saida",   source: "roleta", quantity: 3,  prize: "Carregador Samsung",   operator: "Sistema" },
      { id: 5,  date: "09/04/2026", time: "22:50", type: "saida",   source: "roleta", quantity: 2,  prize: "Fone Galaxy Buds",     operator: "Sistema" },
      { id: 6,  date: "09/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 50, prize: "Carregador Samsung",   operator: "Admin", notes: "Lote 2" },
      { id: 7,  date: "09/04/2026", time: "18:30", type: "saida",   source: "roleta", quantity: 4,  prize: "Fone Galaxy Buds",     operator: "Sistema" },
      { id: 8,  date: "08/04/2026", time: "21:00", type: "saida",   source: "manual", quantity: 5,  prize: "Carregador Samsung",   operator: "Bia S.", notes: "Demonstracao" },
      { id: 9,  date: "08/04/2026", time: "19:00", type: "entrada", source: "manual", quantity: 60, prize: "Fone Galaxy Buds",     operator: "Admin", notes: "Estoque inicial" },
      { id: 10, date: "07/04/2026", time: "20:30", type: "saida",   source: "roleta", quantity: 3,  prize: "Fone Galaxy Buds",     operator: "Sistema" },
    ],
  },
  ballantines: {
    color: "#B8860B",
    totalBrindes: 250, entradas: 250, saidas: 134,
    dailyActivity: [
      { day: "Seg", entradas: 50,  saidas: 18 }, { day: "Ter", entradas: 45,  saidas: 24 },
      { day: "Qua", entradas: 60,  saidas: 29 }, { day: "Qui", entradas: 0,   saidas: 21 },
      { day: "Sex", entradas: 55,  saidas: 17 }, { day: "Sab", entradas: 25,  saidas: 15 },
      { day: "Dom", entradas: 15,  saidas: 10 },
    ],
    recentActivity: [
      { time: "Hoje 22:08", type: "saida",   quantity: 2,  description: "Resgate via roleta" },
      { time: "Hoje 21:35", type: "saida",   quantity: 3,  description: "Resgate via roleta" },
      { time: "Hoje 20:00", type: "entrada", quantity: 40, description: "Reabastecimento manual" },
      { time: "Hoje 18:45", type: "saida",   quantity: 4,  description: "Resgate via roleta" },
    ],
    hourActivity: [
      { hour: "18h", count: 13 }, { hour: "19h", count: 24 }, { hour: "20h", count: 40 },
      { hour: "21h", count: 52 }, { hour: "22h", count: 33 }, { hour: "23h", count: 16 },
    ],
    history: [
      { id: 1,  date: "10/04/2026", time: "22:08", type: "saida",   source: "roleta", quantity: 2,  prize: "Copo Whisky Balantines", operator: "Sistema" },
      { id: 2,  date: "10/04/2026", time: "21:35", type: "saida",   source: "roleta", quantity: 3,  prize: "Mini Garrafa 200ml",     operator: "Sistema" },
      { id: 3,  date: "10/04/2026", time: "20:00", type: "entrada", source: "manual", quantity: 40, prize: "Copo Whisky Balantines", operator: "Admin", notes: "Reabastecimento" },
      { id: 4,  date: "10/04/2026", time: "18:45", type: "saida",   source: "roleta", quantity: 4,  prize: "Mini Garrafa 200ml",     operator: "Sistema" },
      { id: 5,  date: "09/04/2026", time: "22:30", type: "saida",   source: "roleta", quantity: 3,  prize: "Copo Whisky Balantines", operator: "Sistema" },
      { id: 6,  date: "09/04/2026", time: "20:15", type: "entrada", source: "manual", quantity: 60, prize: "Mini Garrafa 200ml",     operator: "Admin", notes: "Lote 2" },
      { id: 7,  date: "09/04/2026", time: "18:40", type: "saida",   source: "roleta", quantity: 5,  prize: "Copo Whisky Balantines", operator: "Sistema" },
      { id: 8,  date: "08/04/2026", time: "21:45", type: "saida",   source: "manual", quantity: 6,  prize: "Mini Garrafa 200ml",     operator: "Rafael D.", notes: "Acao VIP" },
      { id: 9,  date: "08/04/2026", time: "19:00", type: "entrada", source: "manual", quantity: 80, prize: "Copo Whisky Balantines", operator: "Admin", notes: "Estoque inicial" },
      { id: 10, date: "07/04/2026", time: "21:00", type: "saida",   source: "roleta", quantity: 4,  prize: "Mini Garrafa 200ml",     operator: "Sistema" },
    ],
  },
};

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
    keys: ["balatines", "ballantines"],
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

function getStandImage(name: string, backendImage?: string | null): string | null {
  if (backendImage) return backendImage;
  const lower = name.toLowerCase();
  for (const { keys, image } of STAND_IMAGES) {
    if (keys.some((k) => lower.includes(k))) return image;
  }
  return null;
}

const defaultAnalytics: StandAnalytics = {
  color: "#7c3aed",
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
            backgroundColor: color ? `${color}22` : "rgba(124,58,237,0.18)",
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
          {entry.user && (
            <Box sx={{ mt: 0.35 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.75rem", lineHeight: 1.45 }}>
                {entry.user.name}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", lineHeight: 1.45, wordBreak: "break-all" }}>
                {entry.user.email} · CPF {entry.user.cpf}
              </Typography>
            </Box>
          )}
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

  const [stands, setStands] = useState<LiveStandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStand, setSelectedStand] = useState<LiveStandResponse | null>(null);

  const [dashTab, setDashTab] = useState<"overview" | "add" | "history">("overview");

  const [formType, setFormType] = useState<"entrada" | "saida">("entrada");
  const [formPrize, setFormPrize] = useState("");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formNotes, setFormNotes] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [addedEntries, setAddedEntries] = useState<HistoryEntry[]>([]);
  const [nextId, setNextId] = useState(9000);

  const [typeFilter, setTypeFilter] = useState<"all" | "entrada" | "saida">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "roleta">("all");

  useEffect(() => {
    if (!authReady || !isAdmin) return;
    const load = async () => {
      setLoading(true);
      try {
        const events = await getEvents(1, 0);
        if (!events.length) return;
        const raw = await getLiveStandsByEvent(events[0].id);
        const HIDDEN = ["bauducco", "tic tac", "tictac", "eisenbahn", "heinserberg", "piracanjuba"];
        const filtered = raw.filter((s) => !HIDDEN.some((h) => s.name.toLowerCase().includes(h)));
        setStands(filtered);
      } catch (err) {
        console.error("Erro ao carregar estandes:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authReady, isAdmin]);

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

  const allHistory = [...addedEntries, ...baseAnalytics.history].map(normalizeRouletteEntry);
  const recentHistory = allHistory.slice(0, 5);
  const recentActivity = recentHistory.map((entry) => ({
    time: entry.date === new Date().toLocaleDateString("pt-BR") ? `Hoje ${entry.time}` : `${entry.date} ${entry.time}`,
    type: entry.type,
    source: entry.source,
    quantity: entry.quantity,
    description: entry.source === "roleta" ? "Resgate via roleta" : "Movimentacao manual",
    prize: entry.prize,
    user: entry.user,
  }));
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
          p: { xs: 1.5, md: 4 },
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "none",
        }}>

          {/* ── Header ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
              <IconButton
                onClick={() => selectedStand ? setSelectedStand(null) : router.back()}
                sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" }, flexShrink: 0 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{
                width: 44, height: 44, borderRadius: "50%",
                backgroundColor: "rgba(124,58,237,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <CardGiftcardIcon sx={{ color: "#ffffff", fontSize: 24 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.25rem", md: "1.9rem" }, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedStand ? selectedStand.name : "Brindes"}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mt: 0.25 }}>
                  Circuito Sertanejo
                </Typography>
              </Box>
            </Box>
            {selectedStand && (
              <Chip
                label={selectedStand.name}
                sx={{
                  display: { xs: "none", sm: "flex" },
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
                  <CircularProgress sx={{ color: "#7c3aed" }} />
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
                        {getStandImage(stand.name, stand.image_url) ? (
                          <Box
                            component="img"
                            src={getStandImage(stand.name, stand.image_url)!}
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
                              { label: "Total",  value: a.totalBrindes },
                              { label: "Saídas", value: a.saidas },
                              { label: "Disp.",  value: disp },
                            ].map((m) => (
                              <Box key={m.label} sx={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 2, p: 1 }}>
                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.68rem", whiteSpace: "nowrap" }}>{m.label}</Typography>
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
              <Tabs
                value={dashTab}
                onChange={(_, v) => setDashTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  mb: 3,
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  "& .MuiTab-root": {
                    color: "rgba(255,255,255,0.45)",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: { xs: "0.8rem", sm: "0.92rem" },
                    minHeight: 48,
                    gap: 0.75,
                    px: { xs: 1.5, sm: 2 },
                  },
                  "& .Mui-selected": { color: "#fff" },
                  "& .MuiTabs-indicator": { backgroundColor: "#ffffff", height: 3, borderRadius: "3px 3px 0 0" },
                  "& .MuiTabScrollButton-root": { color: "rgba(255,255,255,0.5)" },
                }}
              >
                <Tab label="Visão Geral"       value="overview" icon={<InventoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                <Tab label="Adicionar Brindes" value="add"      icon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                <Tab label="Histórico"         value="history"  icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
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
                      {recentActivity.map((item, i) => (
                        <Box key={i}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, minWidth: 0, flex: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, mt: "6px", backgroundColor: item.type === "entrada" ? "#4fc3f7" : analytics.color }} />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ color: "#fff", fontSize: "0.88rem", fontWeight: 600 }}>
                                  {item.type === "entrada" ? `+${item.quantity} entrada` : `-${item.quantity} saida`}{item.quantity !== 1 ? "s" : ""}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", wordBreak: "break-word" }}>
                                  {item.description} · {item.prize}
                                </Typography>
                                {item.user && (
                                  <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.74rem", wordBreak: "break-all" }}>
                                    {item.user.name} · {item.user.email}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", whiteSpace: "nowrap", flexShrink: 0 }}>{item.time}</Typography>
                          </Box>
                          {i < recentActivity.length - 1 && (
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

                  <Paper sx={{ p: { xs: 2, md: 3 }, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", mb: 3 }}>
                      Registrar movimentação
                    </Typography>

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
                        backgroundColor: "#ffffff",
                        color: "#111111",
                        fontWeight: 700,
                        borderRadius: 2,
                        textTransform: "none",
                        py: 1.5,
                        fontSize: "1rem",
                        "&:disabled": { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" },
                        "&:hover": { backgroundColor: "#e8e8e8" },
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
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 3 }}>
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

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", alignSelf: "center", mr: 0.5 }}>Tipo:</Typography>
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
                    <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", alignSelf: "center", mr: 0.5 }}>Origem:</Typography>
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

                  <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", mb: 1.5 }}>
                    {filteredHistory.length} registro{filteredHistory.length !== 1 ? "s" : ""}
                  </Typography>

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
