export interface WonCoupon {
  brand: string;
  name: string;
  image: string;
  color: string;
  benefit: string;
  code: string;
  wonAt: string; // ISO string
}

const STORAGE_KEY = "roulette-coupon-history";

const COUPON_MAP: Record<string, Omit<WonCoupon, "wonAt">> = {
  brahma:      { brand: "brahma",      name: "Brahma",      image: "/ads/2.png", color: "#f59e0b", benefit: "1 Brahma gelada grátis no estande",    code: "BRAHMA2026" },
  sicoob:      { brand: "sicoob",      name: "Sicoob",      image: "/ads/3.png", color: "#10b981", benefit: "Isenção de anuidade no 1º ano",        code: "SICOOB2026" },
  volkswagen:  { brand: "volkswagen",  name: "Volkswagen",  image: "/ads/4.png", color: "#6366f1", benefit: "Test drive agendado + brinde especial", code: "VW2026"     },
  ballantines: { brand: "ballantines", name: "Ballantines", image: "/ads/5.png", color: "#ec4899", benefit: "Dose exclusiva no estande Ballantines", code: "BALL2026"   },
  globo:       { brand: "globo",       name: "Globo",       image: "/ads/1.png", color: "#3b82f6", benefit: "1 mês grátis de Globoplay Premium",    code: "GLOBO2026"  },
};

export function prizeToBrand(prizeName: string): string | null {
  const lower = prizeName.trim().toLowerCase();
  for (const key of Object.keys(COUPON_MAP)) {
    if (lower.includes(key)) return key;
  }
  if (lower.includes("volks") || lower.includes("vw")) return "volkswagen";
  return null;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadHistory(): Record<string, WonCoupon[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveWonCoupon(prizeName: string): void {
  const brand = prizeToBrand(prizeName);
  if (!brand) return;
  const history = loadHistory();
  const key = todayKey();
  const existing = history[key] ?? [];
  if (existing.some((c) => c.brand === brand)) return;
  const coupon: WonCoupon = { ...COUPON_MAP[brand], wonAt: new Date().toISOString() };
  history[key] = [...existing, coupon];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getTodayWonCoupons(): WonCoupon[] {
  return loadHistory()[todayKey()] ?? [];
}

export function todayDateKey(): string {
  return todayKey();
}
