"use client";

import React from "react";
import { Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/navigation";

interface NewsActionsProps {
  newsId: number;
  eventId?: number | null;
  isAuthor: boolean;
  isAdmin: boolean;
  isAdminMaster: boolean;
  isPatrocinador: boolean;
  canDelete: boolean;
  canDeactivate: boolean;
  onDelete: () => void;
  onDeactivate: () => void;
  deleting?: boolean;
  deactivating?: boolean;
  postStatus?: "pending" | "approved" | "rejected" | "deleted";
}

export default function NewsActions({
  newsId,
  eventId,
  isAuthor,
  isAdmin,
  isAdminMaster,
  isPatrocinador,
  canDelete,
  canDeactivate,
  onDelete,
  onDeactivate,
  deleting = false,
  deactivating = false,
  postStatus,
}: NewsActionsProps) {
  const router = useRouter();

  // Patrocinadores não podem editar ou excluir posts rejeitados (desativados)
  const isPostRejected = postStatus === "rejected";
  const canColunistaEditOrDelete = isPatrocinador && !isPostRejected;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        right: { xs: 8, sm: 16 }, // Menor margem em telas pequenas
        zIndex: 9999,
        display: "flex",
        gap: 1,
        alignItems: "center",
        maxWidth: "calc(100vw - 16px)", // Garantir que não ultrapasse
        flexWrap: "wrap", // Permitir quebra em telas muito pequenas
        pointerEvents: "auto",
      }}
    >
      {isAuthor && (isAdmin || canColunistaEditOrDelete) && (
        <IconButton
          onClick={() => router.push(`/pages/news/edit?newsId=${newsId}&eventId=${eventId || ''}`)}
          size="small"
          disabled={deleting || deactivating}
          sx={{
            color: "#ffc91f",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: "rgba(255, 201, 31, 0.3)",
            },
          }}
          title="Editar post"
        >
          <EditIcon />
        </IconButton>
      )}

      {canDelete && !(isPatrocinador && isPostRejected) && (
        <IconButton
          onClick={onDelete}
          size="small"
          disabled={deleting || deactivating}
          sx={{
            color: "#ff3040",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: "rgba(255, 48, 64, 0.3)",
            },
          }}
          title="Excluir post"
        >
          <DeleteIcon />
        </IconButton>
      )}

      {canDeactivate && (
        <IconButton
          onClick={onDeactivate}
          size="small"
          disabled={deleting || deactivating}
          sx={{
            color: "#ff3040",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
            width: 40,
            height: 40,
            "&:hover": {
              backgroundColor: "rgba(255, 48, 64, 0.3)",
            },
          }}
          title="Desativar post"
        >
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  );
}




