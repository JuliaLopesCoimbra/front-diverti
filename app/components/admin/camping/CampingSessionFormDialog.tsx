"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { CampingSessionResponse } from "@/app/services/camping/campingAdminService";

export interface CampingSessionFormValues {
  label: string;
  check_in_date: string;
  check_out_date: string;
  capacity: number;
  status: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  session?: CampingSessionResponse | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: CampingSessionFormValues) => Promise<void>;
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
  "& .MuiSelect-icon": { color: "#fff" },
};

export default function CampingSessionFormDialog({ open, mode, session, saving, onClose, onSubmit }: Props) {
  const [label, setLabel] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (!open) return;
    setLabel(session?.label ?? "");
    setCheckIn(session?.check_in_date ?? "");
    setCheckOut(session?.check_out_date ?? "");
    setCapacity(String(session?.capacity ?? 100));
    setStatus(session?.status ?? "active");
  }, [open, session]);

  const isValid = label.trim() && checkIn && checkOut && checkIn < checkOut && Number(capacity) > 0;

  const handleSubmit = async () => {
    await onSubmit({ label, check_in_date: checkIn, check_out_date: checkOut, capacity: Number(capacity), status });
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { backgroundColor: "rgba(18,18,18,0.97)", color: "#fff", borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)" } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === "create" ? "Novo período" : "Editar período"}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          label="Label *"
          placeholder='Ex: "Sexta a Domingo", "Fim de semana"'
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Check-in *"
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Check-out *"
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Vagas"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          fullWidth
          disabled={saving}
          sx={inputSx}
        >
          <MenuItem value="active">Ativo</MenuItem>
          <MenuItem value="inactive">Inativo</MenuItem>
        </TextField>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || !isValid}
          variant="contained"
          sx={{ backgroundColor: "#fff", color: "#111", textTransform: "none", fontWeight: 700, "&:hover": { backgroundColor: "#e8e8e8" } }}
        >
          {saving ? "Salvando..." : mode === "create" ? "Criar período" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
