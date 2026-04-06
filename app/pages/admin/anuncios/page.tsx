"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Alert,
  Autocomplete,
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
  MenuItem,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Slider,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CampaignIcon from "@mui/icons-material/Campaign";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import { EventResponse } from "@/app/services/events/eventAppService";
import GoogleMapsRadiusPicker from "@/app/components/admin/anuncios/GoogleMapsRadiusPicker";

type TabValue = "create" | "dashboard" | "charts";
type BudgetType = "diario" | "total";
type AdType = "CPC" | "CPV";

interface AdDraft {
  campaignName: string;
  adType: AdType;
  creativeUrl: string;
  creativeName: string;
  redirectUrl: string;
  eventId: string;
  targetUnits: string;
  budgetType: BudgetType;
  startAt: string;
  durationDays: string;
  hobbies: string[];
  professions: string[];
  gender: AudienceGender;
  ageRange: number[];
  address: string;
  radiusKm: number;
  location: { lat: number; lng: number } | null;
}

interface DashboardRow {
  adIdentifier: string;
  views: number;
  clicks: number;
  ctr: number;
  firstActivity: string | null;
  lastActivity: string | null;
}

interface MockDashboardAd extends DashboardRow {
  id: string;
  name: string;
  advertiser: string;
  imageUrl: string;
  redirectUrl: string;
  eventIds: number[];
}

interface HourActivity {
  hour: number;
  views: number;
  clicks: number;
}

interface DailyMetric {
  day: string;
  value: number;
}

const steps = ["Campanha", "Orçamento", "Segmentação", "Revisão"];
type AudienceGender = "todos" | "feminino" | "masculino" | "nao_binario";

const hobbyOptions = [
  "Futebol",
  "Carnaval",
  "Samba",
  "Pagode",
  "Moda",
  "Gastronomia",
  "Turismo",
  "Tecnologia",
  "Games",
  "Academia",
  "Praia",
  "Cinema",
  "Leitura",
  "Cerveja artesanal",
  "Eventos premium",
];

const professionOptions = [
  "Empresário",
  "Professor",
  "Advogado",
  "Médico",
  "Dentista",
  "Engenheiro",
  "Designer",
  "Desenvolvedor",
  "Estudante",
  "Motorista",
  "Comerciante",
  "Arquiteto",
  "Publicitário",
  "Influenciador",
  "Produtor de eventos",
];

const initialDraft: AdDraft = {
  campaignName: "Brahma Open Bar - Sunset Premium",
  adType: "CPC",
  creativeUrl: "/ads/3.png",
  creativeName: "3.png",
  redirectUrl: "https://www.rockworld.com.br/anuncios/brahma-open-bar",
  eventId: "103",
  targetUnits: "8500",
  budgetType: "diario",
  startAt: "2026-05-02T18:00",
  durationDays: "7",
  hobbies: ["Samba", "Gastronomia", "Eventos premium", "Praia"],
  professions: ["Empresário", "Influenciador", "Publicitário"],
  gender: "todos",
  ageRange: [25, 44],
  address: "Av. Lucio Costa, 4700 - Barra da Tijuca, Rio de Janeiro - RJ",
  radiusKm: 18,
  location: { lat: -23.0011, lng: -43.3659 },
};

const mockEvents: EventResponse[] = [
  {
    id: 101,
    title: "Rock in Rio Experience",
    description: "Evento mockado para validação visual do dashboard.",
    starts_at: "2026-04-18T18:00:00",
    ends_at: "2026-04-18T23:59:00",
    created_at: "2026-04-01T09:00:00",
    is_active: true,
    requires_post_approval: false,
  },
  {
    id: 102,
    title: "Samba Prime Weekend",
    description: "Evento mockado para validação visual do dashboard.",
    starts_at: "2026-04-25T17:00:00",
    ends_at: "2026-04-26T03:00:00",
    created_at: "2026-04-01T09:00:00",
    is_active: true,
    requires_post_approval: false,
  },
  {
    id: 103,
    title: "Sunset Premium Festival",
    description: "Evento mockado para validação visual do dashboard.",
    starts_at: "2026-05-02T16:00:00",
    ends_at: "2026-05-02T23:00:00",
    created_at: "2026-04-01T09:00:00",
    is_active: true,
    requires_post_approval: false,
  },
];

const mockDashboardAds: MockDashboardAd[] = [
  {
    id: "ad-1",
    adIdentifier: "1",
    name: "Beefeater Sunset Sessions",
    advertiser: "Beefeater",
    imageUrl: "/ads/1.png",
    redirectUrl: "https://www.pernod-ricard.com/pt/locations/brasil",
    views: 18240,
    clicks: 624,
    ctr: 3.42,
    firstActivity: "2026-04-01T18:15:00",
    lastActivity: "2026-04-02T22:10:00",
    eventIds: [101, 102],
  },
  {
    id: "ad-2",
    adIdentifier: "2",
    name: "Maturatta Camarote Prime",
    advertiser: "Maturatta",
    imageUrl: "/ads/2.png",
    redirectUrl: "https://www.friboi.com.br/marcas/maturatta-friboi/",
    views: 13980,
    clicks: 402,
    ctr: 2.88,
    firstActivity: "2026-04-01T17:40:00",
    lastActivity: "2026-04-02T21:48:00",
    eventIds: [101, 103],
  },
  {
    id: "ad-3",
    adIdentifier: "3",
    name: "Brahma Open Bar",
    advertiser: "Brahma",
    imageUrl: "/ads/3.png",
    redirectUrl: "https://www.pernod-ricard.com",
    views: 22510,
    clicks: 905,
    ctr: 4.02,
    firstActivity: "2026-04-01T19:05:00",
    lastActivity: "2026-04-02T23:05:00",
    eventIds: [102, 103],
  },
  {
    id: "ad-4",
    adIdentifier: "5",
    name: "Ballantine's VIP Night",
    advertiser: "Ballantine's",
    imageUrl: "/ads/5.png",
    redirectUrl: "https://www.pernod-ricard.com/pt/locations/brasil",
    views: 11760,
    clicks: 318,
    ctr: 2.70,
    firstActivity: "2026-04-01T16:20:00",
    lastActivity: "2026-04-02T20:55:00",
    eventIds: [101, 102, 103],
  },
  {
    id: "ad-5",
    adIdentifier: "1-premium",
    name: "After Lounge Experience",
    advertiser: "RockWorld",
    imageUrl: "/ads/1.png",
    redirectUrl: "https://www.rockworld.com.br",
    views: 9640,
    clicks: 251,
    ctr: 2.60,
    firstActivity: "2026-04-01T20:30:00",
    lastActivity: "2026-04-02T23:20:00",
    eventIds: [103],
  },
];

