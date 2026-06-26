"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Box, CircularProgress, Typography, Paper, Chip, IconButton,
  Button, Divider, TextField, Slider, ToggleButtonGroup,
  ToggleButton, Step, StepLabel, Stepper, Avatar, LinearProgress,
  List, ListItem, ListItemButton, ListItemText, InputAdornment,
} from "@mui/material";
import {
  ArrowBack as BackIcon, TouchApp as ClickIcon, Visibility as ViewIcon,
  Male as MaleIcon, Female as FemaleIcon, People as PeopleIcon, Person as PersonIcon,
  LocationOn as LocationIcon, CloudUpload as UploadIcon, Link as LinkIcon,
  Close as CloseIcon, Add as AddIcon, Image as ImageIcon,
  Public as BrasilIcon, Map as MapIcon, LocationCity as CityIcon,
  Search as SearchIcon, CalendarToday as CalendarIcon,
  HomeWork as BairroIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";
import Image from "next/image";
import { uploadCreative, type CampaignPayload } from "@/app/services/campaigns/campaignService";
import { getPlataformaConfig } from "@/app/services/configuracoes/configuracaoService";
import { useToast } from "@/app/context/ToastContext";

// Leaflet map — carregado apenas no cliente
const LocationMap = dynamic(() => import("@/app/components/common/LocationMap"), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 320, borderRadius: "12px", backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress size={28} sx={{ color: "#ffcc01" }} />
    </Box>
  ),
});

// ─── Constantes ───────────────────────────────────────────────────────────────

const STEPS = ["Objetivo", "Criativo", "Público-alvo", "Localização", "Veiculação", "Orçamento"];

const HOBBY_SUGGESTIONS = [
  "Sertanejo","Rodeio","Agronegócio","Música ao vivo","Festas","Gastronomia",
  "Esportes","Camping","Turismo rural","Família","Moda country","Pesca",
  "Culinária","Bebidas & Bares","Dança","Fotografia","Viagens","Artesanato","Equitação","Vida no campo",
];
const PROFESSION_SUGGESTIONS = [
  "Agricultor / Fazendeiro","Pecuarista","Empresário","Comerciante","Estudante",
  "Professor / Educador","Saúde / Medicina","Engenheiro","Advogado / Jurídico",
  "Contador / Finanças","Servidor público","Autônomo","Transportador",
  "Construção civil","TI / Tecnologia","Marketing / Comunicação","Artista / Músico","Aposentado",
];

const REGIOES = ["Norte","Nordeste","Centro-Oeste","Sudeste","Sul"];

const ESTADOS_POR_REGIAO: Record<string, { uf: string; nome: string }[]> = {
  Norte: [
    { uf: "AM", nome: "Amazonas" }, { uf: "PA", nome: "Pará" }, { uf: "RR", nome: "Roraima" },
    { uf: "AP", nome: "Amapá" }, { uf: "TO", nome: "Tocantins" }, { uf: "RO", nome: "Rondônia" },
    { uf: "AC", nome: "Acre" },
  ],
  Nordeste: [
    { uf: "BA", nome: "Bahia" }, { uf: "PE", nome: "Pernambuco" }, { uf: "CE", nome: "Ceará" },
    { uf: "MA", nome: "Maranhão" }, { uf: "PI", nome: "Piauí" }, { uf: "RN", nome: "Rio Grande do Norte" },
    { uf: "PB", nome: "Paraíba" }, { uf: "AL", nome: "Alagoas" }, { uf: "SE", nome: "Sergipe" },
  ],
  "Centro-Oeste": [
    { uf: "GO", nome: "Goiás" }, { uf: "MT", nome: "Mato Grosso" },
    { uf: "MS", nome: "Mato Grosso do Sul" }, { uf: "DF", nome: "Distrito Federal" },
  ],
  Sudeste: [
    { uf: "SP", nome: "São Paulo" }, { uf: "RJ", nome: "Rio de Janeiro" },
    { uf: "MG", nome: "Minas Gerais" }, { uf: "ES", nome: "Espírito Santo" },
  ],
  Sul: [
    { uf: "PR", nome: "Paraná" }, { uf: "SC", nome: "Santa Catarina" }, { uf: "RS", nome: "Rio Grande do Sul" },
  ],
};

const TODOS_ESTADOS = Object.values(ESTADOS_POR_REGIAO).flat();

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Gender = "todos" | "feminino" | "masculino" | "nao_binario";
type LocationMode = "brasil" | "regioes" | "estados" | "cidades" | "bairros";

interface CityRadius { city: string; radius: number; lat?: number; lng?: number; maxRadius?: number; }
interface BairroEntry { bairro: string; cidade: string; radius: number; lat?: number; lng?: number; }

interface AdDraft {
  campaign_name: string; ad_type: "CPC" | "CPV";
  creative_url: string; creative_name: string; redirect_url: string;
  gender: Gender; age_min: number; age_max: number;
  hobbies: string[]; professions: string[];
  location_mode: LocationMode;
  location_regioes: string[];
  location_estados: string[];
  location_cidades: CityRadius[];
  location_bairros: BairroEntry[];
  start_at: string; duration_days: string;
  budget_amount: string; budget_type: "diario" | "total";
}

const emptyDraft = (): AdDraft => ({
  campaign_name: "", ad_type: "CPC",
  creative_url: "", creative_name: "", redirect_url: "",
  gender: "todos", age_min: 18, age_max: 65,
  hobbies: [], professions: [],
  location_mode: "cidades", location_regioes: [], location_estados: [],
  location_cidades: [{ city: "São Paulo, São Paulo", radius: 30, maxRadius: 80, lat: -23.5505, lng: -46.6333 }],
  location_bairros: [],
  start_at: "", duration_days: "",
  budget_amount: "", budget_type: "total",
});

// ─── Preço ────────────────────────────────────────────────────────────────────

function calcSurcharges(draft: AdDraft, cpcPrice = 0.14, cpvPrice = 0.10) {
  const rate = draft.ad_type === "CPC" ? cpcPrice : cpvPrice;
  const _hobbies     = draft.hobbies ?? [];
  const _professions = draft.professions ?? [];
  const _cidades     = draft.location_cidades ?? [];
  const _bairros     = draft.location_bairros ?? [];
  const _mode        = draft.location_mode ?? "brasil";

  // +1% por hobbie, +1% por profissão, +2% por cidade, +3% por bairro, +0.2% por km de raio acima de 20km
  const hobbySurcharge      = _hobbies.length;
  const professionSurcharge = _professions.length;
  const cidadesSurcharge    = _mode === "cidades" ? _cidades.length * 2 : 0;
  const bairrosSurcharge    = _mode === "bairros" ? _bairros.length * 3 : 0;
  const avgRadius = _mode === "cidades" && _cidades.length > 0
    ? _cidades.reduce((s, c) => s + c.radius, 0) / _cidades.length
    : _mode === "bairros" && _bairros.length > 0
    ? _bairros.reduce((s, b) => s + b.radius, 0) / _bairros.length : 0;
  const radiusSurcharge = parseFloat((Math.max(0, avgRadius - 5) * 0.2).toFixed(2));

  const totalSurchargePercent = hobbySurcharge + professionSurcharge + cidadesSurcharge + bairrosSurcharge + radiusSurcharge;
  const effectiveRate = rate * (1 + totalSurchargePercent / 100);
  return { rate, hobbySurcharge, professionSurcharge, cidadesSurcharge, bairrosSurcharge, radiusSurcharge, totalSurchargePercent, effectiveRate };
}

