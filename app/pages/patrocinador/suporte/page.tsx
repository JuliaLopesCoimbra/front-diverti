"use client";

import { Box, Typography, Paper, Button, TextField } from "@mui/material";
import { HeadsetMic as SuporteIcon, Send as SendIcon } from "@mui/icons-material";
import PatrocinadorShell from "@/app/components/PatrocinadorShell";

const FAQS = [
  { q: "Como funciona o modelo CPC?", a: "Você paga por clique no seu anúncio. O valor padrão é R$ 0,14 por clique." },
  { q: "Como funciona o modelo CPV?", a: "Você paga por visualização completa do vídeo. O valor padrão é R$ 0,10 por view." },
  { q: "Posso pausar uma campanha?", a: "Sim, acesse a campanha em Meus Anúncios e utilize o botão de pausa." },
  { q: "Como adiciono créditos?", a: "Acesse a página de Extrato e clique em Forma de Pagamento para gerenciar seus cartões." },
];

export default function SuportePage() {
  return (
    <PatrocinadorShell>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 3, sm: 4 }, pb: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700, mb: 0.3 }}>Suporte</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Dúvidas? A gente te ajuda.</Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
          {/* FAQ */}
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 2 }}>
              Perguntas frequentes
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {FAQS.map((f) => (
                <Paper key={f.q} elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5 }}>
                  <Typography sx={{ color: "#ffcc01", fontWeight: 700, fontSize: "0.88rem", mb: 0.8 }}>{f.q}</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.83rem", lineHeight: 1.6 }}>{f.a}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* Contact form */}
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 2 }}>
              Enviar mensagem
            </Typography>
            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 3 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  label="Assunto"
                  fullWidth
                  variant="outlined"
                  sx={{ "& .MuiOutlinedInput-root": { color: "#fff", "& fieldset": { borderColor: "rgba(255,255,255,0.15)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" } }, "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" } }}
                />
                <TextField
                  label="Mensagem"
                  fullWidth
                  multiline
                  rows={5}
                  variant="outlined"
                  sx={{ "& .MuiOutlinedInput-root": { color: "#fff", "& fieldset": { borderColor: "rgba(255,255,255,0.15)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" } }, "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" } }}
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  sx={{ backgroundColor: "#ffcc01", color: "#111", fontWeight: 700, borderRadius: "10px", textTransform: "none", alignSelf: "flex-start", px: 3, "&:hover": { backgroundColor: "#e6b800" } }}
                >
                  Enviar
                </Button>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, p: 2.5, mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <SuporteIcon sx={{ color: "#ffcc01", fontSize: 28 }} />
              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>Atendimento por e-mail</Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem" }}>suporte@diverti.com.br · Resposta em até 24h</Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </PatrocinadorShell>
  );
}