const mockHourActivityByEvent: Record<string, HourActivity[]> = {
  all: [
    { hour: 20, views: 9200, clicks: 340 },
    { hour: 21, views: 8650, clicks: 314 },
    { hour: 19, views: 8010, clicks: 281 },
    { hour: 22, views: 7440, clicks: 256 },
    { hour: 18, views: 6890, clicks: 225 },
    { hour: 23, views: 6120, clicks: 198 },
  ],
  "101": [
    { hour: 19, views: 4120, clicks: 142 },
    { hour: 20, views: 4510, clicks: 160 },
    { hour: 21, views: 3980, clicks: 129 },
    { hour: 22, views: 3440, clicks: 101 },
  ],
  "102": [
    { hour: 20, views: 5010, clicks: 188 },
    { hour: 21, views: 4740, clicks: 173 },
    { hour: 22, views: 4320, clicks: 149 },
    { hour: 23, views: 3810, clicks: 116 },
  ],
  "103": [
    { hour: 18, views: 3660, clicks: 121 },
    { hour: 19, views: 4210, clicks: 139 },
    { hour: 20, views: 4630, clicks: 170 },
    { hour: 21, views: 4170, clicks: 152 },
  ],
};

const mockViewsByDayByEvent: Record<string, DailyMetric[]> = {
  all: [
    { day: "Seg", value: 6200 },
    { day: "Ter", value: 7100 },
    { day: "Qua", value: 6840 },
    { day: "Qui", value: 7920 },
    { day: "Sex", value: 8450 },
    { day: "Sab", value: 9310 },
    { day: "Dom", value: 8870 },
  ],
  "101": [
    { day: "Seg", value: 2100 },
    { day: "Ter", value: 2520 },
    { day: "Qua", value: 2410 },
    { day: "Qui", value: 2840 },
    { day: "Sex", value: 3120 },
    { day: "Sab", value: 3550 },
    { day: "Dom", value: 3280 },
  ],
  "102": [
    { day: "Seg", value: 2460 },
    { day: "Ter", value: 2810 },
    { day: "Qua", value: 2690 },
    { day: "Qui", value: 3140 },
    { day: "Sex", value: 3360 },
    { day: "Sab", value: 3720 },
    { day: "Dom", value: 3490 },
  ],
  "103": [
    { day: "Seg", value: 1640 },
    { day: "Ter", value: 1770 },
    { day: "Qua", value: 1740 },
    { day: "Qui", value: 1940 },
    { day: "Sex", value: 2170 },
    { day: "Sab", value: 2580 },
    { day: "Dom", value: 2430 },
  ],
};

const mockClicksByDayByEvent: Record<string, DailyMetric[]> = {
  all: [
    { day: "Seg", value: 180 },
    { day: "Ter", value: 214 },
    { day: "Qua", value: 205 },
    { day: "Qui", value: 236 },
    { day: "Sex", value: 268 },
    { day: "Sab", value: 304 },
    { day: "Dom", value: 293 },
  ],
  "101": [
    { day: "Seg", value: 61 },
    { day: "Ter", value: 70 },
    { day: "Qua", value: 68 },
    { day: "Qui", value: 78 },
    { day: "Sex", value: 90 },
    { day: "Sab", value: 105 },
    { day: "Dom", value: 98 },
  ],
  "102": [
    { day: "Seg", value: 73 },
    { day: "Ter", value: 86 },
    { day: "Qua", value: 80 },
    { day: "Qui", value: 93 },
    { day: "Sex", value: 102 },
    { day: "Sab", value: 118 },
    { day: "Dom", value: 111 },
  ],
  "103": [
    { day: "Seg", value: 46 },
    { day: "Ter", value: 58 },
    { day: "Qua", value: 57 },
    { day: "Qui", value: 65 },
    { day: "Sex", value: 76 },
    { day: "Sab", value: 81 },
    { day: "Dom", value: 84 },
  ],
};

const mockGenderByEvent: Record<string, { name: string; value: number }[]> = {
  all: [
    { name: "Feminino", value: 42 },
    { name: "Masculino", value: 39 },
    { name: "Não binário", value: 7 },
    { name: "Todos", value: 12 },
  ],
  "101": [
    { name: "Feminino", value: 38 },
    { name: "Masculino", value: 41 },
    { name: "Não binário", value: 6 },
    { name: "Todos", value: 15 },
  ],
  "102": [
    { name: "Feminino", value: 44 },
    { name: "Masculino", value: 37 },
    { name: "Não binário", value: 8 },
    { name: "Todos", value: 11 },
  ],
  "103": [
    { name: "Feminino", value: 46 },
    { name: "Masculino", value: 35 },
    { name: "Não binário", value: 9 },
    { name: "Todos", value: 10 },
  ],
};

const mockAgeByEvent: Record<string, { range: string; audience: number }[]> = {
  all: [
    { range: "18-24", audience: 1800 },
    { range: "25-34", audience: 3400 },
    { range: "35-44", audience: 2900 },
    { range: "45-54", audience: 1600 },
    { range: "55+", audience: 900 },
  ],
  "101": [
    { range: "18-24", audience: 620 },
    { range: "25-34", audience: 1210 },
    { range: "35-44", audience: 990 },
    { range: "45-54", audience: 540 },
    { range: "55+", audience: 260 },
  ],
  "102": [
    { range: "18-24", audience: 710 },
    { range: "25-34", audience: 1290 },
    { range: "35-44", audience: 1080 },
    { range: "45-54", audience: 590 },
    { range: "55+", audience: 310 },
  ],
  "103": [
    { range: "18-24", audience: 470 },
    { range: "25-34", audience: 900 },
    { range: "35-44", audience: 830 },
    { range: "45-54", audience: 470 },
    { range: "55+", audience: 330 },
  ],
};

