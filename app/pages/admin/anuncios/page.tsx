"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
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

type TabValue = "create" | "dashboard";
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
  campaignName: "Mercado Pago - Pague com QR Code",
  adType: "CPC",
  creativeUrl: "/ads/mercadopago.png",
  creativeName: "mercadopago.png",
  redirectUrl: "https://www.mercadopago.com.br",
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
    title: "Circuito Sertanejo Experience",
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
    name: "Globoplay",
    advertiser: "Globoplay",
    imageUrl: "/ads/1.png",
    redirectUrl: "https://www.globoplay.globo.com",
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
    name: "Brahma",
    advertiser: "Brahma",
    imageUrl: "/ads/2.png",
    redirectUrl: "https://www.brahma.com.br",
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
    name: "Sicoob",
    advertiser: "Sicoob",
    imageUrl: "/ads/3.png",
    redirectUrl: "https://www.sicoob.com.br",
    views: 22510,
    clicks: 905,
    ctr: 4.02,
    firstActivity: "2026-04-01T19:05:00",
    lastActivity: "2026-04-02T23:05:00",
    eventIds: [102, 103],
  },
  {
    id: "ad-4",
    adIdentifier: "4",
    name: "Volkswagen",
    advertiser: "Volkswagen",
    imageUrl: "/ads/4.png",
    redirectUrl: "https://www.vw.com.br",
    views: 11760,
    clicks: 318,
    ctr: 2.70,
    firstActivity: "2026-04-01T16:20:00",
    lastActivity: "2026-04-02T20:55:00",
    eventIds: [101, 102, 103],
  },
  {
    id: "ad-5",
    adIdentifier: "5",
    name: "Ballantines",
    advertiser: "Ballantines",
    imageUrl: "/ads/5.png",
    redirectUrl: "https://www.ballantines.com",
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
    { brand: "Circuito Sertanejo", engagement: 58 },
  ],
  "101": [
    { brand: "Brahma", engagement: 69 },
    { brand: "Beefeater", engagement: 78 },
    { brand: "Ballantine's", engagement: 71 },
    { brand: "Maturatta", engagement: 67 },
    { brand: "Circuito Sertanejo", engagement: 43 },
  ],
  "102": [
    { brand: "Brahma", engagement: 94 },
    { brand: "Beefeater", engagement: 83 },
    { brand: "Ballantine's", engagement: 72 },
    { brand: "Maturatta", engagement: 49 },
    { brand: "Circuito Sertanejo", engagement: 40 },
  ],
  "103": [
    { brand: "Brahma", engagement: 73 },
    { brand: "Beefeater", engagement: 61 },
    { brand: "Ballantine's", engagement: 69 },
    { brand: "Maturatta", engagement: 70 },
    { brand: "Circuito Sertanejo", engagement: 64 },
  ],
};

const chartPalette = ["#ffffff", "#ffcc01", "#4fc3f7", "#ab47bc", "#66bb6a"];

