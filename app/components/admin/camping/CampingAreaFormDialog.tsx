"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { CampingAreaResponse } from "@/app/services/camping/campingAdminService";

export interface CampingAreaFormValues {
  name: string;
  description: string;
  total_spots: number;
  image: File | null;
  imageUrl: string;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  area?: CampingAreaResponse | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: CampingAreaFormValues) => Promise<void>;
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
};

export default function CampingAreaFormDialog({ open, mode, area, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalSpots, setTotalSpots] = useState("100");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(area?.name ?? "");
    setDescription(area?.description ?? "");
    setTotalSpots(String(area?.total_spots ?? 100));
    setImage(null);
    setImageUrl(area?.image_url ?? "");
    setPreview(area?.image_url ?? null);
  }, [open, area]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
      setImageUrl("");
    }
  };

  const handleSubmit = async () => {
    await onSubmit({ name, description, total_spots: Number(totalSpots), image, imageUrl });
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
        {mode === "create" ? "Nova área de camping" : "Editar área"}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          label="Nome da área *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={2}
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="Capacidade total (vagas)"
          type="number"
          value={totalSpots}
          onChange={(e) => setTotalSpots(e.target.value)}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />
        <TextField
          label="URL da imagem"
          value={imageUrl}
          onChange={(e) => { setImageUrl(e.target.value); if (e.target.value) { setPreview(e.target.value); setImage(null); } }}
          fullWidth
          disabled={saving}
          sx={inputSx}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => fileRef.current?.click()}
            disabled={saving}
            sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)", textTransform: "none" }}
          >
            Escolher arquivo
          </Button>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
            {image ? image.name : "Nenhum arquivo"}
          </Typography>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </Box>

        {preview && (
          <Box
            component="img"
            src={preview}
            alt="Preview"
            sx={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 2, border: "1px solid rgba(255,255,255,0.1)" }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || !name.trim() || Number(totalSpots) <= 0}
          variant="contained"
          sx={{ backgroundColor: "#fff", color: "#111", textTransform: "none", fontWeight: 700, "&:hover": { backgroundColor: "#e8e8e8" } }}
        >
          {saving ? "Salvando..." : mode === "create" ? "Criar área" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
