import { type Campaign } from "./campaignService";

export interface PerformanceDay {
  date: string;
  units: number;
  gasto: number;
}

// ─── Performance base (reutilizada por todos os patrocinadores) ───────────────

const PERF_FINISHED_10D: PerformanceDay[] = [
  { date: "02/06", units: 230, gasto: 32.20 },
  { date: "03/06", units: 412, gasto: 57.68 },
  { date: "04/06", units: 534, gasto: 74.76 },
  { date: "05/06", units: 623, gasto: 87.22 },
  { date: "06/06", units: 587, gasto: 82.18 },
  { date: "07/06", units: 612, gasto: 85.68 },
  { date: "08/06", units: 578, gasto: 80.92 },
  { date: "09/06", units: 542, gasto: 75.88 },
  { date: "10/06", units: 456, gasto: 63.84 },
  { date: "11/06", units: 249, gasto: 34.86 },
];

const PERF_FINISHED_7D: PerformanceDay[] = [
  { date: "08/06", units: 145, gasto: 20.30 },
  { date: "09/06", units: 289, gasto: 40.46 },
  { date: "10/06", units: 367, gasto: 51.38 },
  { date: "11/06", units: 412, gasto: 57.68 },
  { date: "12/06", units: 389, gasto: 54.46 },
  { date: "13/06", units: 334, gasto: 46.76 },
  { date: "14/06", units: 251, gasto: 35.14 },
];

const PERF_FINISHED_CPV: PerformanceDay[] = [
  { date: "20/05", units: 89,  gasto: 8.90  },
  { date: "21/05", units: 178, gasto: 17.80 },
  { date: "22/05", units: 234, gasto: 23.40 },
  { date: "23/05", units: 267, gasto: 26.70 },
  { date: "24/05", units: 289, gasto: 28.90 },
  { date: "25/05", units: 312, gasto: 31.20 },
  { date: "26/05", units: 278, gasto: 27.80 },
  { date: "27/05", units: 234, gasto: 23.40 },
  { date: "28/05", units: 189, gasto: 18.90 },
  { date: "29/05", units: 130, gasto: 13.00 },
];

const PERF_ACTIVE: PerformanceDay[] = [
  { date: "12/06", units: 167, gasto: 16.70 },
  { date: "13/06", units: 289, gasto: 28.90 },
  { date: "14/06", units: 312, gasto: 31.20 },
  { date: "15/06", units: 334, gasto: 33.40 },
  { date: "16/06", units: 156, gasto: 15.60 },
];

// ─── Factory de campanhas por brand ──────────────────────────────────────────

interface BrandConfig {
  prefix: string;         // ex: "/brahma"
  idBase: number;         // ex: 9001
  campaigns: Array<{
    name: string;
    creative_name: string;
    ad_type: "CPC" | "CPV";
    status: string;
    target_units: number;
    budget_value: number;
    start_at: string;
    duration_days: number;
    budget_type: "total" | "diario";
    hobbies?: string[];
    professions?: string[];
  }>;
}

function makeCampaigns(cfg: BrandConfig): Campaign[] {
  return cfg.campaigns.map((def, i) => ({
    id: cfg.idBase + i,
    patrocinador_id: cfg.idBase,
    campaign_name: def.name,
    ad_type: def.ad_type,
    creative_url: `${cfg.prefix}/${i + 1}.png`,
    creative_name: def.creative_name,
    redirect_url: "https://circuitosertanejo.com.br",
    target_units: def.target_units,
    budget_type: def.budget_type,
    budget_value: def.budget_value,
    start_at: def.start_at,
    duration_days: def.duration_days,
    hobbies: def.hobbies ?? [],
    professions: def.professions ?? [],
    event_id: null,
    gender: null,
    age_min: null,
    age_max: null,
    address: null,
    radius_km: null,
    location_lat: null,
    location_lng: null,
    status: def.status,
    created_at: "2026-05-20T10:00:00",
    updated_at: "2026-06-17T12:00:00",
  }));
}

// ─── Brahma (9001–9005) ───────────────────────────────────────────────────────

