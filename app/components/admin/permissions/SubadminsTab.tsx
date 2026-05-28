"use client";

import { useEffect, useMemo } from "react";
import { Box, Button, Paper, Typography, Alert, CircularProgress } from "@mui/material";
import { PersonAdd, Info } from "@mui/icons-material";
import { listSubadmins } from "@/app/services/auth/authAdminService";
import UserCard from "./UserCard";
import { useInfiniteUsers } from "./useInfiniteUsers";
import { filterUsers } from "./utils";

interface SubadminsTabProps {
  onAddClick: () => void;
  onRevoke: (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => void;
  onReactivate: (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => void;
  refreshTrigger?: number;
  searchTerm?: string;
}

export default function SubadminsTab({ onAddClick, onRevoke, onReactivate, refreshTrigger, searchTerm = "" }: SubadminsTabProps) {
  const { users: subadmins, loading, hasMore, reset, loaderRef } = useInfiniteUsers(listSubadmins);
  
  // Filtrar usuários baseado no termo de busca
  const filteredSubadmins = useMemo(() => {
    return filterUsers(subadmins, searchTerm);
  }, [subadmins, searchTerm]);

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
            Administradores
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            {searchTerm
              ? `${filteredSubadmins.length} de ${subadmins.length} ${filteredSubadmins.length === 1 ? "administrador encontrado" : "administradores encontrados"}`
              : `${subadmins.length} ${subadmins.length === 1 ? "administrador cadastrado" : "administradores cadastrados"}`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={onAddClick}
          sx={{
            backgroundColor: "#ffffff",
            color: "#111111",
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e8e8e8",
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
            },
            transition: "all 0.2s ease",
          }}
        >
          Adicionar Administrador
        </Button>
      </Box>

      {filteredSubadmins.length === 0 && !loading ? (
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
            ? `Nenhum administrador encontrado para "${searchTerm}"`
            : 'Nenhum administrador cadastrado. Clique em "Adicionar Administrador para começar.'}
        </Alert>
      ) : (
        <>
          {filteredSubadmins.map((subadmin) => (
            <UserCard key={subadmin.id} user={subadmin} userType="subadmin" onRevoke={onRevoke} onReactivate={onReactivate} />
          ))}
          
          {/* Loader para infinite scroll - só mostra se não estiver buscando */}
          {!searchTerm && hasMore && (
            <Box ref={loaderRef} sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              {loading && <CircularProgress sx={{ color: "#7c3aed" }} size={24} />}
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}