export default function AdminAdsPage() {
  const router = useRouter();
  const { isAdmin, authReady } = useAuth();
  const { showToast } = useToast();
  const uploadedCreativeUrlRef = useRef<string | null>(null);

  const [tab, setTab] = useState<TabValue>("dashboard");
  const selectedEventId = "all";
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AdDraft>(initialDraft);
  const [integrationNotice, setIntegrationNotice] = useState(false);

  const events = mockEvents;
  const eventsLoading = false;

  useEffect(() => {
    if (authReady && !isAdmin) {
      router.push("/pages/user/home");
    }
  }, [authReady, isAdmin, router]);

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

  const unitPrice = draft.adType === "CPC" ? 0.14 : 0.10;
  const parsedTargetUnits = Number(draft.targetUnits) || 0;
  const parsedDurationDays = Math.max(1, Number(draft.durationDays) || 1);

  const baseTotal = parsedTargetUnits * unitPrice;

  // Segmentação: cobrança adicional sobre a base
  // Até 3 hobbies, 3 profissões e 18 km = incluso no preço base
  // Cada hobby além de 3: +1% da base
  // Cada profissão além de 3: +1% da base
  // Cada km além de 18: +0,3% da base
  const extraHobbies    = Math.max(0, draft.hobbies.length - 3);
  const extraProfessions = Math.max(0, draft.professions.length - 3);
  const extraKm          = Math.max(0, draft.radiusKm - 18);

  const extraHobbiesValue      = baseTotal * extraHobbies * 0.01;
  const extraProfessionsValue  = baseTotal * extraProfessions * 0.01;
  const extraKmValue           = baseTotal * extraKm * 0.003;
  const segmentationExtra      = extraHobbiesValue + extraProfessionsValue + extraKmValue;

  const estimatedTotal = baseTotal + segmentationExtra;
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
      return Boolean(draft.address.trim());
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

  // 5 imagens em /public/ads + 1 vídeo em /public/video
  const ADS_IMAGE_COUNT = 5;
  const ADS_VIDEO_COUNT = 1;

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
            backgroundColor: "transparent",
            boxShadow: "none",
            border: "none",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              mb: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={tab === "create" ? () => setTab("dashboard") : () => router.back()}
                sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" } }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 31, 33, 0.15)",
                  flexShrink: 0,
                }}
              >
                <CampaignIcon sx={{ color: "#ffffff", fontSize: 28 }} />
              </Box>

              <Box>
                <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.5rem", md: "1.9rem" } }}>
                  {tab === "create" ? "Inserir anúncio" : "Anúncios"}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mt: 0.25 }}>
                  Circuito Sertanejo
                </Typography>
              </Box>
            </Box>

            {tab === "dashboard" && (
              <Button
                variant="contained"
                onClick={() => setTab("create")}
                sx={{
                  backgroundColor: "#ffffff",
                  color: "#111111",
                  fontWeight: 700,
                  borderRadius: "12px",
                  textTransform: "none",
                  px: 3,
                  py: 1.1,
                  fontSize: "0.95rem",
                  "&:hover": { backgroundColor: "#e8e8e8" },
                }}
              >
                + Inserir anúncio
              </Button>
            )}
          </Box>

          {tab === "create" ? (
            <Box>
              <Box sx={{ mb: 4, overflowX: "auto", pb: 1 }}>
                <Stepper
                  activeStep={step}
                  alternativeLabel
                  sx={{
                    minWidth: 520,
                    "& .MuiStepLabel-label": {
                      color: "rgba(255,255,255,0.5)",
                      fontSize: { xs: "0.78rem", sm: "0.92rem" },
                    },
                    "& .MuiStepLabel-label.Mui-active": { color: "#fff", fontWeight: 700 },
                    "& .MuiStepLabel-label.Mui-completed": { color: "rgba(255,255,255,0.6)" },
                    "& .MuiStepIcon-root": { color: "rgba(255,255,255,0.15)" },
                    "& .MuiStepIcon-root.Mui-active": { color: "#ffffff" },
                    "& .MuiStepIcon-root.Mui-completed": { color: "rgba(255,255,255,0.45)" },
                    "& .MuiStepIcon-text": { fill: "#111111" },
                    "& .MuiStepConnector-line": { borderColor: "rgba(255,255,255,0.15)" },
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
                              Mock inicial carregado com `mercadopago.png`. Ao escolher outra imagem, o preview
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
                        Segmentação
                      </Typography>
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
                      <ReviewRow label="Evento" value="Circuito Sertanejo" />
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
                  <CardContent sx={{ display: "grid", gap: 0 }}>
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2.5 }}>
                      Resumo rápido
                    </Typography>

                    {/* Bloco base */}
                    <Box sx={{ display: "grid", gap: 1.25, mb: 2 }}>
                      <BudgetRow
                        label="Tipo de anúncio"
                        value={draft.adType === "CPC" ? "CPC — por clique" : "CPV — por view"}
                      />
                      <BudgetRow
                        label="Preço unitário"
                        value={`${formatCurrency(unitPrice)} / ${draft.adType === "CPC" ? "clique" : "view"}`}
                      />
                      <BudgetRow
                        label={`Meta de ${draft.adType === "CPC" ? "cliques" : "views"}`}
                        value={parsedTargetUnits > 0 ? parsedTargetUnits.toLocaleString("pt-BR") : "—"}
                      />
                      <BudgetRow
                        label="Duração"
                        value={`${parsedDurationDays} ${parsedDurationDays === 1 ? "dia" : "dias"}`}
                      />
                      <BudgetRow
                        label="Base (unidades × preço)"
                        value={formatCurrency(baseTotal)}
                        highlight
                      />
                    </Box>

                    {/* Segmentação */}
                    <Box
                      sx={{
                        borderRadius: 2,
                        border: "1px solid rgba(255,255,255,0.08)",
                        p: 1.5,
                        mb: 2,
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 1.25 }}>
                        Segmentação
                      </Typography>

                      <Box sx={{ display: "grid", gap: 1 }}>
                        <BudgetRow
                          label={`Hobbies (${draft.hobbies.length}/3 incluso)`}
                          value={extraHobbies > 0 ? `+${extraHobbies} extra${extraHobbies > 1 ? "s" : ""} → +${formatCurrency(extraHobbiesValue)}` : "Incluso"}
                          extra={extraHobbies > 0}
                        />
                        <BudgetRow
                          label={`Profissões (${draft.professions.length}/3 incluso)`}
                          value={extraProfessions > 0 ? `+${extraProfessions} extra${extraProfessions > 1 ? "s" : ""} → +${formatCurrency(extraProfessionsValue)}` : "Incluso"}
                          extra={extraProfessions > 0}
                        />
                        <BudgetRow
                          label={`Raio (${draft.radiusKm} km / 18 km incluso)`}
                          value={extraKm > 0 ? `+${extraKm} km → +${formatCurrency(extraKmValue)}` : "Incluso"}
                          extra={extraKm > 0}
                        />
                        {segmentationExtra > 0 && (
                          <BudgetRow
                            label="Subtotal segmentação"
                            value={`+${formatCurrency(segmentationExtra)}`}
                            extra
                          />
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />

                    {/* Totais */}
                    <Box sx={{ display: "grid", gap: 1.25 }}>
                      <BudgetRow
                        label="Total estimado"
                        value={formatCurrency(estimatedTotal)}
                        highlight
                        large
                      />
                      <BudgetRow
                        label="Média diária"
                        value={formatCurrency(estimatedDaily)}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          ) : (
            /* ── DASHBOARD ── */
            <Box sx={{ display: "grid", gap: 3 }}>

              {/* Cards de resumo */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>

                {/* Views + Cliques fundidos */}
                <Card sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                  <CardContent sx={{ display: "flex", gap: 0, p: "20px !important" }}>
                    <Box sx={{ flex: 1, pr: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(255,31,33,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <VisibilityIcon sx={{ color: "#fff", fontSize: 16 }} />
                        </Box>
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>Views</Typography>
                      </Box>
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.3rem", sm: "1.55rem" } }}>
                        {totals.totalViews.toLocaleString("pt-BR")}
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                    <Box sx={{ flex: 1, pl: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(255,31,33,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TouchAppIcon sx={{ color: "#fff", fontSize: 16 }} />
                        </Box>
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>Cliques</Typography>
                      </Box>
                      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.3rem", sm: "1.55rem" } }}>
                        {totals.totalClicks.toLocaleString("pt-BR")}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                <StatsCard
                  label="CTR médio"
                  value={`${totals.ctr.toFixed(2)}%`}
                  icon={<CampaignIcon sx={{ color: "#fff" }} />}
                />

                {/* Anúncios monitorados */}
                <Card sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                  <CardContent sx={{ p: "20px !important" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>Anúncios monitorados</Typography>
                        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "1.3rem", sm: "1.55rem" } }}>
                          {ADS_IMAGE_COUNT + ADS_VIDEO_COUNT}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", mt: 0.5 }}>
                          {ADS_IMAGE_COUNT} imagens · {ADS_VIDEO_COUNT} vídeo
                        </Typography>
                      </Box>
                      <Box sx={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "rgba(255,31,33,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CampaignIcon sx={{ color: "#fff" }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Desempenho por anúncio — cards com imagem/vídeo */}
              <Paper sx={{ p: 2.5, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2.5 }}>
                  Desempenho por anúncio
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }, gap: 2 }}>
                  {mergedRows.slice(0, 5).map((ad) => (
                    <Card key={ad.id} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                      {/* Imagem ou vídeo do anúncio */}
                      {ad.imageUrl.endsWith(".mp4") ? (
                        <Box component="video" src={ad.imageUrl} muted playsInline
                          sx={{ width: "100%", height: 180, objectFit: "cover", display: "block", backgroundColor: "#000" }} />
                      ) : (
                        <Box component="img" src={ad.imageUrl} alt={ad.name}
                          sx={{ width: "100%", height: 180, objectFit: "cover", display: "block", backgroundColor: "rgba(255,255,255,0.04)" }} />
                      )}
                      <CardContent sx={{ p: "14px !important" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
                          <Box>
                            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.3 }}>{ad.name}</Typography>
                            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>{ad.advertiser}</Typography>
                          </Box>
                          <Chip label={`${ad.ctr.toFixed(2)}% CTR`} size="small"
                            sx={{ color: "#fff", backgroundColor: "rgba(255,31,33,0.16)", border: "1px solid rgba(255,31,33,0.3)", fontSize: "0.7rem", flexShrink: 0 }} />
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 1.5 }}>
                          {[
                            { label: "Views", value: ad.views.toLocaleString("pt-BR") },
                            { label: "Cliques", value: ad.clicks.toLocaleString("pt-BR") },
                            { label: "CTR", value: `${ad.ctr.toFixed(2)}%` },
                          ].map((m) => (
                            <Box key={m.label} sx={{ background: "rgba(255,255,255,0.04)", borderRadius: 2, p: 1, textAlign: "center" }}>
                              <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.68rem" }}>{m.label}</Typography>
                              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>{m.value}</Typography>
                            </Box>
                          ))}
                        </Box>
                        <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
                          Última atividade: {formatOptionalDate(ad.lastActivity)}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>

              {/* Horários com mais atividade */}
              <Paper sx={{ p: 2.5, backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>
                  Horários com mais atividade
                </Typography>
                <Box sx={{ display: "grid", gap: 2 }}>
                  {topHours.map((item) => (
                    <Box key={item.hour}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                        <Typography sx={{ color: "#fff", fontWeight: 600 }}>
                          {String(item.hour).padStart(2, "0")}:00
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>
                          {item.views.toLocaleString("pt-BR")} views · {item.clicks.toLocaleString("pt-BR")} cliques
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={item.percentage}
                        sx={{ height: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", "& .MuiLinearProgress-bar": { backgroundColor: "#ffffff" } }} />
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* ── Gráficos ── */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
                <ChartPanel title="Visualizações por dia">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={viewsChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="day" tick={{ fill: "#d1d5db" }} />
                      <YAxis tick={{ fill: "#d1d5db" }} />
                      <Tooltip contentStyle={chartTooltipSx} />
                      <Line type="monotone" dataKey="value" stroke="#ffcc01" strokeWidth={3} dot={{ fill: "#ffcc01", strokeWidth: 0 }} />
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
                      <Line type="monotone" dataKey="value" stroke="#4fc3f7" strokeWidth={3} dot={{ fill: "#4fc3f7", strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Distribuição de anúncios">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={adTypeChartData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={48} label>
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
                      <Bar dataKey="cliques" fill="#ffffff" name="Cliques" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel title="Gênero do público">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={genderChartData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={46} label>
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
                      <Pie data={jobsChartData} dataKey="value" nameKey="name" outerRadius={90} label>
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
                      <Bar dataKey="engagement" fill="#ffffff" name="Engajamento" radius={[6, 6, 0, 0]} />
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

function BudgetRow({
  label,
  value,
  highlight = false,
  large = false,
  extra = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  large?: boolean;
  extra?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
      <Typography
        sx={{
          color: "rgba(255,255,255,0.6)",
          fontSize: large ? "0.9rem" : "0.82rem",
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: highlight ? "#fff" : extra ? "#ffcc01" : "rgba(255,255,255,0.9)",
          fontWeight: highlight || large ? 700 : 500,
          fontSize: large ? "1.05rem" : "0.85rem",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
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
          color: "#ffffff",
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
      borderColor: "#ffffff",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.65)",
  },
} as const;

const primaryButtonSx = {
  backgroundColor: "#ffffff",
  color: "#111111",
  fontWeight: 700,
  px: 3,
  "&:hover": {
    backgroundColor: "#e8e8e8",
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