const BRAHMA_CAMPAIGNS = makeCampaigns({
  prefix: "/brahma",
  idBase: 9001,
  campaigns: [
    {
      name: "Experiencia Chop Brahma",
      creative_name: "Chop Brahma",
      ad_type: "CPC", status: "finished",
      target_units: 5000, budget_value: 700, budget_type: "total",
      start_at: "2026-06-02", duration_days: 10,
      hobbies: ["Sertanejo", "Rodeio", "Agronegócio"],
      professions: ["Agricultor / Fazendeiro", "Empresário", "Comerciante", "Autônomo"],
    },
    {
      name: "Brahma Express São Paulo",
      creative_name: "Brahma Express",
      ad_type: "CPC", status: "finished",
      target_units: 2500, budget_value: 350, budget_type: "total",
      start_at: "2026-06-08", duration_days: 7,
      hobbies: ["Futebol", "Música", "Festas"],
      professions: ["Empresário", "Estudante", "Profissional Liberal"],
    },
    {
      name: "Chop Brahma Interior",
      creative_name: "Chop Brahma",
      ad_type: "CPV", status: "finished",
      target_units: 2000, budget_value: 200, budget_type: "total",
      start_at: "2026-05-20", duration_days: 10,
      hobbies: ["Rodeio", "Campo", "Sertanejo"],
      professions: ["Agricultor / Fazendeiro", "Autônomo"],
    },
    {
      name: "Verão com Brahma",
      creative_name: "Chop Brahma Verão",
      ad_type: "CPC", status: "pending",
      target_units: 3571, budget_value: 500, budget_type: "total",
      start_at: "2026-07-01", duration_days: 14,
      hobbies: ["Praia", "Música", "Esportes"],
    },
    {
      name: "Brahma Agro 2026",
      creative_name: "Brahma Agro",
      ad_type: "CPV", status: "active",
      target_units: 1500, budget_value: 30, budget_type: "diario",
      start_at: "2026-06-12", duration_days: 13,
      hobbies: ["Agronegócio", "Rodeio", "Campo"],
      professions: ["Agricultor / Fazendeiro", "Empresário"],
    },
  ],
});

// ─── Sicoob (9011–9015) ───────────────────────────────────────────────────────

const SICOOB_CAMPAIGNS = makeCampaigns({
  prefix: "/sicoob",
  idBase: 9011,
  campaigns: [
    {
      name: "Sicoob Cooperativa Ribeirão",
      creative_name: "Sicoob Credicitrus",
      ad_type: "CPC", status: "finished",
      target_units: 5000, budget_value: 700, budget_type: "total",
      start_at: "2026-06-02", duration_days: 10,
      hobbies: ["Agronegócio", "Finanças", "Negócios"],
      professions: ["Agricultor / Fazendeiro", "Empresário", "Autônomo"],
    },
    {
      name: "Sicoob Digital São Paulo",
      creative_name: "Sicoob Digital",
      ad_type: "CPC", status: "finished",
      target_units: 2500, budget_value: 350, budget_type: "total",
      start_at: "2026-06-08", duration_days: 7,
      hobbies: ["Finanças", "Tecnologia", "Negócios"],
      professions: ["Empresário", "Profissional Liberal", "Autônomo"],
    },
    {
      name: "Sicoob Interior Paulista",
      creative_name: "Sicoob Cooperativa",
      ad_type: "CPV", status: "finished",
      target_units: 2000, budget_value: 200, budget_type: "total",
      start_at: "2026-05-20", duration_days: 10,
      hobbies: ["Campo", "Agronegócio", "Comunidade"],
      professions: ["Agricultor / Fazendeiro", "Comerciante"],
    },
    {
      name: "Sicoob Verão Financeiro",
      creative_name: "Sicoob Verão",
      ad_type: "CPC", status: "pending",
      target_units: 3571, budget_value: 500, budget_type: "total",
      start_at: "2026-07-01", duration_days: 14,
      hobbies: ["Finanças", "Negócios", "Planejamento"],
    },
    {
      name: "Sicoob Agro 2026",
      creative_name: "Sicoob Agro",
      ad_type: "CPV", status: "active",
      target_units: 1500, budget_value: 30, budget_type: "diario",
      start_at: "2026-06-12", duration_days: 13,
      hobbies: ["Agronegócio", "Campo", "Cooperativismo"],
      professions: ["Agricultor / Fazendeiro", "Empresário"],
    },
  ],
});

// ─── Volkswagen (9021–9025) ───────────────────────────────────────────────────