function locationSummary(draft: AdDraft): string {
  const _mode = draft.location_mode ?? "brasil";
  const _regioes = draft.location_regioes ?? [];
  const _estados = draft.location_estados ?? [];
  const _cidades2 = draft.location_cidades ?? [];
  const _bairros = draft.location_bairros ?? [];
  if (_mode === "brasil") return "Todo o Brasil";
  if (_mode === "regioes") return _regioes.length > 0 ? `Regiões: ${_regioes.join(", ")}` : "Nenhuma região selecionada";
  if (_mode === "estados") return _estados.length > 0 ? `${_estados.length} estado${_estados.length > 1 ? "s" : ""}` : "Nenhum estado selecionado";
  if (_mode === "cidades") return _cidades2.length > 0 ? `${_cidades2.length} cidade${_cidades2.length > 1 ? "s" : ""}` : "Nenhuma cidade adicionada";
  if (_mode === "bairros") return _bairros.length > 0 ? `${_bairros.length} bairro${_bairros.length > 1 ? "s" : ""}` : "Nenhum bairro adicionado";
  return "";
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", borderRadius: "12px",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.32)" },
    "&.Mui-focused fieldset": { borderColor: "#ffcc01" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.45)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#ffcc01" },
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", mb: 1.2 }}>
      {children}
    </Typography>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ label, values, suggestions, color = "#ffcc01", onChange }: {
  label: string; values: string[]; suggestions: string[]; color?: string;
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const add = useCallback((tag: string) => {
    const t = tag.trim();
    if (!t || values.includes(t)) return;
    onChange([...values, t]);
    setInput("");
  }, [values, onChange]);
  const remove = (tag: string) => onChange(values.filter((v) => v !== tag));

  return (
    <Box>
      <Label>{label}</Label>
      {values.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 1.5 }}>
          {values.map((v) => (
            <Chip key={v} label={v} onDelete={() => remove(v)}
              deleteIcon={<CloseIcon sx={{ fontSize: "14px !important" }} />} size="small"
              sx={{ backgroundColor: `${color}18`, border: `1px solid ${color}55`, color, fontWeight: 600, fontSize: "0.78rem", "& .MuiChip-deleteIcon": { color: `${color}88`, "&:hover": { color } } }}
            />
          ))}
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
        <TextField
          placeholder="Digite e pressione Enter para adicionar..."
          value={input} onChange={(e) => setInput(e.target.value)} size="small" fullWidth
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } if (e.key === "Backspace" && !input && values.length) remove(values[values.length - 1]); }}
          sx={{ ...fieldSx, "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], borderRadius: "10px" } }}
        />
        <Button onClick={() => add(input)} disabled={!input.trim()} variant="outlined"
          sx={{ minWidth: 44, height: 40, p: 0, borderRadius: "10px", borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", "&:hover": { borderColor: color, color }, "&.Mui-disabled": { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.2)" } }}>
          <AddIcon fontSize="small" />
        </Button>
      </Box>
      {suggestions.filter((s) => !values.includes(s)).length > 0 && (
        <Box>
          <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.68rem", mb: 0.8 }}>Sugestões</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
            {suggestions.filter((s) => !values.includes(s)).map((s) => (
              <Chip key={s} label={s} onClick={() => add(s)} size="small"
                sx={{ cursor: "pointer", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", transition: "all 0.15s ease", "&:hover": { backgroundColor: `${color}12`, borderColor: `${color}44`, color } }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────

function Step1({ draft, set, cpcPrice = 0.14, cpvPrice = 0.10 }: { draft: AdDraft; set: (k: keyof AdDraft, v: unknown) => void; cpcPrice?: number; cpvPrice?: number }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Label>Nome da campanha</Label>
        <TextField placeholder="Ex: Volkswagen T-Cross — Lançamento 2026" value={draft.campaign_name}
          onChange={(e) => set("campaign_name", e.target.value)} fullWidth sx={fieldSx} inputProps={{ maxLength: 120 }} />
        <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", mt: 0.6 }}>
          Um nome claro ajuda a identificar sua campanha nos relatórios
        </Typography>
      </Box>
      <Box>
        <Label>Tipo de cobrança</Label>
        <Box sx={{ display: "flex", gap: 2 }}>
          {([
            { value: "CPC" as const, label: "CPC — Custo por Clique", sub: "Você paga apenas quando o usuário clica no anúncio", price: `R$ ${cpcPrice} por clique`, color: "#4f46e5", Icon: ClickIcon },
            { value: "CPV" as const, label: "CPV — Custo por View",   sub: "Você paga a cada vez que o anúncio é visualizado",    price: `R$ ${cpvPrice} por view`,   color: "#10b981", Icon: ViewIcon  },
          ]).map((opt) => {
            const active = draft.ad_type === opt.value;
            return (
              <Box key={opt.value} onClick={() => set("ad_type", opt.value)}
                sx={{ flex: 1, cursor: "pointer", borderRadius: 3, border: `2px solid ${active ? opt.color : "rgba(255,255,255,0.1)"}`, backgroundColor: active ? `${opt.color}15` : "rgba(255,255,255,0.02)", p: 3, transition: "all 0.2s ease", "&:hover": { borderColor: active ? opt.color : "rgba(255,255,255,0.22)" } }}>
                <opt.Icon sx={{ fontSize: 30, color: active ? opt.color : "rgba(255,255,255,0.3)", mb: 1.5 }} />
                <Typography sx={{ color: active ? "#fff" : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "0.95rem", mb: 0.5 }}>{opt.label}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: "0.78rem", lineHeight: 1.5, mb: 2 }}>{opt.sub}</Typography>
                <Box sx={{ display: "inline-block", px: 1.5, py: 0.4, borderRadius: "6px", backgroundColor: active ? `${opt.color}25` : "rgba(255,255,255,0.06)", border: `1px solid ${active ? opt.color + "55" : "rgba(255,255,255,0.12)"}` }}>
                  <Typography sx={{ color: active ? opt.color : "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.82rem" }}>{opt.price}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────

function Step2({ draft, set }: { draft: AdDraft; set: (k: keyof AdDraft, v: unknown) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  // preview local (blob URL) — mostrado imediatamente antes do upload terminar
  const [localPreview, setLocalPreview] = useState<string>("");
  const [isVideoFile, setIsVideoFile] = useState(false);
  const { showToast } = useToast();

  const handleFile = async (file: File) => {
    setUploadError("");
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/quicktime"];
    if (!allowed.includes(file.type)) { setUploadError("Formato não suportado. Use JPG, PNG, GIF, WEBP ou MP4."); return; }
    if (file.size > 20 * 1024 * 1024) { setUploadError("Arquivo muito grande. Máximo 20 MB."); return; }

    // Mostra preview local instantaneamente
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);
    setIsVideoFile(file.type.startsWith("video/"));
    if (!draft.creative_name) set("creative_name", file.name.replace(/\.[^/.]+$/, ""));

    setUploading(true);
    try {
      const url = await uploadCreative(file);
      set("creative_url", url);
      showToast("Upload concluído!", "success");
    } catch (err: unknown) {
      // mantém o preview local mesmo em caso de erro no S3
      setUploadError(err instanceof Error ? err.message : "Erro no upload");
    } finally { setUploading(false); }
  };

  const clearMedia = () => {
    set("creative_url", "");
    if (localPreview) { URL.revokeObjectURL(localPreview); setLocalPreview(""); }
    setIsVideoFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Preview a exibir: preferência para o blob local (imediato), fallback para URL do servidor
  const previewSrc = localPreview || draft.creative_url;
  const hasMedia = Boolean(previewSrc);
  const isVideo = isVideoFile || draft.creative_url.includes(".mp4") || draft.creative_url.includes(".mov");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      <Box>
        <Label>Material do anúncio</Label>
        {!hasMedia ? (
          <Box
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            sx={{ border: `2px dashed ${dragOver ? "#ffcc01" : uploadError ? "#ef4444" : "rgba(255,255,255,0.18)"}`, borderRadius: 3, p: { xs: 4, sm: 6 }, textAlign: "center", cursor: uploading ? "wait" : "pointer", backgroundColor: dragOver ? "rgba(255,204,1,0.05)" : "rgba(255,255,255,0.02)", transition: "all 0.2s ease", "&:hover": { borderColor: uploading ? undefined : "#ffcc01", backgroundColor: "rgba(255,204,1,0.04)" } }}>
            <Box>
              <UploadIcon sx={{ fontSize: 44, color: "rgba(255,255,255,0.2)", mb: 1.5 }} />
              <Typography sx={{ color: "#fff", fontWeight: 600, mb: 0.5 }}>Arraste o arquivo aqui ou clique para selecionar</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>JPG, PNG, GIF, WEBP ou MP4 · Máx. 20 MB</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ position: "relative", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.4)" }}>
            {isVideo
              ? <video src={previewSrc} controls style={{ width: "100%", maxHeight: 240, display: "block" }} />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={previewSrc} alt="preview" style={{ width: "100%", maxHeight: 240, objectFit: "contain", display: "block" }} />}
            {/* Overlay de progresso durante upload */}
            {uploading && (
              <Box sx={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                <CircularProgress size={32} sx={{ color: "#ffcc01" }} />
                <Typography sx={{ color: "#fff", fontSize: "0.82rem" }}>Enviando para o servidor...</Typography>
                <LinearProgress sx={{ width: "60%", borderRadius: 1, backgroundColor: "rgba(255,255,255,0.15)", "& .MuiLinearProgress-bar": { backgroundColor: "#ffcc01" } }} />
              </Box>
            )}
            <Box sx={{ position: "absolute", top: 8, right: 8 }}>
              <IconButton size="small" onClick={clearMedia} disabled={uploading}
                sx={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", "&:hover": { backgroundColor: "rgba(0,0,0,0.85)" }, "&.Mui-disabled": { opacity: 0.4 } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
        {uploadError && <Typography sx={{ color: "#ef4444", fontSize: "0.78rem", mt: 0.8 }}>{uploadError}</Typography>}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
          style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.25)", fontSize: "0.72rem", mb: 1 }}>— ou cole a URL diretamente —</Typography>
          <TextField placeholder="https://cdn.exemplo.com/banner.jpg" value={draft.creative_url}
            onChange={(e) => { set("creative_url", e.target.value); setLocalPreview(""); }} fullWidth size="small"
            sx={{ ...fieldSx, "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], borderRadius: "10px" } }}
            InputProps={{ startAdornment: <LinkIcon sx={{ color: "rgba(255,255,255,0.25)", mr: 1, fontSize: 18 }} /> }}
          />
        </Box>
      </Box>
      <TextField label="Nome / título do criativo" placeholder="Ex: Banner Verão Volkswagen" value={draft.creative_name}
        onChange={(e) => set("creative_name", e.target.value)} fullWidth sx={fieldSx}
        InputProps={{ startAdornment: <ImageIcon sx={{ color: "rgba(255,255,255,0.25)", mr: 1, fontSize: 20 }} /> }} />
      <TextField label="URL de destino (onde o usuário vai ao clicar)" placeholder="https://www.volkswagen.com.br" value={draft.redirect_url}
        onChange={(e) => set("redirect_url", e.target.value)} fullWidth sx={fieldSx}
        InputProps={{ startAdornment: <LinkIcon sx={{ color: "rgba(255,255,255,0.25)", mr: 1, fontSize: 20 }} /> }} />
      <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2, p: 2 }}>
        <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
          Todos os campos são opcionais — você pode completar o criativo depois de criar a campanha.
        </Typography>
      </Paper>
    </Box>
  );
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────────

function Step3({ draft, set }: { draft: AdDraft; set: (k: keyof AdDraft, v: unknown) => void }) {
  const genders: { value: Gender; label: string; Icon: React.ElementType }[] = [
    { value: "todos",       label: "Todos",       Icon: PeopleIcon },
    { value: "feminino",    label: "Feminino",    Icon: FemaleIcon },
    { value: "masculino",   label: "Masculino",   Icon: MaleIcon   },
    { value: "nao_binario", label: "Não-binário", Icon: PersonIcon },
  ];
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Label>Gênero</Label>
        <ToggleButtonGroup exclusive value={draft.gender} onChange={(_, v) => v && set("gender", v)}
          sx={{ display: "flex", gap: 1, "& .MuiToggleButtonGroup-grouped": { border: "none !important", borderRadius: "10px !important", mr: 0 } }}>
          {genders.map(({ value, label, Icon }) => (
            <ToggleButton key={value} value={value}
              sx={{ flex: 1, color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.12) !important", borderRadius: "10px !important", textTransform: "none", py: 1.2, fontSize: "0.83rem", gap: 0.8, fontWeight: 500, "&.Mui-selected": { backgroundColor: "rgba(255,204,1,0.12)", borderColor: "rgba(255,204,1,0.45) !important", color: "#ffcc01", fontWeight: 700 }, "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" } }}>
              <Icon sx={{ fontSize: 18 }} /> {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box>
        <Label>Faixa etária</Label>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField label="Idade mínima" type="number" value={draft.age_min}
            onChange={(e) => set("age_min", Math.max(13, Math.min(parseInt(e.target.value) || 13, draft.age_max - 1)))}
            fullWidth inputProps={{ min: 13, max: 79 }} sx={fieldSx} />
          <TextField label="Idade máxima" type="number" value={draft.age_max}
            onChange={(e) => set("age_max", Math.min(80, Math.max(parseInt(e.target.value) || 18, draft.age_min + 1)))}
            fullWidth inputProps={{ min: 14, max: 80 }} sx={fieldSx} />
        </Box>
        <Typography sx={{ color: "rgba(255,255,255,0.28)", fontSize: "0.72rem", mt: 0.6 }}>
          Público de {draft.age_min} a {draft.age_max >= 80 ? "65+" : draft.age_max} anos
        </Typography>
      </Box>
      <TagInput label="Interesses" values={draft.hobbies} suggestions={HOBBY_SUGGESTIONS} color="#ffcc01" onChange={(v) => set("hobbies", v)} />
      {draft.hobbies.length > 3 && <Typography sx={{ color: "#f59e0b", fontSize: "0.75rem", mt: -3 }}>Mais de 3 interesses: +{draft.hobbies.length - 3}% no custo</Typography>}
      <TagInput label="Profissões" values={draft.professions} suggestions={PROFESSION_SUGGESTIONS} color="#a5b4fc" onChange={(v) => set("professions", v)} />
      {draft.professions.length > 3 && <Typography sx={{ color: "#f59e0b", fontSize: "0.75rem", mt: -3 }}>Mais de 3 profissões: +{draft.professions.length - 3}% no custo</Typography>}
    </Box>
  );
}

// ─── STEP 4 — Localização ─────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number; display_name: string; lat: string; lon: string;
  type: string; class: string;
  boundingbox?: [string, string, string, string]; // [s_lat, n_lat, w_lon, e_lon]
  address: { city?: string; town?: string; village?: string; municipality?: string; state?: string; country?: string; suburb?: string; neighbourhood?: string; quarter?: string; };
}

function calcCityMaxRadius(result: NominatimResult): number {
  if (!result.boundingbox) return 500;
  const [s, n, w, e] = result.boundingbox.map(parseFloat);
  const heightKm = (n - s) * 111.32;
  const centerLat = (n + s) / 2;
  const widthKm  = (e - w) * 111.32 * Math.cos((centerLat * Math.PI) / 180);
  const cityRadius = Math.max(heightKm, widthKm) / 2;
  // Limita ao dobro do tamanho geográfico da cidade, mínimo 20 km, máximo 500 km
  return Math.min(500, Math.max(20, Math.ceil(cityRadius * 2)));
}

function Step4({ draft, set }: { draft: AdDraft; set: (k: keyof AdDraft, v: unknown) => void }) {
  const [cityInput, setCityInput] = useState("");
  const [cityRadius, setCityRadius] = useState(30);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bairro state
  const [bairroInput, setBairroInput] = useState("");
  const [bairroRadius, setBairroRadius] = useState(5);
  const [bairroSuggestions, setBairroSuggestions] = useState<NominatimResult[]>([]);
  const [bairroSearching, setBairroSearching] = useState(false);
  const [showBairroDropdown, setShowBairroDropdown] = useState(false);
  const bairroInputRef = useRef<HTMLInputElement>(null);

  // Defensive defaults
  const location_regioes: string[]       = draft.location_regioes  ?? [];
  const location_estados: string[]       = draft.location_estados  ?? [];
  const location_cidades: CityRadius[]   = draft.location_cidades  ?? [];
  const location_bairros: BairroEntry[]  = draft.location_bairros  ?? [];
  const location_mode: LocationMode      = draft.location_mode     ?? "brasil";

  // Nominatim autocomplete — debounced 350ms
  useEffect(() => {
    if (cityInput.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&countrycodes=br&limit=7&addressdetails=1`,
          { headers: { "Accept-Language": "pt-BR" } }
        );
        const data: NominatimResult[] = await res.json();
        const cities = data.filter((r) => ["city","town","village","municipality","administrative"].includes(r.type));
        setSuggestions(cities.length > 0 ? cities : data.slice(0, 5));
        setShowDropdown(true);
      } catch { /* silently ignore */ }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [cityInput]);

  // Nominatim autocomplete para bairro — debounced 350ms
  useEffect(() => {
    if (bairroInput.length < 2) { setBairroSuggestions([]); setShowBairroDropdown(false); return; }
    const timer = setTimeout(async () => {
      setBairroSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(bairroInput)}&countrycodes=br&limit=8&addressdetails=1`,
          { headers: { "Accept-Language": "pt-BR" } }
        );
        const data: NominatimResult[] = await res.json();
        const bairros = data.filter((r) =>
          r.address.suburb != null || r.address.neighbourhood != null || r.address.quarter != null ||
          ["suburb", "neighbourhood", "quarter", "residential"].includes(r.type)
        );
        // fallback sem cidades/municípios para não poluir
        const fallback = data.filter((r) => !["city", "municipality", "administrative"].includes(r.type));
        setBairroSuggestions(bairros.length > 0 ? bairros : fallback.slice(0, 5));
        setShowBairroDropdown(true);
      } catch { /* silently ignore */ }
      finally { setBairroSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [bairroInput]);

  const formatSuggestion = (r: NominatimResult) => {
    const city = r.address.city ?? r.address.town ?? r.address.village ?? r.address.municipality;
    const state = r.address.state;
    if (city && state) return `${city}, ${state}`;
    // fallback: pega as primeiras 2 partes do display_name
    const parts = r.display_name.split(",");
    return parts.slice(0, 2).join(",").trim();
  };

  const addFromSuggestion = (r: NominatimResult) => {
    const label = formatSuggestion(r);
    if (location_cidades.some((c) => c.city.toLowerCase() === label.toLowerCase())) return;
    const maxRadius = calcCityMaxRadius(r);
    const safeRadius = Math.min(cityRadius, maxRadius); // garante que o raio padrão não ultrapasse o máximo da cidade
    set("location_cidades", [...location_cidades, {
      city: label, radius: safeRadius, maxRadius,
      lat: parseFloat(r.lat), lng: parseFloat(r.lon),
    }]);
    setCityInput("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const addManual = () => {
    const city = cityInput.trim();
    if (!city) return;
    if (location_cidades.some((c) => c.city.toLowerCase() === city.toLowerCase())) return;
    set("location_cidades", [...location_cidades, { city, radius: cityRadius }]);
    setCityInput("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const removeCity = (city: string) => {
    set("location_cidades", location_cidades.filter((c) => c.city !== city));
  };

  const updateCityRadius = (city: string, newRadius: number) => {
    set("location_cidades", location_cidades.map((c) => c.city === city ? { ...c, radius: newRadius } : c));
  };

  const formatBairroSuggestion = (r: NominatimResult) => {
    const bairro = r.address.suburb ?? r.address.neighbourhood ?? r.address.quarter ?? r.display_name.split(",")[0].trim();
    const city = r.address.city ?? r.address.town ?? r.address.village ?? r.address.municipality ?? "";
    return city ? `${bairro}, ${city}` : bairro;
  };

  const addBairroFromSuggestion = (r: NominatimResult) => {
    const bairroName = r.address.suburb ?? r.address.neighbourhood ?? r.address.quarter ?? r.display_name.split(",")[0].trim();
    const cityName = r.address.city ?? r.address.town ?? r.address.village ?? r.address.municipality ?? "";
    if (location_bairros.some((b) => b.bairro.toLowerCase() === bairroName.toLowerCase() && b.cidade.toLowerCase() === cityName.toLowerCase())) return;
    set("location_bairros", [...location_bairros, {
      bairro: bairroName, cidade: cityName, radius: bairroRadius,
      lat: parseFloat(r.lat), lng: parseFloat(r.lon),
    }]);
    setBairroInput("");
    setBairroSuggestions([]);
    setShowBairroDropdown(false);
  };

  const removeBairro = (bairro: string, cidade: string) => {
    set("location_bairros", location_bairros.filter((b) => !(b.bairro === bairro && b.cidade === cidade)));
  };

  const updateBairroRadius = (bairro: string, cidade: string, newRadius: number) => {
    set("location_bairros", location_bairros.map((b) => b.bairro === bairro && b.cidade === cidade ? { ...b, radius: newRadius } : b));
  };

  const toggleRegiao = (r: string) => {
    set("location_regioes", location_regioes.includes(r) ? location_regioes.filter((x) => x !== r) : [...location_regioes, r]);
  };

  const toggleEstado = (uf: string) => {
    set("location_estados", location_estados.includes(uf) ? location_estados.filter((x) => x !== uf) : [...location_estados, uf]);
  };

  const selectAllEstadosByRegiao = (regiao: string) => {
    const ufs = ESTADOS_POR_REGIAO[regiao].map((e) => e.uf);
    const allSelected = ufs.every((uf) => location_estados.includes(uf));
    set("location_estados", allSelected
      ? location_estados.filter((uf) => !ufs.includes(uf))
      : Array.from(new Set([...location_estados, ...ufs])));
  };

  const modes: { value: LocationMode; label: string; desc: string; Icon: React.ElementType }[] = [
    { value: "brasil",  label: "Todo o Brasil",  desc: "Alcance nacional sem restrições",                  Icon: BrasilIcon  },
    { value: "regioes", label: "Por Região",      desc: "Selecione uma ou mais regiões do país",            Icon: MapIcon     },
    { value: "estados", label: "Por Estado",      desc: "Selecione estados específicos",                    Icon: LocationIcon},
    { value: "cidades", label: "Por Cidade",      desc: "Adicione cidades com raio de cobertura próprio",   Icon: CityIcon    },
    { value: "bairros", label: "Por Bairro",      desc: "Segmente por bairros de cidades específicas",      Icon: BairroIcon  },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Seletor de modo */}
      <Box>
        <Label>Como deseja segmentar o alcance?</Label>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          {modes.map(({ value, label, desc, Icon }) => {
            const active = location_mode === value;
            return (
              <Box key={value} onClick={() => set("location_mode", value)}
                sx={{ cursor: "pointer", borderRadius: 2.5, border: `2px solid ${active ? "#ffcc01" : "rgba(255,255,255,0.1)"}`, backgroundColor: active ? "rgba(255,204,1,0.07)" : "rgba(255,255,255,0.02)", p: 2, transition: "all 0.2s ease", display: "flex", alignItems: "flex-start", gap: 1.5, "&:hover": { borderColor: active ? "#ffcc01" : "rgba(255,255,255,0.22)" } }}>
                <Icon sx={{ fontSize: 22, color: active ? "#ffcc01" : "rgba(255,255,255,0.35)", mt: 0.2, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ color: active ? "#ffcc01" : "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "0.85rem", mb: 0.2 }}>{label}</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", lineHeight: 1.4 }}>{desc}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Por Região */}
      {location_mode === "regioes" && (
        <Box>
          <Label>Selecione as regiões</Label>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 1 }}>
            {REGIOES.map((r) => {
              const on = location_regioes.includes(r);
              return (
                <Box key={r} onClick={() => toggleRegiao(r)}
                  sx={{ cursor: "pointer", borderRadius: 2, border: `2px solid ${on ? "#ffcc01" : "rgba(255,255,255,0.12)"}`, backgroundColor: on ? "rgba(255,204,1,0.1)" : "rgba(255,255,255,0.03)", px: 2.5, py: 1.5, transition: "all 0.2s ease", minWidth: 120, textAlign: "center", "&:hover": { borderColor: on ? "#ffcc01" : "rgba(255,255,255,0.28)" } }}>
                  <Typography sx={{ color: on ? "#ffcc01" : "rgba(255,255,255,0.65)", fontWeight: on ? 700 : 400, fontSize: "0.9rem" }}>{r}</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", mt: 0.3 }}>{ESTADOS_POR_REGIAO[r].length} estados</Typography>
                </Box>
              );
            })}
          </Box>
          {location_regioes.length > 0 && (
            <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", mb: 1 }}>
              Cobrindo: {location_regioes.flatMap((r) => ESTADOS_POR_REGIAO[r].map((e) => e.uf)).join(", ")}
            </Typography>
          )}
        </Box>
      )}

      {/* Por Estado */}
      {location_mode === "estados" && (
        <Box>
          {Object.entries(ESTADOS_POR_REGIAO).map(([regiao, estados]) => {
            const allOn = estados.every((e) => location_estados.includes(e.uf));
            return (
              <Box key={regiao} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{regiao}</Typography>
                  <Chip label={allOn ? "Desmarcar" : "Todos"} size="small" onClick={() => selectAllEstadosByRegiao(regiao)}
                    sx={{ cursor: "pointer", height: 18, fontSize: "0.62rem", backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)", "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" } }} />
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                  {estados.map(({ uf, nome }) => {
                    const on = location_estados.includes(uf);
                    return (
                      <Chip key={uf} label={uf} onClick={() => toggleEstado(uf)} size="small" title={nome}
                        sx={{ cursor: "pointer", backgroundColor: on ? "rgba(255,204,1,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${on ? "rgba(255,204,1,0.5)" : "rgba(255,255,255,0.12)"}`, color: on ? "#ffcc01" : "rgba(255,255,255,0.55)", fontWeight: on ? 700 : 400, transition: "all 0.15s ease", "&:hover": { backgroundColor: on ? "rgba(255,204,1,0.22)" : "rgba(255,255,255,0.1)" } }}
                      />
                    );
                  })}
                </Box>
              </Box>
            );
          })}
          {location_estados.length > 0 && (
            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,204,1,0.06)", border: "1px solid rgba(255,204,1,0.18)", borderRadius: 2, p: 1.5, mb: 1 }}>
              <Typography sx={{ color: "#ffcc01", fontWeight: 600, fontSize: "0.82rem" }}>
                {location_estados.length} estado{location_estados.length > 1 ? "s" : ""}: {location_estados.join(", ")}
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Por Cidade — autocomplete + raio */}
      {location_mode === "cidades" && (
        <Box>
          <Label>Buscar cidade</Label>

          {/* Raio padrão para nova cidade */}
          <Box sx={{ px: 0.5, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>Raio padrão para a próxima cidade</Typography>
              <Typography sx={{ color: cityRadius > 18 ? "#f59e0b" : "#fff", fontWeight: 700 }}>
                {cityRadius} km
                {cityRadius > 18 && <Typography component="span" sx={{ color: "#f59e0b", fontSize: "0.7rem", ml: 0.5 }}>+{((cityRadius - 18) * 0.3).toFixed(1)}%</Typography>}
              </Typography>
            </Box>
            <Slider value={cityRadius} onChange={(_, v) => setCityRadius(v as number)} min={1} max={500} step={5}
              sx={{ color: cityRadius > 18 ? "#f59e0b" : "#ffcc01", "& .MuiSlider-thumb": { width: 18, height: 18 }, "& .MuiSlider-rail": { backgroundColor: "rgba(255,255,255,0.12)" } }}
            />
          </Box>

          {/* Campo de busca com dropdown */}
          <Box sx={{ position: "relative", mb: 2, zIndex: 1000 }}>
            <TextField
              inputRef={inputRef}
              placeholder="Digite o nome da cidade..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setShowDropdown(false); } if (e.key === "Enter" && suggestions.length === 0) { e.preventDefault(); addManual(); } }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              size="small" fullWidth autoComplete="off"
              sx={{ ...fieldSx, "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], borderRadius: "10px" } }}
              InputProps={{
                startAdornment: searching
                  ? <CircularProgress size={16} sx={{ color: "#ffcc01", mr: 1 }} />
                  : <SearchIcon sx={{ color: "rgba(255,255,255,0.25)", mr: 1, fontSize: 18 }} />,
              }}
            />
            {showDropdown && suggestions.length > 0 && (
              <Paper elevation={8} sx={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1001, backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", overflow: "hidden" }}>
                <List dense disablePadding>
                  {suggestions.map((r) => (
                    <ListItem key={r.place_id} disablePadding>
                      <ListItemButton
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addFromSuggestion(r)}
                        sx={{ px: 2, py: 1, "&:hover": { backgroundColor: "rgba(255,204,1,0.08)" } }}>
                        <LocationIcon sx={{ fontSize: 16, color: "#ffcc01", mr: 1.5, flexShrink: 0 }} />
                        <ListItemText
                          primary={formatSuggestion(r)}
                          secondary={r.display_name.split(",").slice(0, 3).join(",")}
                          primaryTypographyProps={{ sx: { color: "#fff", fontSize: "0.88rem", fontWeight: 500 } }}
                          secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }}
                        />
                        <Chip label={`${cityRadius}km`} size="small" sx={{ ml: 1, flexShrink: 0, backgroundColor: "rgba(255,204,1,0.12)", border: "1px solid rgba(255,204,1,0.3)", color: "#ffcc01", fontSize: "0.7rem" }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* Cidades adicionadas — cada uma com seu raio */}
          {location_cidades.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {location_cidades.map(({ city, radius, lat, maxRadius: cityMax }) => {
                const sliderMax = cityMax ?? 500;
                const clampedRadius = Math.min(radius, sliderMax);
                return (
                <Paper key={city} elevation={0} sx={{ px: 2, pt: 1.5, pb: 1.8, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {/* Linha do nome */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CityIcon sx={{ fontSize: 16, color: "#ffcc01" }} />
                      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>{city}</Typography>
                      {!lat && (
                        <Chip label="sem mapa" size="small" sx={{ fontSize: "0.6rem", height: 16, backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }} />
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`${clampedRadius} km`} size="small"
                        sx={{ backgroundColor: clampedRadius > 18 ? "rgba(245,158,11,0.15)" : "rgba(255,204,1,0.12)", border: `1px solid ${clampedRadius > 18 ? "rgba(245,158,11,0.4)" : "rgba(255,204,1,0.3)"}`, color: clampedRadius > 18 ? "#f59e0b" : "#ffcc01", fontWeight: 700, fontSize: "0.75rem" }}
                      />
                      <IconButton size="small" onClick={() => removeCity(city)} sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#ef4444" } }}>
                        <CloseIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Slider de raio individual com máximo baseado no tamanho geográfico da cidade */}
                  <Box sx={{ px: 0.5 }}>
                    <Slider
                      value={clampedRadius}
                      onChange={(_, v) => updateCityRadius(city, v as number)}
                      min={1} max={sliderMax} step={sliderMax <= 50 ? 1 : 5}
                      sx={{
                        color: clampedRadius > 18 ? "#f59e0b" : "#ffcc01", py: 0.8,
                        "& .MuiSlider-thumb": { width: 16, height: 16 },
                        "& .MuiSlider-rail": { backgroundColor: "rgba(255,255,255,0.1)" },
                      }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: -0.5 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.62rem" }}>1 km</Typography>
                      {clampedRadius > 18 && (
                        <Typography sx={{ color: "#f59e0b", fontSize: "0.62rem" }}>
                          +{((clampedRadius - 18) * 0.3).toFixed(1)}% sobretaxa
                        </Typography>
                      )}
                      <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.62rem" }}>{sliderMax} km</Typography>
                    </Box>
                  </Box>
                </Paper>
                );
              })}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 3, border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 2, mb: 1 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>Nenhuma cidade adicionada ainda</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Por Bairro — autocomplete + raio */}
      {location_mode === "bairros" && (
        <Box>
          <Label>Buscar bairro</Label>

          {/* Raio padrão para novo bairro */}
          <Box sx={{ px: 0.5, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>Raio padrão para o próximo bairro</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 700 }}>{bairroRadius} km</Typography>
            </Box>
            <Slider value={bairroRadius} onChange={(_, v) => setBairroRadius(v as number)} min={1} max={30} step={1}
              sx={{ color: "#ffcc01", "& .MuiSlider-thumb": { width: 18, height: 18 }, "& .MuiSlider-rail": { backgroundColor: "rgba(255,255,255,0.12)" } }}
            />
          </Box>

          {/* Campo de busca com dropdown */}
          <Box sx={{ position: "relative", mb: 2, zIndex: 1000 }}>
            <TextField
              inputRef={bairroInputRef}
              placeholder="Digite o nome do bairro..."
              value={bairroInput}
              onChange={(e) => setBairroInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setShowBairroDropdown(false); } }}
              onBlur={() => setTimeout(() => setShowBairroDropdown(false), 150)}
              onFocus={() => bairroSuggestions.length > 0 && setShowBairroDropdown(true)}
              size="small" fullWidth autoComplete="off"
              sx={{ ...fieldSx, "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], borderRadius: "10px" } }}
              InputProps={{
                startAdornment: bairroSearching
                  ? <CircularProgress size={16} sx={{ color: "#ffcc01", mr: 1 }} />
                  : <SearchIcon sx={{ color: "rgba(255,255,255,0.25)", mr: 1, fontSize: 18 }} />,
              }}
            />
            {showBairroDropdown && bairroSuggestions.length > 0 && (
              <Paper elevation={8} sx={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1001, backgroundColor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", overflow: "hidden" }}>
                <List dense disablePadding>
                  {bairroSuggestions.map((r) => (
                    <ListItem key={r.place_id} disablePadding>
                      <ListItemButton
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addBairroFromSuggestion(r)}
                        sx={{ px: 2, py: 1, "&:hover": { backgroundColor: "rgba(255,204,1,0.08)" } }}>
                        <BairroIcon sx={{ fontSize: 16, color: "#ffcc01", mr: 1.5, flexShrink: 0 }} />
                        <ListItemText
                          primary={formatBairroSuggestion(r)}
                          secondary={r.display_name.split(",").slice(0, 3).join(",")}
                          primaryTypographyProps={{ sx: { color: "#fff", fontSize: "0.88rem", fontWeight: 500 } }}
                          secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }}
                        />
                        <Chip label={`${bairroRadius}km`} size="small" sx={{ ml: 1, flexShrink: 0, backgroundColor: "rgba(255,204,1,0.12)", border: "1px solid rgba(255,204,1,0.3)", color: "#ffcc01", fontSize: "0.7rem" }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* Bairros adicionados */}
          {location_bairros.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {location_bairros.map(({ bairro, cidade, radius }) => (
                <Paper key={`${bairro}-${cidade}`} elevation={0} sx={{ px: 2, pt: 1.5, pb: 1.8, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BairroIcon sx={{ fontSize: 16, color: "#ffcc01" }} />
                      <Box>
                        <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>{bairro}</Typography>
                        {cidade && <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>{cidade}</Typography>}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label={`${radius} km`} size="small"
                        sx={{ backgroundColor: "rgba(255,204,1,0.12)", border: "1px solid rgba(255,204,1,0.3)", color: "#ffcc01", fontWeight: 700, fontSize: "0.75rem" }}
                      />
                      <IconButton size="small" onClick={() => removeBairro(bairro, cidade)} sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#ef4444" } }}>
                        <CloseIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ px: 0.5 }}>
                    <Slider
                      value={radius}
                      onChange={(_, v) => updateBairroRadius(bairro, cidade, v as number)}
                      min={1} max={30} step={1}
                      sx={{ color: "#ffcc01", py: 0.8, "& .MuiSlider-thumb": { width: 16, height: 16 }, "& .MuiSlider-rail": { backgroundColor: "rgba(255,255,255,0.1)" } }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: -0.5 }}>
                      <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.62rem" }}>1 km</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.62rem" }}>30 km</Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 3, border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 2, mb: 1 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>Nenhum bairro adicionado ainda</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Mapa ao vivo — z-index baixo para o dropdown de cidades ficar sempre acima */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Label>Visualização do alcance</Label>
        <LocationMap
          mode={location_mode}
          regioes={location_regioes}
          estados={location_estados}
          cidades={location_cidades}
          bairros={location_bairros}
        />
      </Box>
    </Box>
  );
}

// ─── STEP 5 ───────────────────────────────────────────────────────────────────

function Step5({ draft, set }: { draft: AdDraft; set: (k: keyof AdDraft, v: unknown) => void }) {
  const endDate = (() => {
    if (!draft.start_at || !draft.duration_days) return null;
    const d = new Date(draft.start_at + "T12:00:00");
    d.setDate(d.getDate() + parseInt(draft.duration_days, 10));
    return d.toLocaleDateString("pt-BR");
  })();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Label>Data de início</Label>
        <TextField type="date" value={draft.start_at} onChange={(e) => set("start_at", e.target.value)}
          fullWidth InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split("T")[0] }} sx={fieldSx} />
      </Box>
      <Box>
        <Label>Duração</Label>
        <TextField label="Quantidade de dias" type="number" value={draft.duration_days}
          onChange={(e) => set("duration_days", e.target.value)} fullWidth inputProps={{ min: 1, max: 365 }} sx={{ ...fieldSx, mb: 1.5 }} />
        <Box sx={{ display: "flex", gap: 1 }}>
          {[7, 14, 30, 60, 90].map((d) => (
            <Chip key={d} label={`${d}d`} onClick={() => set("duration_days", String(d))} size="small"
              sx={{ cursor: "pointer", backgroundColor: draft.duration_days === String(d) ? "rgba(255,204,1,0.14)" : "rgba(255,255,255,0.06)", border: `1px solid ${draft.duration_days === String(d) ? "rgba(255,204,1,0.45)" : "rgba(255,255,255,0.11)"}`, color: draft.duration_days === String(d) ? "#ffcc01" : "rgba(255,255,255,0.5)", fontWeight: draft.duration_days === String(d) ? 700 : 400, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
            />
          ))}
        </Box>
      </Box>
      {draft.start_at && draft.duration_days && (
        <Paper elevation={0} sx={{ backgroundColor: "rgba(255,204,1,0.06)", border: "1px solid rgba(255,204,1,0.18)", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", mb: 1 }}>Período de veiculação</Typography>
          <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
            {new Date(draft.start_at + "T12:00:00").toLocaleDateString("pt-BR")} → {endDate}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", mt: 0.4 }}>{draft.duration_days} dias no ar</Typography>
        </Paper>
      )}
    </Box>
  );
}

// ─── STEP 6 ───────────────────────────────────────────────────────────────────

function SummaryRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2.5, p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Box sx={{ color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", "& .MuiSvgIcon-root": { fontSize: 15 } }}>{icon}</Box>
        <Typography sx={{ color: "rgba(255,255,255,0.38)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" }}>{label}</Typography>
      </Box>
      {children}
    </Paper>
  );
}

function InfoChip({ children, color = "rgba(255,255,255,0.1)", textColor = "rgba(255,255,255,0.6)" }: { children: React.ReactNode; color?: string; textColor?: string }) {
  return (
    <Box component="span" sx={{ display: "inline-block", px: 1.2, py: 0.3, borderRadius: 1.5, backgroundColor: color, border: `1px solid ${textColor}55`, fontSize: "0.75rem", fontWeight: 500, color: textColor }}>
      {children}
    </Box>
  );
}

function Step6({ draft, set, cpcPrice = 0.14, cpvPrice = 0.10 }: { draft: AdDraft; set: (k: keyof AdDraft, v: unknown) => void; cpcPrice?: number; cpvPrice?: number }) {
  const { rate, hobbySurcharge, professionSurcharge, cidadesSurcharge, radiusSurcharge, totalSurchargePercent, effectiveRate } = calcSurcharges(draft, cpcPrice, cpvPrice);
  const budget = parseFloat(draft.budget_amount) || 0;
  const computedUnits = budget > 0 ? Math.floor(budget / effectiveRate) : 0;
  const durationDays = parseInt(draft.duration_days, 10) || 0;

  const quickAmounts = [50, 100, 250, 500, 1000, 2500, 5000];

  const genderLabels: Record<string, string> = { todos: "Todos", feminino: "Feminino", masculino: "Masculino", nao_binario: "Não-binário" };
  const _hobbies = draft.hobbies ?? [];
  const _professions = draft.professions ?? [];
  const _cidades = draft.location_cidades ?? [];

  const startLabel = draft.start_at
    ? new Date(draft.start_at + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const endLabel = draft.start_at && durationDays > 0
    ? (() => { const d = new Date(draft.start_at + "T12:00:00"); d.setDate(d.getDate() + durationDays - 1); return d.toLocaleDateString("pt-BR"); })()
    : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Investimento */}
      <Box>
        <Label>Quanto você quer investir?</Label>
        <TextField
          type="number" fullWidth placeholder="Ex: 500"
          value={draft.budget_amount}
          onChange={(e) => set("budget_amount", e.target.value)}
          inputProps={{ min: 1, step: "0.01" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "1rem" }}>R$</Typography>
              </InputAdornment>
            ),
          }}
          sx={{ ...fieldSx, mb: 1.5 }}
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {quickAmounts.map((v) => {
            const active = draft.budget_amount === String(v);
            return (
              <Chip key={v} label={`R$ ${v >= 1000 ? `${v / 1000}k` : v}`}
                onClick={() => set("budget_amount", String(v))} size="small"
                sx={{ cursor: "pointer", backgroundColor: active ? "rgba(255,204,1,0.14)" : "rgba(255,255,255,0.06)", border: `1px solid ${active ? "rgba(255,204,1,0.45)" : "rgba(255,255,255,0.11)"}`, color: active ? "#ffcc01" : "rgba(255,255,255,0.5)", fontWeight: active ? 700 : 400, "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Tipo de orçamento */}
      <Box>
        <Label>Tipo de orçamento</Label>
        <Box sx={{ display: "flex", gap: 2 }}>
          {([
            { value: "total" as const, label: "Total", desc: "Valor máximo para toda a campanha" },
            { value: "diario" as const, label: "Diário", desc: "Limite de gasto por dia" },
          ]).map((opt) => {
            const active = draft.budget_type === opt.value;
            return (
              <Box key={opt.value} onClick={() => set("budget_type", opt.value)}
                sx={{ flex: 1, cursor: "pointer", borderRadius: 2.5, border: `2px solid ${active ? "#ffcc01" : "rgba(255,255,255,0.1)"}`, backgroundColor: active ? "rgba(255,204,1,0.07)" : "rgba(255,255,255,0.02)", p: 2, transition: "all 0.2s ease", "&:hover": { borderColor: active ? "#ffcc01" : "rgba(255,255,255,0.22)" } }}>
                <Typography sx={{ color: active ? "#ffcc01" : "rgba(255,255,255,0.65)", fontWeight: 700, mb: 0.3 }}>{opt.label}</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>{opt.desc}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Resultado estimado */}
      {computedUnits > 0 && (
        <Paper elevation={0} sx={{ backgroundColor: "rgba(255,204,1,0.06)", border: "1px solid rgba(255,204,1,0.22)", borderRadius: 3, p: 3 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", mb: 1.5 }}>
            Com R$ {budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} {draft.budget_type === "diario" ? "/ dia" : "total"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1 }}>
            <Typography sx={{ color: "#ffcc01", fontWeight: 800, fontSize: "2.6rem", lineHeight: 1 }}>
              {computedUnits.toLocaleString("pt-BR")}
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "1rem" }}>
              {draft.ad_type === "CPC" ? "cliques estimados" : "views estimadas"}
            </Typography>
          </Box>
          {draft.budget_type === "diario" && durationDays > 0 && (
            <Box sx={{ display: "flex", gap: 3, mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <Box>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>Total em {durationDays} dias</Typography>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                  {(computedUnits * durationDays).toLocaleString("pt-BR")} {draft.ad_type === "CPC" ? "cliques" : "views"}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem" }}>Investimento total</Typography>
                <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                  R$ {(budget * durationDays).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>
          )}
          {totalSurchargePercent > 0 && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>
                Composição do custo por {draft.ad_type === "CPC" ? "clique" : "view"}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>Taxa base</Typography>
                  <Typography sx={{ color: "#fff", fontSize: "0.78rem", fontWeight: 600 }}>R$ {rate.toFixed(2)}</Typography>
                </Box>
                {hobbySurcharge > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                      {(draft.hobbies ?? []).length} {(draft.hobbies ?? []).length === 1 ? "interesse" : "interesses"} (+{hobbySurcharge}%)
                    </Typography>
                    <Typography sx={{ color: "#f59e0b", fontSize: "0.75rem", fontWeight: 600 }}>+R$ {(rate * hobbySurcharge / 100).toFixed(4)}</Typography>
                  </Box>
                )}
                {professionSurcharge > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                      {(draft.professions ?? []).length} {(draft.professions ?? []).length === 1 ? "profissão" : "profissões"} (+{professionSurcharge}%)
                    </Typography>
                    <Typography sx={{ color: "#f59e0b", fontSize: "0.75rem", fontWeight: 600 }}>+R$ {(rate * professionSurcharge / 100).toFixed(4)}</Typography>
                  </Box>
                )}
                {cidadesSurcharge > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                      {(draft.location_cidades ?? []).length} {(draft.location_cidades ?? []).length === 1 ? "cidade" : "cidades"} (+{cidadesSurcharge}%)
                    </Typography>
                    <Typography sx={{ color: "#f59e0b", fontSize: "0.75rem", fontWeight: 600 }}>+R$ {(rate * cidadesSurcharge / 100).toFixed(4)}</Typography>
                  </Box>
                )}
                {radiusSurcharge > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>Raio médio (+{radiusSurcharge.toFixed(1)}%)</Typography>
                    <Typography sx={{ color: "#f59e0b", fontSize: "0.75rem", fontWeight: 600 }}>+R$ {(rate * radiusSurcharge / 100).toFixed(4)}</Typography>
                  </Box>
                )}
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", my: 0.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ color: "#fff", fontSize: "0.78rem", fontWeight: 700 }}>Custo efetivo por {draft.ad_type === "CPC" ? "clique" : "view"}</Typography>
                  <Typography sx={{ color: "#ffcc01", fontSize: "0.78rem", fontWeight: 800 }}>R$ {effectiveRate.toFixed(4)}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Resumo das escolhas anteriores */}
      <Box>
        <Label>Resumo da campanha</Label>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {/* Objetivo */}
          <SummaryRow icon={draft.ad_type === "CPC" ? <ClickIcon /> : <ViewIcon />} label="Objetivo">
            <Chip
              label={draft.ad_type === "CPC" ? `CPC · R$${cpcPrice}/clique` : `CPV · R$${cpvPrice}/view`}
              size="small"
              sx={{ backgroundColor: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.3)", color: "#a5b4fc", fontSize: "0.75rem", height: 24 }}
            />
          </SummaryRow>

          {/* Público-alvo */}
          <SummaryRow icon={<PersonIcon />} label="Público-alvo">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
              <InfoChip>{genderLabels[draft.gender] ?? "Todos"}</InfoChip>
              <InfoChip>{draft.age_min}–{draft.age_max} anos</InfoChip>
              {_hobbies.map((h) => <InfoChip key={h} color="rgba(255,204,1,0.15)" textColor="#ffcc01">{h}</InfoChip>)}
              {_professions.map((p) => <InfoChip key={p} color="rgba(16,185,129,0.15)" textColor="#10b981">{p}</InfoChip>)}
              {_hobbies.length === 0 && _professions.length === 0 && <InfoChip>Sem segmentação por interesses</InfoChip>}
            </Box>
          </SummaryRow>

          {/* Localização */}
          <SummaryRow icon={<LocationIcon />} label="Localização">
            <Typography sx={{ color: "#fff", fontSize: "0.85rem", mb: (draft.location_mode ?? "brasil") === "cidades" && _cidades.length > 0 ? 0.8 : 0 }}>
              {locationSummary(draft)}
            </Typography>
            {(draft.location_mode ?? "brasil") === "cidades" && _cidades.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                {_cidades.map((c) => <InfoChip key={c.city}>{c.city} · {c.radius} km</InfoChip>)}
              </Box>
            )}
          </SummaryRow>

          {/* Veiculação */}
          <SummaryRow icon={<CalendarIcon />} label="Veiculação">
            {draft.start_at ? (
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", mb: 0.2 }}>Início</Typography>
                  <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{startLabel}</Typography>
                </Box>
                {durationDays > 0 && (
                  <>
                    <Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", mb: 0.2 }}>Duração</Typography>
                      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{durationDays} dias</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", mb: 0.2 }}>Término</Typography>
                      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{endLabel}</Typography>
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem" }}>Não definido</Typography>
            )}
          </SummaryRow>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NovaCampanhaPage() {
  const { isPatrocinador, authReady, role, userName } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [CPC_PRICE, setCpcPrice] = useState(0.14);
  const [CPV_PRICE, setCpvPrice] = useState(0.10);

  useEffect(() => {
    getPlataformaConfig()
      .then((cfg) => { setCpcPrice(cfg.cpc); setCpvPrice(cfg.cpv); })
      .catch(() => {});
  }, []);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<AdDraft>({
    ...emptyDraft(),
    campaign_name: "Experiencia Chop Brahma",
    ad_type: "CPC",
    creative_url: "/brahma/brahma.png",
    creative_name: "Chop Brahma",
    redirect_url: "https://www.choppbrahmaexpress.com.br/?srsltid=AfmBOoowEtanAiZNVS2OTjPIJoc-d09KBw_IEd7jNuKxxNwoi_qTmXTc",
    hobbies: ["Sertanejo", "Rodeio", "Agronegócio"],
    professions: ["Agricultor / Fazendeiro", "Empresário", "Comerciante", "Autônomo"],
    location_mode: "cidades",
    location_cidades: [
      { city: "São Paulo", radius: 40, lat: -23.5505, lng: -46.6333, maxRadius: 150 },
    ],
    start_at: "2026-07-25",
    duration_days: "10",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (role === null) return;
    if (!isPatrocinador) router.replace("/pages/user/home");
  }, [authReady, role, isPatrocinador, router]);

  if (!authReady) {
    return (
      <Box sx={{ minHeight: "100vh", ...dashboardBackgroundSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  const set = (field: keyof AdDraft, value: unknown) => setDraft((d) => ({ ...d, [field]: value }));
  const canNext = () => step === 0 ? draft.campaign_name.trim().length > 0 : true;
  const canSubmit = () => parseFloat(draft.budget_amount) > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { effectiveRate } = calcSurcharges(draft, CPC_PRICE, CPV_PRICE);
      const budget = parseFloat(draft.budget_amount) || 0;
      const targetUnits = Math.max(1, Math.floor(budget / effectiveRate));
      const loc = locationSummary(draft);
      const _lm = draft.location_mode ?? "brasil";
      const _lc = draft.location_cidades ?? [];
      const _lb = draft.location_bairros ?? [];
      const addrField = _lm === "cidades" && _lc.length > 0
        ? _lc.map((c) => `${c.city} (${c.radius}km)`).join("; ")
        : _lm === "bairros" && _lb.length > 0
          ? _lb.map((b) => `${b.bairro}${b.cidade ? `, ${b.cidade}` : ""} (${b.radius}km)`).join("; ")
          : loc !== "Todo o Brasil" ? loc : undefined;
      const avgRadius = _lm === "cidades" && _lc.length > 0
        ? Math.round(_lc.reduce((s, c) => s + c.radius, 0) / _lc.length)
        : _lm === "bairros" && _lb.length > 0
          ? Math.round(_lb.reduce((s, b) => s + b.radius, 0) / _lb.length)
          : undefined;

      const payload: CampaignPayload = {
        campaign_name: draft.campaign_name.trim(), ad_type: draft.ad_type,
        creative_url: draft.creative_url || undefined,
        creative_name: draft.creative_name || undefined,
        redirect_url: draft.redirect_url || undefined,
        target_units: targetUnits,
        budget_type: draft.budget_type, budget_value: budget,
        start_at: draft.start_at || undefined,
        duration_days: parseInt(draft.duration_days, 10) || undefined,
        hobbies: draft.hobbies.length > 0 ? draft.hobbies : undefined,
        professions: draft.professions.length > 0 ? draft.professions : undefined,
        gender: draft.gender !== "todos" ? draft.gender : undefined,
        age_min: draft.age_min !== 18 ? draft.age_min : undefined,
        age_max: draft.age_max !== 65 ? draft.age_max : undefined,
        address: addrField, radius_km: avgRadius,
      };
      sessionStorage.setItem("diverti_payment_payload", JSON.stringify({
        payload,
        computed_units: targetUnits,
        ad_type: draft.ad_type,
        budget_amount: budget,
        budget_type: draft.budget_type,
        duration_days: parseInt(draft.duration_days, 10) || 0,
        campaign_name: draft.campaign_name.trim(),
      }));
      router.push("/pages/patrocinador/pagamento");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao preparar pagamento", "error");
    } finally { setSubmitting(false); }
  };

  const stepContent = [
    <Step1 key={0} draft={draft} set={set} cpcPrice={CPC_PRICE} cpvPrice={CPV_PRICE} />,
    <Step2 key={1} draft={draft} set={set} />,
    <Step3 key={2} draft={draft} set={set} />,
    <Step4 key={3} draft={draft} set={set} />,
    <Step5 key={4} draft={draft} set={set} />,
    <Step6 key={5} draft={draft} set={set} cpcPrice={CPC_PRICE} cpvPrice={CPV_PRICE} />,
  ];

  return (
    <Box sx={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", ...dashboardBackgroundSx }}>
      <Paper elevation={0} sx={{ flexShrink: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.08)", px: { xs: 2, sm: 4 }, py: 1.5 }}>
        <Box sx={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => step === 0 ? router.push("/pages/patrocinador/home") : setStep((s) => s - 1)}
            sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#fff", backgroundColor: "rgba(255,255,255,0.08)" } }}>
            <BackIcon />
          </IconButton>
          <Image src="/logo/logo-circuito.png" alt="Circuito Sertanejo" width={90} height={32} style={{ objectFit: "contain" }} priority />
          <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.12)", mx: 0.5 }} />
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>Nova Campanha</Typography>
          <Box sx={{ flex: 1 }} />
          <Chip avatar={<Avatar sx={{ width: 20, height: 20, backgroundColor: "#10b981", fontSize: "0.6rem", fontWeight: 700 }}>{(userName ?? "P").charAt(0)}</Avatar>}
            label={userName ?? "Patrocinador"} size="small"
            sx={{ backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontWeight: 600, fontSize: "0.75rem" }} />
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
      <Box sx={{ maxWidth: 1000, margin: "0 auto", px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 5 }, display: "flex", gap: 4, alignItems: "flex-start" }}>
        {/* Stepper lateral */}
        <Box sx={{ display: { xs: "none", md: "block" }, width: 200, flexShrink: 0, position: "sticky", top: 40 }}>
          <Stepper activeStep={step} orientation="vertical"
            sx={{ "& .MuiStepConnector-line": { borderColor: "rgba(255,255,255,0.1)", minHeight: 24 }, "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line": { borderColor: "#ffcc01" }, "& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": { borderColor: "#ffcc01" } }}>
            {STEPS.map((label, idx) => (
              <Step key={label} completed={idx < step}>
                <StepLabel onClick={() => idx < step && setStep(idx)}
                  sx={{ cursor: idx < step ? "pointer" : "default", "& .MuiStepLabel-label": { color: "rgba(255,255,255,0.3)", fontSize: "0.83rem", fontWeight: 400 }, "& .MuiStepLabel-label.Mui-active": { color: "#fff", fontWeight: 700 }, "& .MuiStepLabel-label.Mui-completed": { color: "rgba(255,204,1,0.7)", fontWeight: 400 }, "& .MuiStepIcon-root": { color: "rgba(255,255,255,0.1)", fontSize: "1.4rem" }, "& .MuiStepIcon-root.Mui-active": { color: "#ffcc01" }, "& .MuiStepIcon-root.Mui-completed": { color: "#ffcc01" }, "& .MuiStepIcon-text": { fill: "rgba(255,255,255,0.7)", fontSize: "0.65rem", fontWeight: 800 } }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Conteúdo */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 0.5 }}>Passo {step + 1} de {STEPS.length}</Typography>
            <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>{STEPS[step]}</Typography>
          </Box>

          <Box sx={{ display: { xs: "block", md: "none" }, mb: 3 }}>
            <Stepper activeStep={step} alternativeLabel>
              {STEPS.map((label, idx) => (
                <Step key={label} completed={idx < step}>
                  <StepLabel sx={{ "& .MuiStepLabel-label": { color: "rgba(255,255,255,0.3)", fontSize: "0.62rem" }, "& .MuiStepLabel-label.Mui-active": { color: "#fff" }, "& .MuiStepLabel-label.Mui-completed": { color: "#ffcc01" }, "& .MuiStepIcon-root": { color: "rgba(255,255,255,0.1)" }, "& .MuiStepIcon-root.Mui-active": { color: "#ffcc01" }, "& .MuiStepIcon-root.Mui-completed": { color: "#ffcc01" }, "& .MuiStepIcon-text": { fill: "rgba(255,255,255,0.7)", fontSize: "0.58rem" } }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, p: { xs: 2.5, sm: 4 }, mb: 3 }}>
            {stepContent[step]}
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button onClick={() => step === 0 ? router.push("/pages/patrocinador/home") : setStep((s) => s - 1)}
              sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none", fontWeight: 500 }}>
              {step === 0 ? "Cancelar" : "← Voltar"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="contained" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
                sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 700, borderRadius: "10px", textTransform: "none", px: 4, py: 1.3, "&:hover": { backgroundColor: "#e6b800" }, "&.Mui-disabled": { backgroundColor: "rgba(255,204,1,0.2)", color: "rgba(0,0,0,0.3)" } }}>
                Próximo →
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit} disabled={submitting || !canSubmit()}
                sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 700, borderRadius: "10px", textTransform: "none", px: 4, py: 1.3, minWidth: 160, "&:hover": { backgroundColor: "#e6b800" }, "&.Mui-disabled": { backgroundColor: "rgba(255,204,1,0.2)", color: "rgba(0,0,0,0.3)" } }}>
                {submitting ? "Criando..." : "Criar campanha"}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      </Box>
    </Box>
  );
}
