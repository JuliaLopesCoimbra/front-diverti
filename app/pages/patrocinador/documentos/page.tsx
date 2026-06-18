"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import {
  Description as DocIcon,
  Receipt as NotaIcon,
  Gavel as ContratoIcon,
  FileDownload as DownloadIcon,
} from "@mui/icons-material";
import PatrocinadorShell from "@/app/components/PatrocinadorShell";

const MOCK_DOCS = [
  { id: 1, type: "nota",     label: "Nota Fiscal",  name: "NF-e 001234 – Maio 2026",    date: "2026-05-31", size: "84 KB" },
  { id: 2, type: "nota",     label: "Nota Fiscal",  name: "NF-e 001198 – Abril 2026",   date: "2026-04-30", size: "81 KB" },
  { id: 3, type: "contrato", label: "Contrato",     name: "Contrato de Veiculação 2026", date: "2026-01-10", size: "210 KB" },
  { id: 4, type: "nota",     label: "Nota Fiscal",  name: "NF-e 001102 – Março 2026",   date: "2026-03-31", size: "79 KB" },
];

function typeIcon(type: string) {
  return type === "contrato" ? <ContratoIcon sx={{ fontSize: 20, color: "#a5b4fc" }} /> : <NotaIcon sx={{ fontSize: 20, color: "#ffcc01" }} />;
}

export default function DocumentosPage() {
  return (
    <PatrocinadorShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Documentos</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Notas fiscais e contratos da sua conta</Typography>
        </Box>

        {MOCK_DOCS.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 4, border: "1px dashed rgba(255,255,255,0.12)" }}>
            <DocIcon sx={{ fontSize: 52, color: "rgba(255,255,255,0.18)", mb: 2 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>Nenhum documento disponível ainda</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {MOCK_DOCS.map((doc) => (
              <Paper
                key={doc.id}
                elevation={0}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 3,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  cursor: "pointer",
                  transition: "background 0.15s",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.07)" },
                }}
              >
                <Box sx={{ flexShrink: 0 }}>{typeIcon(doc.type)}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {doc.name}
                  </Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
                    {new Date(doc.date).toLocaleDateString("pt-BR")} · {doc.size}
                  </Typography>
                </Box>
                <Chip
                  label={doc.label}
                  size="small"
                  sx={{ backgroundColor: doc.type === "contrato" ? "rgba(165,180,252,0.12)" : "rgba(255,204,1,0.12)", color: doc.type === "contrato" ? "#a5b4fc" : "#ffcc01", fontWeight: 600, fontSize: "0.68rem" }}
                />
                <DownloadIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </PatrocinadorShell>
  );
}