const VOLKSWAGEN_CAMPAIGNS = makeCampaigns({
  prefix: "/volkswagen",
  idBase: 9021,
  campaigns: [
    {
      name: "VW Polo Test Drive SP",
      creative_name: "Volkswagen Polo",
      ad_type: "CPC", status: "finished",
      target_units: 5000, budget_value: 700, budget_type: "total",
      start_at: "2026-06-02", duration_days: 10,
      hobbies: ["Automóveis", "Tecnologia", "Esportes"],
      professions: ["Empresário", "Profissional Liberal", "Autônomo"],
    },
    {
      name: "Virtus Ribeirão Preto",
      creative_name: "Volkswagen Virtus",
      ad_type: "CPC", status: "finished",
      target_units: 2500, budget_value: 350, budget_type: "total",
      start_at: "2026-06-08", duration_days: 7,
      hobbies: ["Automóveis", "Família", "Viagens"],
      professions: ["Comerciante", "Autônomo", "Empresário"],
    },
    {
      name: "VW Saveiro Interior",
      creative_name: "Volkswagen Saveiro",
      ad_type: "CPV", status: "finished",
      target_units: 2000, budget_value: 200, budget_type: "total",
      start_at: "2026-05-20", duration_days: 10,
      hobbies: ["Agronegócio", "Campo", "Trabalho"],
      professions: ["Agricultor / Fazendeiro", "Comerciante", "Autônomo"],
    },
    {
      name: "VW Novidades Verão 2026",
      creative_name: "VW Verão",
      ad_type: "CPC", status: "pending",
      target_units: 3571, budget_value: 500, budget_type: "total",
      start_at: "2026-07-01", duration_days: 14,
      hobbies: ["Automóveis", "Esportes", "Música"],
    },
    {
      name: "VW Agro Sertanejo 2026",
      creative_name: "VW Agro",
      ad_type: "CPV", status: "active",
      target_units: 1500, budget_value: 30, budget_type: "diario",
      start_at: "2026-06-12", duration_days: 13,
      hobbies: ["Agronegócio", "Rodeio", "Campo"],
      professions: ["Agricultor / Fazendeiro", "Comerciante"],
    },
  ],
});

// ─── Ballantine's (9031–9035) ─────────────────────────────────────────────────

const BALLANTINES_CAMPAIGNS = makeCampaigns({
  prefix: "/ballantines",
  idBase: 9031,
  campaigns: [
    {
      name: "Ballantine's Experience SP",
      creative_name: "Ballantine's Finest",
      ad_type: "CPC", status: "finished",
      target_units: 5000, budget_value: 700, budget_type: "total",
      start_at: "2026-06-02", duration_days: 10,
      hobbies: ["Gastronomia", "Festas", "Música"],
      professions: ["Empresário", "Profissional Liberal"],
    },
    {
      name: "Ballantine's 12 Anos Circuito",
      creative_name: "Ballantine's 12",
      ad_type: "CPC", status: "finished",
      target_units: 2500, budget_value: 350, budget_type: "total",
      start_at: "2026-06-08", duration_days: 7,
      hobbies: ["Sertanejo", "Festas", "Gastronomia"],
      professions: ["Empresário", "Autônomo"],
    },
    {
      name: "Ballantine's Interior Paulista",
      creative_name: "Ballantine's",
      ad_type: "CPV", status: "finished",
      target_units: 2000, budget_value: 200, budget_type: "total",
      start_at: "2026-05-20", duration_days: 10,
      hobbies: ["Rodeio", "Festas", "Música"],
      professions: ["Comerciante", "Autônomo"],
    },
    {
      name: "Ballantine's Verão 2026",
      creative_name: "Ballantine's Verão",
      ad_type: "CPC", status: "pending",
      target_units: 3571, budget_value: 500, budget_type: "total",
      start_at: "2026-07-01", duration_days: 14,
      hobbies: ["Praia", "Música", "Festas"],
    },
    {
      name: "Ballantine's Agro Night",
      creative_name: "Ballantine's Agro",
      ad_type: "CPV", status: "active",
      target_units: 1500, budget_value: 30, budget_type: "diario",
      start_at: "2026-06-12", duration_days: 13,
      hobbies: ["Agronegócio", "Rodeio", "Festas"],
      professions: ["Agricultor / Fazendeiro", "Empresário"],
    },
  ],
});

