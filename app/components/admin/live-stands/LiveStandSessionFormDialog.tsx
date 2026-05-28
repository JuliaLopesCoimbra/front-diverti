"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  MenuItem,
  TextField,
} from "@mui/material";

import { LiveStandSessionResponse } from "@/app/services/liveStands/liveStandSessionService";

export interface LiveStandSessionFormValues {
  session_date: string;
  start_time: string;
  end_time: string;
  booking_open_time: string;
  capacity: number;
  status: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  session?: LiveStandSessionResponse | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: LiveStandSessionFormValues) => Promise<void>;
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.2)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.35)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.7)",
  },
};

export default function LiveStandSessionFormDialog({
  open,
  mode,
  session,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const [sessionDate, setSessionDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bookingOpenTime, setBookingOpenTime] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (!open) {
      return;
    }

    setSessionDate(session?.session_date ?? "");
    setStartTime(session?.start_time?.substring(0, 5) ?? "");
    setEndTime(session?.end_time?.substring(0, 5) ?? "");
    setBookingOpenTime(session?.booking_open_time?.substring(0, 5) ?? "");
    setCapacity(String(session?.capacity ?? 100));
    setStatus(session?.status ?? "active");
  }, [open, session]);

  const handleSubmit = async () => {
    await onSubmit({
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      booking_open_time: bookingOpenTime,
      capacity: Number(capacity),
      status,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: "rgba(18,18,18,0.97)",
          color: "#fff",
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>{mode === "create" ? "Nova sessao" : "Editar sessao"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          label="Data"
          type="date"
          value={sessionDate}
          onChange={(event) => setSessionDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Horario inicial"
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Horario final"
          type="time"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Abertura da lista"
          type="time"
          value={bookingOpenTime}
          onChange={(event) => setBookingOpenTime(event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Capacidade"
          type="number"
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          fullWidth
          disabled={saving}
          sx={inputSx}
        >
          <MenuItem value="active">Ativa</MenuItem>
          <MenuItem value="inactive">Inativa</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "#fff" }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || !sessionDate || !startTime || Number(capacity) <= 0}
          variant="contained"
          sx={{
            backgroundColor: "#ffffff",
            textTransform: "none",
            "&:hover": { backgroundColor: "#dc1416" },
          }}
        >
          {saving ? "Salvando..." : mode === "create" ? "Criar sessao" : "Salvar alteracoes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