const mockHobbiesByEvent: Record<string, { name: string; value: number }[]> = {
  all: [
    { name: "Futebol", value: 24 },
    { name: "Samba", value: 18 },
    { name: "Gastronomia", value: 16 },
    { name: "Moda", value: 14 },
    { name: "Praia", value: 12 },
    { name: "Games", value: 10 },
  ],
  "101": [
    { name: "Futebol", value: 22 },
    { name: "Samba", value: 19 },
    { name: "Gastronomia", value: 18 },
    { name: "Moda", value: 12 },
    { name: "Praia", value: 15 },
    { name: "Games", value: 8 },
  ],
  "102": [
    { name: "Futebol", value: 26 },
    { name: "Samba", value: 22 },
    { name: "Gastronomia", value: 14 },
    { name: "Moda", value: 11 },
    { name: "Praia", value: 9 },
    { name: "Games", value: 7 },
  ],
  "103": [
    { name: "Futebol", value: 18 },
    { name: "Samba", value: 15 },
    { name: "Gastronomia", value: 17 },
    { name: "Moda", value: 19 },
    { name: "Praia", value: 13 },
    { name: "Games", value: 12 },
  ],
};

const mockJobsByEvent: Record<string, { name: string; value: number }[]> = {
  all: [
    { name: "Empresário", value: 17 },
    { name: "Estudante", value: 24 },
    { name: "Designer", value: 11 },
    { name: "Advogado", value: 9 },
    { name: "Professor", value: 14 },
    { name: "Influenciador", value: 13 },
  ],
  "101": [
    { name: "Empresário", value: 18 },
    { name: "Estudante", value: 20 },
    { name: "Designer", value: 10 },
    { name: "Advogado", value: 11 },
    { name: "Professor", value: 16 },
    { name: "Influenciador", value: 9 },
  ],
  "102": [
    { name: "Empresário", value: 15 },
    { name: "Estudante", value: 27 },
    { name: "Designer", value: 12 },
    { name: "Advogado", value: 8 },
    { name: "Professor", value: 11 },
    { name: "Influenciador", value: 14 },
  ],
  "103": [
    { name: "Empresário", value: 19 },
    { name: "Estudante", value: 21 },
    { name: "Designer", value: 13 },
    { name: "Advogado", value: 8 },
    { name: "Professor", value: 14 },
    { name: "Influenciador", value: 16 },
  ],
};

const mockStatesByEvent: Record<string, { uf: string; audience: number }[]> = {
  all: [
    { uf: "SP", audience: 3400 },
    { uf: "RJ", audience: 2900 },
    { uf: "MG", audience: 1800 },
    { uf: "BA", audience: 1200 },
    { uf: "PR", audience: 950 },
  ],
  "101": [
    { uf: "SP", audience: 1210 },
    { uf: "RJ", audience: 980 },
    { uf: "MG", audience: 710 },
    { uf: "BA", audience: 450 },
    { uf: "PR", audience: 320 },
  ],
  "102": [
    { uf: "SP", audience: 1320 },
    { uf: "RJ", audience: 1190 },
    { uf: "MG", audience: 640 },
    { uf: "BA", audience: 390 },
    { uf: "PR", audience: 260 },
  ],
  "103": [
    { uf: "SP", audience: 870 },
    { uf: "RJ", audience: 730 },
    { uf: "MG", audience: 450 },
    { uf: "BA", audience: 360 },
    { uf: "PR", audience: 370 },
  ],
};

const mockBrandsByEvent: Record<string, { brand: string; engagement: number }[]> = {
  all: [
    { brand: "Brahma", engagement: 92 },
    { brand: "Beefeater", engagement: 81 },
    { brand: "Ballantine's", engagement: 74 },
    { brand: "Maturatta", engagement: 63 },
    { brand: "RockWorld", engagement: 58 },
  ],
  "101": [
    { brand: "Brahma", engagement: 69 },
    { brand: "Beefeater", engagement: 78 },
    { brand: "Ballantine's", engagement: 71 },
    { brand: "Maturatta", engagement: 67 },
    { brand: "RockWorld", engagement: 43 },
  ],
  "102": [
    { brand: "Brahma", engagement: 94 },
    { brand: "Beefeater", engagement: 83 },
    { brand: "Ballantine's", engagement: 72 },
    { brand: "Maturatta", engagement: 49 },
    { brand: "RockWorld", engagement: 40 },
  ],
  "103": [
    { brand: "Brahma", engagement: 73 },
    { brand: "Beefeater", engagement: 61 },
    { brand: "Ballantine's", engagement: 69 },
    { brand: "Maturatta", engagement: 70 },
    { brand: "RockWorld", engagement: 64 },
  ],
};

const chartPalette = ["#ff1f21", "#ffcc01", "#4fc3f7", "#ab47bc", "#66bb6a"];