// ─── Globo (9041–9045) ────────────────────────────────────────────────────────

const GLOBO_CAMPAIGNS = makeCampaigns({
  prefix: "/globo",
  idBase: 9041,
  campaigns: [
    {
      name: "Globo Play Circuito SP",
      creative_name: "Globo Play",
      ad_type: "CPC", status: "finished",
      target_units: 5000, budget_value: 700, budget_type: "total",
      start_at: "2026-06-02", duration_days: 10,
      hobbies: ["Entretenimento", "Música", "Sertanejo"],
      professions: ["Empresário", "Estudante", "Profissional Liberal"],
    },
    {
      name: "Globo Ao Vivo Ribeirão",
      creative_name: "Globo Ao Vivo",
      ad_type: "CPC", status: "finished",
      target_units: 2500, budget_value: 350, budget_type: "total",
      start_at: "2026-06-08", duration_days: 7,
      hobbies: ["Entretenimento", "Esportes", "Notícias"],
      professions: ["Autônomo", "Comerciante", "Profissional Liberal"],
    },
    {
      name: "Globo Play Interior",
      creative_name: "Globo Play",
      ad_type: "CPV", status: "finished",
      target_units: 2000, budget_value: 200, budget_type: "total",
      start_at: "2026-05-20", duration_days: 10,
      hobbies: ["Sertanejo", "Rodeio", "Entretenimento"],
      professions: ["Comerciante", "Autônomo"],
    },
    {
      name: "Globo Verão 2026",
      creative_name: "Globo Verão",
      ad_type: "CPC", status: "pending",
      target_units: 3571, budget_value: 500, budget_type: "total",
      start_at: "2026-07-01", duration_days: 14,
      hobbies: ["Praia", "Esportes", "Música"],
    },
    {
      name: "Globo Agro Especial",
      creative_name: "Globo Rural",
      ad_type: "CPV", status: "active",
      target_units: 1500, budget_value: 30, budget_type: "diario",
      start_at: "2026-06-12", duration_days: 13,
      hobbies: ["Agronegócio", "Campo", "Entretenimento"],
      professions: ["Agricultor / Fazendeiro", "Empresário"],
    },
  ],
});

// ─── Mapa de brands ───────────────────────────────────────────────────────────

export const BRAND_MOCKS: Record<string, Campaign[]> = {
  brahma:       BRAHMA_CAMPAIGNS,
  sicoob:       SICOOB_CAMPAIGNS,
  volkswagen:   VOLKSWAGEN_CAMPAIGNS,
  ballantines:  BALLANTINES_CAMPAIGNS,
  globo:        GLOBO_CAMPAIGNS,
};

// Foto de perfil padrão por brand
export const BRAND_DEFAULT_PHOTO: Record<string, string> = {
  brahma:      "/ads/2.png",
  globo:       "/ads/1.png",
  sicoob:      "/ads/3.png",
  volkswagen:  "/ads/4.png",
  ballantines: "/ads/5.png",
};

// Detecta brand pelo userName (vindo do JWT)
export function detectBrand(userName: string | null): string {
  if (!userName) return "";
  const lower = userName.toLowerCase();
  if (lower.includes("brahma"))                           return "brahma";
  if (lower.includes("sicoob"))                          return "sicoob";
  if (lower.includes("volkswagen") || lower.includes("vw")) return "volkswagen";
  if (lower.includes("ballantine"))                      return "ballantines";
  if (lower.includes("globo"))                           return "globo";
  return "";
}

// ─── Performance (mesma data para todos os IDs mockados) ─────────────────────

function mapPerf(idBase: number): Record<number, PerformanceDay[]> {
  return {
    [idBase + 0]: PERF_FINISHED_10D,
    [idBase + 1]: PERF_FINISHED_7D,
    [idBase + 2]: PERF_FINISHED_CPV,
    [idBase + 3]: [],
    [idBase + 4]: PERF_ACTIVE,
  };
}

export const MOCK_PERFORMANCE: Record<number, PerformanceDay[]> = {
  ...mapPerf(9001),
  ...mapPerf(9011),
  ...mapPerf(9021),
  ...mapPerf(9031),
  ...mapPerf(9041),
};
