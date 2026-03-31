"use client";

import { useEffect, useMemo } from "react";
import { Box, Button, Paper, Typography, Alert, CircularProgress } from "@mui/material";
import { PersonAdd, Info } from "@mui/icons-material";
import { listColunistas } from "@/app/services/auth/authAdminService";
import UserCard from "./UserCard";
import { useInfiniteUsers } from "./useInfiniteUsers";
import { filterUsers } from "./utils";

interface ColunistasTabProps {
  onAddClick: () => void;
  onRevoke: (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => void;
  onReactivate: (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => void;
  refreshTrigger?: number;
  searchTerm?: string;
}

export default function ColunistasTab({ onAddClick, onRevoke, onReactivate, refreshTrigger, searchTerm = "" }: ColunistasTabProps) {
  const { users: colunistas, loading, hasMore, reset, loaderRef } = useInfiniteUsers(listColunistas);
  
  // Filtrar usuários baseado no termo de busca
  const filteredColunistas = useMemo(() => {
    return filterUsers(colunistas, searchTerm);
  }, [colunistas, searchTerm]);

  // Reset quando refreshTrigger mudar
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        backdropFilter: "blur(10px)",
        borderRadius: 3,
        p: 3,
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2, maxWidth: "100%" }}>
        <Box>
          <Typography variant="h5" sx={{ color: "white", fontWeight: 600, mb: 0.5 }}>
            Colunistas
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            {searchTerm
              ? `${filteredColunistas.length} de ${colunistas.length} ${filteredColunistas.length === 1 ? "colunista encontrado" : "colunistas encontrados"}`
              : `${colunistas.length} ${colunistas.length === 1 ? "colunista cadastrado" : "colunistas cadastrados"}`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={onAddClick}
          sx={{
            backgroundColor: "rgb(255, 31, 33)",
            color: "#fff",
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgb(220, 20, 22)",
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(255, 204, 1, 0.4)",
            },
            transition: "all 0.2s ease",
          }}
        >
          Adicionar Colunista
        </Button>
      </Box>

      {filteredColunistas.length === 0 && !loading ? (
        <Alert
          severity="info"
          icon={<Info />}
          sx={{
            backgroundColor: "rgba(33, 150, 243, 0.15)",
            border: "1px solid rgba(33, 150, 243, 0.3)",
            color: "white",
            borderRadius: 2,
          }}
        >
          {searchTerm
            ? `Nenhum colunista encontrado para "${searchTerm}"`
            : 'Nenhum colunista cadastrado. Clique em "Adicionar Colunista" para começar.'}
        </Alert>
      ) : (
        <>
          {filteredColunistas.map((colunista) => (
            <UserCard key={colunista.id} user={colunista} userType="colunista" onRevoke={onRevoke} onReactivate={onReactivate} />
          ))}
          
          {/* Loader para infinite scroll - só mostra se não estiver buscando */}
          {!searchTerm && hasMore && (
            <Box ref={loaderRef} sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              {loading && <CircularProgress sx={{ color: "#ffcc01" }} size={24} />}
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}

