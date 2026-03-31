"use client";

import { ChangeEvent, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { LiveStandResponse } from "@/app/services/liveStands/liveStandService";

export interface LiveStandFormValues {
  name: string;
  description: string;
  image: File | null;
  removeImage: boolean;
}

interface Props {
  open: boolean;
  mode: "create" | "edit";
  stand?: LiveStandResponse | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: LiveStandFormValues) => Promise<void>;
}

export default function LiveStandFormDialog({
  open,
  mode,
  stand,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(stand?.name ?? "");
    setDescription(stand?.description ?? "");
    setImage(null);
    setRemoveImage(false);
  }, [open, stand]);

  useEffect(() => {
    if (image) {
      const objectUrl = URL.createObjectURL(image);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (removeImage) {
      setPreviewUrl(null);
      return;
    }

    setPreviewUrl(stand?.image_url ?? null);
  }, [image, removeImage, stand]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setImage(selectedFile);
    if (selectedFile) {
      setRemoveImage(false);
    }
  };

  const handleSubmit = async () => {
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      image,
      removeImage,
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
          backgroundColor: "rgba(18, 18, 18, 0.96)",
          color: "#fff",
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.1)",
        },
      }}
    >
      <DialogTitle>{mode === "create" ? "Novo estande" : "Editar estande"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <TextField
          label="Nome do estande"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          disabled={saving}
          autoFocus
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
            },
            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
          }}
        />

        <TextField
          label="Descricao"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          fullWidth
          multiline
          minRows={4}
          disabled={saving}
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
            },
            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
          }}
        />

        <Button variant="outlined" component="label" disabled={saving} sx={{ textTransform: "none" }}>
          {image ? "Trocar foto selecionada" : "Selecionar foto"}
          <input hidden type="file" accept="image/*" onChange={handleFileChange} />
        </Button>

        {(stand?.image_url || image) && (
          <FormControlLabel
            control={
              <Switch
                checked={removeImage}
                onChange={(event) => setRemoveImage(event.target.checked)}
                disabled={saving || !stand?.image_url}
              />
            }
            label="Remover foto atual"
          />
        )}

        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt="Preview do estande"
            sx={{
              width: "100%",
              maxHeight: 220,
              objectFit: "cover",
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        ) : (
          <Typography sx={{ color: "rgba(255,255,255,0.55)" }}>
            Nenhuma foto selecionada.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: "rgba(255,255,255,0.8)" }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          variant="contained"
          sx={{
            backgroundColor: "#ff1f21",
            textTransform: "none",
            "&:hover": { backgroundColor: "#dc1416" },
          }}
        >
          {saving ? "Salvando..." : mode === "create" ? "Criar estande" : "Salvar alteracoes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