export default function AdminAdsPage() {
  const router = useRouter();
  const { isAdmin, authReady } = useAuth();
  const { showToast } = useToast();
  const uploadedCreativeUrlRef = useRef<string | null>(null);

  const [tab, setTab] = useState<TabValue>("dashboard");
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AdDraft>(initialDraft);
  const [integrationNotice, setIntegrationNotice] = useState(false);

  const events = mockEvents;
  const eventsLoading = false;
  const statsLoading = false;

  useEffect(() => {
    if (authReady && !isAdmin) {
      router.push("/pages/user/home");
    }
  }, [authReady, isAdmin, router]);

  const selectedEventName = useMemo(() => {
    if (selectedEventId === "all") {
      return "Todos os eventos";
    }

    return (
      events.find((event) => String(event.id) === selectedEventId)?.title ||
      "Evento filtrado"
    );
  }, [events, selectedEventId]);

  const mergedRows = useMemo<MockDashboardAd[]>(() => {
    const filteredRows =
      selectedEventId === "all"
        ? mockDashboardAds
        : mockDashboardAds.filter((row) =>
            row.eventIds.includes(Number(selectedEventId))
          );

    return [...filteredRows].sort((a, b) => b.views + b.clicks - (a.views + a.clicks));
  }, [selectedEventId]);

  const totals = useMemo(() => {
    const totalViews = mergedRows.reduce((sum, row) => sum + row.views, 0);
    const totalClicks = mergedRows.reduce((sum, row) => sum + row.clicks, 0);
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    return {
      totalViews,
      totalClicks,
      ctr,
      totalAds: mockDashboardAds.length,
    };
  }, [mergedRows]);

  const topHours = useMemo(() => {
    const sourceRows =
      mockHourActivityByEvent[selectedEventId] || mockHourActivityByEvent.all;

    const rows = sourceRows
      .map((item) => ({
        ...item,
        total: item.views + item.clicks,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const maxTotal = rows[0]?.total || 0;

    return rows.map((row) => ({
      ...row,
      percentage: maxTotal > 0 ? (row.total / maxTotal) * 100 : 0,
    }));
  }, [selectedEventId]);

  const viewsChartData = useMemo(
    () => mockViewsByDayByEvent[selectedEventId] || mockViewsByDayByEvent.all,
    [selectedEventId]
  );

  const clicksChartData = useMemo(
    () => mockClicksByDayByEvent[selectedEventId] || mockClicksByDayByEvent.all,
    [selectedEventId]
  );

  const adTypeChartData = useMemo(() => {
    const rows =
      selectedEventId === "all"
        ? mockDashboardAds
        : mockDashboardAds.filter((row) =>
            row.eventIds.includes(Number(selectedEventId))
          );

    const cpcCount = rows.filter((row) => row.adIdentifier !== "5").length;
    const cpvCount = rows.length - cpcCount;

    return [
      { name: "CPC (Imagem)", value: cpcCount || 0 },
      { name: "CPV (Vídeo)", value: cpvCount || 0 },
    ];
  }, [selectedEventId]);

  const performanceChartData = useMemo(
    () =>
      mergedRows.map((row) => ({
        nome: row.name.length > 18 ? `${row.name.slice(0, 18)}...` : row.name,
        views: row.views,
        cliques: row.clicks,
      })),
    [mergedRows]
  );

  const genderChartData = useMemo(
    () => mockGenderByEvent[selectedEventId] || mockGenderByEvent.all,
    [selectedEventId]
  );

  const ageChartData = useMemo(
    () => mockAgeByEvent[selectedEventId] || mockAgeByEvent.all,
    [selectedEventId]
  );

  const hobbiesChartData = useMemo(
    () => mockHobbiesByEvent[selectedEventId] || mockHobbiesByEvent.all,
    [selectedEventId]
  );

  const jobsChartData = useMemo(
    () => mockJobsByEvent[selectedEventId] || mockJobsByEvent.all,
    [selectedEventId]
  );

  const statesChartData = useMemo(
    () => mockStatesByEvent[selectedEventId] || mockStatesByEvent.all,
    [selectedEventId]
  );

  const brandsChartData = useMemo(
    () => mockBrandsByEvent[selectedEventId] || mockBrandsByEvent.all,
    [selectedEventId]
  );

  const unitPrice = draft.adType === "CPC" ? 14 : 0.1;
  const parsedTargetUnits = Number(draft.targetUnits) || 0;
  const parsedDurationDays = Math.max(1, Number(draft.durationDays) || 1);
  const estimatedTotal = parsedTargetUnits * unitPrice;
  const estimatedDaily = estimatedTotal / parsedDurationDays;

  const isCurrentStepValid = useMemo(() => {
    if (step === 0) {
      return Boolean(
        draft.campaignName.trim() &&
          draft.creativeUrl.trim() &&
          draft.redirectUrl.trim()
      );
    }

    if (step === 1) {
      return Boolean(
        parsedTargetUnits > 0 &&
          draft.startAt &&
          parsedDurationDays >= 1 &&
          estimatedTotal >= 0
      );
    }

    if (step === 2) {
      return Boolean(draft.eventId && draft.address.trim());
    }

    return true;
  }, [
    draft.campaignName,
    draft.creativeUrl,
    draft.address,
    draft.eventId,
    draft.redirectUrl,
    draft.startAt,
    estimatedTotal,
    parsedDurationDays,
    parsedTargetUnits,
    step,
  ]);

  const handleNextStep = () => {
    if (!isCurrentStepValid) {
      showToast("Preencha os campos obrigatórios desta etapa", "error");
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleFinishSetup = () => {
    setIntegrationNotice(true);
    showToast(
      "Fluxo visual de anúncios pronto. Falta ligar o cadastro a uma API de criação.",
      "success"
    );
  };

  const handleCreativeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (uploadedCreativeUrlRef.current) {
      URL.revokeObjectURL(uploadedCreativeUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    uploadedCreativeUrlRef.current = objectUrl;

    setDraft((current) => ({
      ...current,
      creativeUrl: objectUrl,
      creativeName: file.name,
    }));
  };

  useEffect(() => {
    return () => {
      if (uploadedCreativeUrlRef.current) {
        URL.revokeObjectURL(uploadedCreativeUrlRef.current);
      }
    };
  }, []);

  if (!authReady) {
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

  if (!isAdmin) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        py: { xs: 2, md: 4 },
        px: { xs: 2, md: 0 },
      }}
    >
      <Container maxWidth="lg">
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            backgroundColor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={() => router.back()}
                sx={{
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 31, 33, 0.15)",
                }}
              >
                <CampaignIcon sx={{ color: "rgb(255, 31, 33)", fontSize: 30 }} />
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: { xs: "1.6rem", md: "2rem" },
                  }}
                >
                  Anúncios
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}
                >
                  Adaptação inicial do fluxo do roulette com dashboard real do rockworld
                </Typography>
              </Box>
            </Box>

            <Chip
              label={selectedEventName}
              sx={{
                color: "#fff",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          </Box>

          <Tabs
            value={tab}
            onChange={(_, value: TabValue) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              mb: 3,
              "& .MuiTab-root": {
                minWidth: { xs: 120, sm: 160 },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "rgb(255, 31, 33)",
                height: 3,
              },
            }}
            textColor="inherit"
          >
            <Tab
              label="Dashboard"
              value="dashboard"
              sx={{ color: "#fff", textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              label="Gráficos"
              value="charts"
              sx={{ color: "#fff", textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              label="Inserir anúncio"
              value="create"
              sx={{ color: "#fff", textTransform: "none", fontWeight: 600 }}
            />
          </Tabs>

          {tab === "create" ? (
            <Box>
        

          

              <Box sx={{ mb: 4, overflowX: "auto", pb: 1 }}>
                <Stepper
                  activeStep={step}
                  alternativeLabel
                  sx={{
                    minWidth: 520,
                    "& .MuiStepLabel-label": {
                      color: "rgba(255,255,255,0.7)",
                      fontSize: { xs: "0.78rem", sm: "0.92rem" },
                    },
                    "& .Mui-active .MuiStepLabel-label, & .Mui-completed .MuiStepLabel-label":
                      { color: "#fff" },
                  }}
                >
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1.3fr 0.7fr" },
                  gap: 3,
                }}
              >
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 3,
                  }}
                >
                  {step === 0 ? (
                    <Box sx={{ display: "grid", gap: 2 }}>
                      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                        Campanha e criativo
                      </Typography>
                      <TextField
                        label="Nome da campanha"
                        value={draft.campaignName}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            campaignName: e.target.value,
                          }))
                        }
                        fullWidth
                        sx={textFieldSx}
                      />
                      <TextField
                        select
                        label="Tipo de anúncio"
                        value={draft.adType}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            adType: e.target.value as AdType,
                          }))
                        }
                        fullWidth
                        sx={textFieldSx}
                      >
                        <MenuItem value="CPC">CPC - anúncio por cliques</MenuItem>
                        <MenuItem value="CPV">CPV - anúncio por views</MenuItem>
                      </TextField>
                      <Box>
                        <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
                          Foto do criativo
                        </Typography>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "180px 1fr" },
                            gap: 2,
                            alignItems: "start",
                          }}
                        >
                          <Box
                            component="img"
                            src={draft.creativeUrl}
                            alt={draft.creativeName}
                            sx={{
                              width: "100%",
                              height: 180,
                              objectFit: "cover",
                              borderRadius: 2,
                              border: "1px solid rgba(255,255,255,0.12)",
                              backgroundColor: "rgba(255,255,255,0.04)",
                            }}
                          />

                          <Box sx={{ display: "grid", gap: 1.5 }}>
                            <Button component="label" variant="outlined" sx={secondaryButtonSx}>
                              Escolher foto
                              <input
                                hidden
                                accept="image/*"
                                type="file"
                                onChange={handleCreativeFileChange}
                              />
                            </Button>
                            <TextField
                              label="Arquivo selecionado"
                              value={draft.creativeName}
                              fullWidth
                              InputProps={{ readOnly: true }}
                              sx={textFieldSx}
                            />
                            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>
                              Mock inicial carregado com `3.png`. Ao escolher outra imagem, o preview
                              será atualizado automaticamente.
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <TextField
                        label="URL de destino"
                        placeholder="https://..."
                        value={draft.redirectUrl}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            redirectUrl: e.target.value,
                          }))
                        }
                        fullWidth
                        sx={textFieldSx}
                      />
                    </Box>
                  ) : null}

                  {step === 1 ? (
                    <Box sx={{ display: "grid", gap: 2 }}>
                      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                        Orçamento e programação
                      </Typography>
                      <TextField
                        label={`Meta de ${draft.adType === "CPC" ? "cliques" : "views"}`}
                        type="number"
                        value={draft.targetUnits}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            targetUnits: e.target.value,
                          }))
                        }
                        fullWidth
                        sx={textFieldSx}
                      />
                      <TextField
                        select
                        label="Tipo de orçamento"
                        value={draft.budgetType}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            budgetType: e.target.value as BudgetType,
                          }))
                        }
                        fullWidth
                        sx={textFieldSx}
                      >
                        <MenuItem value="diario">Diário</MenuItem>
                        <MenuItem value="total">Total</MenuItem>
                      </TextField>
                      <TextField
                        label="Início da campanha"
                        type="datetime-local"
                        value={draft.startAt}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            startAt: e.target.value,
                          }))
                        }
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={textFieldSx}
                      />
                      <TextField
                        label="Duração em dias"
                        type="number"
                        value={draft.durationDays}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            durationDays: e.target.value,
                          }))
                        }
                        fullWidth
                        sx={textFieldSx}
                      />
                    </Box>
                  ) : null}

                  {step === 2 ? (
                    <Box sx={{ display: "grid", gap: 2 }}>
                      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                        Segmentação e evento
                      </Typography>
                      <TextField
                        select
                        label="Evento"
                        value={draft.eventId}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            eventId: e.target.value,
                          }))
                        }
                        fullWidth
                        disabled={eventsLoading}
                        sx={textFieldSx}
                      >
                        {events.map((event) => (
                          <MenuItem key={event.id} value={String(event.id)}>
                            {event.title}
                          </MenuItem>
                        ))}
                      </TextField>
                      <AudienceMultiSelect
                        label="Hobbies"
                        placeholder="Digite ou clique para adicionar hobbies"
                        options={hobbyOptions}
                        value={draft.hobbies}
                        onChange={(values) =>
                          setDraft((current) => ({
                            ...current,
                            hobbies: values,
                          }))
                        }
                      />
                      <AudienceMultiSelect
                        label="Profissões"
                        placeholder="Digite ou clique para adicionar profissões"
                        options={professionOptions}
                        value={draft.professions}
                        onChange={(values) =>
                          setDraft((current) => ({
                            ...current,
                            professions: values,
                          }))
                        }
                      />
                      <AudienceGenderSelector
                        value={draft.gender}
                        onChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            gender: value,
                          }))
                        }
                      />
                      <AudienceAgeRangeSelector
                        value={draft.ageRange}
                        onChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            ageRange: value,
                          }))
                        }
                      />
                      <GoogleMapsRadiusPicker
                        address={draft.address}
                        onAddressChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            address: value,
                          }))
                        }
                        location={draft.location}
                        onLocationChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            location: value,
                          }))
                        }
                        radiusKm={draft.radiusKm}
                        onRadiusChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            radiusKm: value,
                          }))
                        }
                      />
                    </Box>
                  ) : null}

                  {step === 3 ? (
                    <Box sx={{ display: "grid", gap: 2 }}>
                      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                        Revisão final
                      </Typography>
                      <ReviewRow label="Campanha" value={draft.campaignName || "-"} />
                      <ReviewRow label="Tipo" value={draft.adType} />
                      <ReviewRow
                        label="Evento"
                        value={
                          events.find((event) => String(event.id) === draft.eventId)?.title ||
                          "-"
                        }
                      />
                      <ReviewRow label="Criativo" value={draft.creativeName || "-"} />
                      <ReviewRow label="Destino" value={draft.redirectUrl || "-"} />
                      <ReviewRow
                        label="Meta"
                        value={`${parsedTargetUnits.toLocaleString("pt-BR")} ${
                          draft.adType === "CPC" ? "cliques" : "views"
                        }`}
                      />
                      <ReviewRow
                        label="Investimento estimado"
                        value={formatCurrency(estimatedTotal)}
                      />
                      <ReviewRow
                        label="Início"
                        value={draft.startAt ? formatDateTime(draft.startAt) : "-"}
                      />
                      <ReviewRow
                        label="Hobbies"
                        value={draft.hobbies.length ? draft.hobbies.join(", ") : "Todos"}
                      />
                      <ReviewRow
                        label="Profissões"
                        value={
                          draft.professions.length
                            ? draft.professions.join(", ")
                            : "Todas"
                        }
                      />
                      <ReviewRow
                        label="Gênero"
                        value={formatGenderLabel(draft.gender)}
                      />
                      <ReviewRow
                        label="Faixa etária"
                        value={`${draft.ageRange[0]} a ${draft.ageRange[1]} anos`}
                      />
                      <ReviewRow
                        label="Localização"
                        value={
                          draft.address
                            ? `${draft.address} (${draft.radiusKm} km)`
                            : "-"
                        }
                      />
                    </Box>
                  ) : null}

                  <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

                  <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
                    <Button
                      variant="outlined"
                      disabled={step === 0}
                      onClick={() => setStep((current) => Math.max(current - 1, 0))}
                      sx={secondaryButtonSx}
                    >
                      Voltar
                    </Button>

                    {step < steps.length - 1 ? (
                      <Button variant="contained" onClick={handleNextStep} sx={primaryButtonSx}>
                        Continuar
                      </Button>
                    ) : (
                      <Button variant="contained" onClick={handleFinishSetup} sx={primaryButtonSx}>
                        Finalizar estrutura
                      </Button>
                    )}
                  </Box>
                </Paper>

                <Card
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>
                      Resumo rápido
                    </Typography>

                    <Box sx={{ display: "grid", gap: 1.5 }}>
                      <SummaryMetric
                        label="Preço unitário"
                        value={formatCurrency(unitPrice)}
                        icon={<CampaignIcon sx={{ color: "#fff" }} />}
                      />
                      <SummaryMetric
                        label="Investimento estimado"
                        value={formatCurrency(estimatedTotal)}
                        icon={<TouchAppIcon sx={{ color: "#fff" }} />}
                      />
                      <SummaryMetric
                        label="Média diária"
                        value={formatCurrency(estimatedDaily)}
                        icon={<VisibilityIcon sx={{ color: "#fff" }} />}
                      />
                    </Box>

                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ) : tab === "dashboard" ? (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", md: "center" },
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                  mb: 3,
                }}
              >
              

                <TextField
                  select
                  label="Evento"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  sx={{ ...textFieldSx, width: { xs: "100%", md: "auto" }, minWidth: { xs: "100%", md: 260 } }}
                >
                  <MenuItem value="all">Todos os eventos</MenuItem>
                  {events.map((event) => (
                    <MenuItem key={event.id} value={String(event.id)}>
                      {event.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {statsLoading ? (
                <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
                  <CircularProgress sx={{ color: "#ffcc01" }} />
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        lg: "repeat(4, 1fr)",
                      },
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <StatsCard
                      label="Total de views"
                      value={totals.totalViews.toLocaleString("pt-BR")}
                      icon={<VisibilityIcon sx={{ color: "#fff" }} />}
                    />
                    <StatsCard
                      label="Total de cliques"
                      value={totals.totalClicks.toLocaleString("pt-BR")}
                      icon={<TouchAppIcon sx={{ color: "#fff" }} />}
                    />
                    <StatsCard
                      label="CTR médio"
                      value={`${totals.ctr.toFixed(2)}%`}
                      icon={<CampaignIcon sx={{ color: "#fff" }} />}
                    />
                    <StatsCard
                      label="Anúncios monitorados"
                      value={String(totals.totalAds)}
                      icon={<CampaignIcon sx={{ color: "#fff" }} />}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", lg: "1.5fr 0.9fr" },
                      gap: 3,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 3,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>
                        Desempenho por anúncio
                      </Typography>

                      {mergedRows.length === 0 ? (
                        <Alert
                          severity="info"
                          sx={{
                            backgroundColor: "rgba(33,150,243,0.08)",
                            color: "#fff",
                            border: "1px solid rgba(33,150,243,0.2)",
                          }}
                        >
                          Ainda não existem views ou cliques para o filtro selecionado.
                        </Alert>
                      ) : (
                        <>
                          <Box sx={{ display: { xs: "grid", sm: "none" }, gap: 1.5 }}>
                            {mergedRows.map((row) => (
                              <Card
                                key={row.adIdentifier}
                                sx={{
                                  backgroundColor: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: 2.5,
                                }}
                              >
                                <CardContent sx={{ display: "grid", gap: 1.2 }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: 1.5,
                                    }}
                                  >
                                    <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                                      Anúncio {row.adIdentifier}
                                    </Typography>
                                    <Chip
                                      label={`${row.ctr.toFixed(2)}% CTR`}
                                      size="small"
                                      sx={{
                                        color: "#fff",
                                        backgroundColor: "rgba(255, 31, 33, 0.16)",
                                        border: "1px solid rgba(255, 31, 33, 0.3)",
                                      }}
                                    />
                                  </Box>
                                  <ReviewRow label="Views" value={row.views.toLocaleString("pt-BR")} />
                                  <ReviewRow label="Cliques" value={row.clicks.toLocaleString("pt-BR")} />
                                  <ReviewRow
                                    label="Última atividade"
                                    value={formatOptionalDate(row.lastActivity)}
                                  />
                                </CardContent>
                              </Card>
                            ))}
                          </Box>

                          <TableContainer sx={{ display: { xs: "none", sm: "block" }, overflowX: "auto" }}>
                            <Table sx={{ minWidth: 620 }}>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={tableHeadSx}>Anúncio</TableCell>
                                  <TableCell sx={tableHeadSx} align="right">
                                    Views
                                  </TableCell>
                                  <TableCell sx={tableHeadSx} align="right">
                                    Cliques
                                  </TableCell>
                                  <TableCell sx={tableHeadSx} align="right">
                                    CTR
                                  </TableCell>
                                  <TableCell sx={tableHeadSx}>Última atividade</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {mergedRows.map((row) => (
                                  <TableRow key={row.adIdentifier}>
                                    <TableCell sx={tableBodySx}>{row.adIdentifier}</TableCell>
                                    <TableCell sx={tableBodySx} align="right">
                                      {row.views.toLocaleString("pt-BR")}
                                    </TableCell>
                                    <TableCell sx={tableBodySx} align="right">
                                      {row.clicks.toLocaleString("pt-BR")}
                                    </TableCell>
                                    <TableCell sx={tableBodySx} align="right">
                                      {row.ctr.toFixed(2)}%
                                    </TableCell>
                                    <TableCell sx={tableBodySx}>
                                      {formatOptionalDate(row.lastActivity)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      )}
                    </Paper>

                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 3,
                      }}
                    >
                      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>
                        Horários com mais atividade
                      </Typography>

                      {topHours.length === 0 ? (
                        <Typography sx={{ color: "rgba(255,255,255,0.65)" }}>
                          Sem atividade suficiente para montar ranking por hora.
                        </Typography>
                      ) : (
                        <Box sx={{ display: "grid", gap: 2 }}>
                          {topHours.map((item) => (
                            <Box key={item.hour}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: { xs: "column", sm: "row" },
                                  justifyContent: "space-between",
                                  alignItems: { xs: "flex-start", sm: "center" },
                                  gap: 0.6,
                                  mb: 0.8,
                                }}
                              >
                                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: { xs: "0.95rem", sm: "1rem" } }}>
                                  {String(item.hour).padStart(2, "0")}:00
                                </Typography>
                                <Typography
                                  sx={{
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: { xs: "0.82rem", sm: "0.95rem" },
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {item.views} views / {item.clicks} cliques
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={item.percentage}
                                sx={{
                                  height: 10,
                                  borderRadius: 999,
                                  backgroundColor: "rgba(255,255,255,0.08)",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: "rgb(255, 31, 33)",
                                  },
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Box>

                  <Paper
                    sx={{
                      mt: 3,
                      p: 2,
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 3,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 1 }}>
                      Anúncios listados
                    </Typography>
                

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                          xl: "repeat(3, 1fr)",
                        },
                        gap: 2,
                      }}
                    >
                      {mergedRows.map((ad) => (
                        <Card
                          key={ad.id}
                          sx={{
                            backgroundColor: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            component="img"
                            src={ad.imageUrl}
                            alt={ad.name}
                            sx={{
                              width: "100%",
                              height: 220,
                              objectFit: "cover",
                              display: "block",
                              backgroundColor: "rgba(255,255,255,0.04)",
                            }}
                          />

                          <CardContent>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 1.5,
                                mb: 1,
                              }}
                            >
                              <Box>
                                <Typography sx={{ color: "#fff", fontWeight: 700 }}>
                                  {ad.name}
                                </Typography>
                                <Typography sx={{ color: "rgba(255,255,255,0.65)" }}>
                                  {ad.advertiser}
                                </Typography>
                              </Box>

                              <Chip
                                label={`ID ${ad.adIdentifier}`}
                                size="small"
                                sx={{
                                  color: "#fff",
                                  backgroundColor: "rgba(255, 31, 33, 0.16)",
                                  border: "1px solid rgba(255, 31, 33, 0.3)",
                                }}
                              />
                            </Box>

                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                                gap: 1,
                                mb: 2,
                              }}
                            >
                              <SummaryMetric
                                label="Views"
                                value={ad.views.toLocaleString("pt-BR")}
                                icon={<VisibilityIcon sx={{ color: "#fff" }} />}
                              />
                              <SummaryMetric
                                label="Cliques"
                                value={ad.clicks.toLocaleString("pt-BR")}
                                icon={<TouchAppIcon sx={{ color: "#fff" }} />}
                              />
                              <SummaryMetric
                                label="CTR"
                                value={`${ad.ctr.toFixed(2)}%`}
                                icon={<CampaignIcon sx={{ color: "#fff" }} />}
                              />
                            </Box>

                            <Typography
                              sx={{
                                color: "rgba(255,255,255,0.55)",
                                fontSize: "0.85rem",
                                overflowWrap: "anywhere",
                              }}
                            >
                              Link destino: {ad.redirectUrl}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Paper>
                </>
              )}
            </Box>
          ) : (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", md: "center" },
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                  mb: 3,
                }}
              >
               

                <TextField
                  select
                  label="Evento"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  sx={{ ...textFieldSx, width: { xs: "100%", md: "auto" }, minWidth: { xs: "100%", md: 260 } }}
                >
                  <MenuItem value="all">Todos os eventos</MenuItem>
                  {events.map((event) => (
                    <MenuItem key={event.id} value={String(event.id)}>
                      {event.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                  gap: 3,
                }}
              >
                <ChartPanel title="Visualizações por dia">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={viewsChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="day" tick={{ fill: "#d1d5db" }} />
                      <YAxis tick={{ fill: "#d1d5db" }} />
                      <Tooltip contentStyle={chartTooltipSx} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ffcc01"
                        strokeWidth={3}
                        dot={{ fill: "#ffcc01", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Cliques por dia">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={clicksChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="day" tick={{ fill: "#d1d5db" }} />
                      <YAxis tick={{ fill: "#d1d5db" }} />
                      <Tooltip contentStyle={chartTooltipSx} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#4fc3f7"
                        strokeWidth={3}
                        dot={{ fill: "#4fc3f7", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Distribuição de anúncios">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={adTypeChartData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        innerRadius={48}
                        label
                      >
                        {adTypeChartData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipSx} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Desempenho por anúncio">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={performanceChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="nome" tick={{ fill: "#d1d5db", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#d1d5db" }} />
                      <Tooltip contentStyle={chartTooltipSx} />
                      <Legend wrapperStyle={{ color: "#fff" }} />
                      <Bar dataKey="views" fill="#ffcc01" name="Views" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="cliques" fill="#ff1f21" name="Cliques" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Gênero do público">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={genderChartData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        innerRadius={46}
                        label
                      >
                        {genderChartData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipSx} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Faixa etária">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ageChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="range" tick={{ fill: "#d1d5db" }} />
                      <YAxis tick={{ fill: "#d1d5db" }} />
                      <Tooltip contentStyle={chartTooltipSx} />
                      <Bar dataKey="audience" fill="#ab47bc" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Hobbies em destaque">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={hobbiesChartData} layout="vertical">
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis type="number" tick={{ fill: "#d1d5db" }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: "#d1d5db", fontSize: 11 }} width={95} />
                      <Tooltip contentStyle={chartTooltipSx} />
                      <Bar dataKey="value" fill="#66bb6a" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Profissões">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={jobsChartData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        label
                      >
                        {jobsChartData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipSx} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Audiência por estado">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statesChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="uf" tick={{ fill: "#d1d5db" }} />
                      <YAxis tick={{ fill: "#d1d5db" }} />
                      <Tooltip contentStyle={chartTooltipSx} />
                      <Bar dataKey="audience" fill="#4fc3f7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Engajamento por marca">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={brandsChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="brand" tick={{ fill: "#d1d5db", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#d1d5db" }} />
                      <Tooltip contentStyle={chartTooltipSx} />
                      <Legend wrapperStyle={{ color: "#fff" }} />
                      <Bar dataKey="engagement" fill="#ff1f21" name="Engajamento" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

function SummaryMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Box
      sx={{
        p: 2,
        minWidth: 0,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, minWidth: 0 }}>
        <Box
          sx={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 31, 33, 0.2)",
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.7)",
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: "#fff",
          fontWeight: 700,
          fontSize: { xs: "0.96rem", sm: "1.05rem" },
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function StatsCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Card
      sx={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>
              {label}
            </Typography>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.35rem", sm: "1.7rem" }, overflowWrap: "anywhere" }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              flexShrink: 0,
              width: 42,
              height: 42,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 31, 33, 0.2)",
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
      }}
    >
      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function AudienceMultiSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <Box>
      <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>{label}</Typography>
      <Autocomplete
        multiple
        freeSolo
        options={options}
        value={value}
        filterSelectedOptions
        onChange={(_, values) => onChange(values.map((item) => item.trim()).filter(Boolean))}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={`${label}-${option}-${index}`}
              label={option}
              sx={{
                color: "#fff",
                backgroundColor: "rgba(255, 31, 33, 0.18)",
                border: "1px solid rgba(255, 31, 33, 0.35)",
              }}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            sx={textFieldSx}
          />
        )}
      />
      <Typography sx={{ color: "rgba(255,255,255,0.55)", mt: 0.75, fontSize: "0.82rem" }}>
        Digite para buscar, clique na opção e ela será adicionada.
      </Typography>
    </Box>
  );
}

function AudienceGenderSelector({
  value,
  onChange,
}: {
  value: AudienceGender;
  onChange: (value: AudienceGender) => void;
}) {
  return (
    <Box>
      <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
        Gênero do público
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, nextValue: AudienceGender | null) => {
          if (nextValue) {
            onChange(nextValue);
          }
        }}
        sx={{
          flexWrap: "wrap",
          gap: 1,
          "& .MuiToggleButton-root": {
            color: "rgba(255,255,255,0.75)",
            borderColor: "rgba(255,255,255,0.14)",
            textTransform: "none",
            borderRadius: "999px !important",
            px: 2,
          },
          "& .MuiToggleButton-root.Mui-selected": {
            color: "#fff",
            backgroundColor: "rgba(255, 31, 33, 0.22)",
            borderColor: "rgba(255, 31, 33, 0.45)",
          },
        }}
      >
        <ToggleButton value="todos">Todos</ToggleButton>
        <ToggleButton value="feminino">Feminino</ToggleButton>
        <ToggleButton value="masculino">Masculino</ToggleButton>
        <ToggleButton value="nao_binario">Não binário</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

function AudienceAgeRangeSelector({
  value,
  onChange,
}: {
  value: number[];
  onChange: (value: number[]) => void;
}) {
  return (
    <Box>
      <Typography sx={{ color: "#fff", fontWeight: 600, mb: 1 }}>
        Faixa etária
      </Typography>
      <Slider
        value={value}
        onChange={(_, newValue) => onChange(newValue as number[])}
        valueLabelDisplay="auto"
        min={18}
        max={100}
        disableSwap
        sx={{
          color: "rgb(255, 31, 33)",
          "& .MuiSlider-thumb": {
            width: 18,
            height: 18,
          },
        }}
      />
      <Typography sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
        De {value[0]} a {value[1]} anos
      </Typography>
    </Box>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2,
        py: 1.2,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>{label}</Typography>
      <Typography
        sx={{
          color: "#fff",
          fontWeight: 600,
          textAlign: { xs: "left", sm: "right" },
          width: "100%",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatOptionalDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("pt-BR");
}

function formatGenderLabel(value: AudienceGender) {
  if (value === "feminino") return "Feminino";
  if (value === "masculino") return "Masculino";
  if (value === "nao_binario") return "Não binário";
  return "Todos";
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.05)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.16)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.35)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgb(255, 31, 33)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.65)",
  },
} as const;

const primaryButtonSx = {
  backgroundColor: "rgb(255, 31, 33)",
  color: "#fff",
  fontWeight: 700,
  px: 3,
  "&:hover": {
    backgroundColor: "rgb(220, 20, 22)",
  },
} as const;

const secondaryButtonSx = {
  color: "#fff",
  borderColor: "rgba(255,255,255,0.2)",
  "&:hover": {
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
} as const;

const tableHeadSx = {
  color: "rgba(255,255,255,0.7)",
  borderBottomColor: "rgba(255,255,255,0.08)",
  fontWeight: 700,
};

const tableBodySx = {
  color: "#fff",
  borderBottomColor: "rgba(255,255,255,0.08)",
};

const chartTooltipSx = {
  backgroundColor: "#111827",
  borderColor: "rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#fff",
};
