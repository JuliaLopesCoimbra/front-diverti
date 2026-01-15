"use client";

import { useEffect, useMemo } from "react";
import { Box, Paper, Typography, Alert, CircularProgress } from "@mui/material";
import { Info } from "@mui/icons-material";
import { listUsers } from "@/app/services/auth/authAdminService";
import UserCard from "./UserCard";
import { useInfiniteUsers } from "./useInfiniteUsers";
import { filterUsers } from "./utils";

interface UsersTabProps {
  onRevoke: (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => void;
  onReactivate: (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => void;
  refreshTrigger?: number;
  searchTerm?: string;
}

export default function UsersTab({ onRevoke, onReactivate, refreshTrigger, searchTerm = "" }: UsersTabProps) {
  const { users, loading, hasMore, reset, loaderRef } = useInfiniteUsers(listUsers);
  
  // Filtrar usuários baseado no termo de busca
  const filteredUsers = useMemo(() => {
    return filterUsers(users, searchTerm);
  }, [users, searchTerm]);

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
            Usuários
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            {searchTerm
              ? `${filteredUsers.length} de ${users.length} ${filteredUsers.length === 1 ? "usuário encontrado" : "usuários encontrados"}`
              : `${users.length} ${users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}`}
          </Typography>
        </Box>
      </Box>

      {filteredUsers.length === 0 && !loading ? (
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
          {searchTerm ? `Nenhum usuário encontrado para "${searchTerm}"` : "Nenhum usuário cadastrado."}
        </Alert>
      ) : (
        <>
          {filteredUsers.map((user) => <UserCard key={user.id} user={user} userType="user" onRevoke={onRevoke} onReactivate={onReactivate} />)}
          
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
