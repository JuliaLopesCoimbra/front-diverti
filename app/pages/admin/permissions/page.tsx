"use client";
import { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import {
  inviteAdminUser,
  invitePatrocinador,
  revokeAdminAccess,
  revokePatrocinadorAccess,
  revokeUserAccess,
  reactivateAdminAccess,
  reactivatePatrocinadorAccess,
  reactivateUserAccess,
} from "@/app/services/auth/authAdminService";
import PermissionsHeader from "@/app/components/admin/permissions/PermissionsHeader";
import PermissionsTabs from "@/app/components/admin/permissions/PermissionsTabs";
import TabPanel from "@/app/components/admin/permissions/TabPanel";
import SubadminsTab from "@/app/components/admin/permissions/SubadminsTab";
import ColunistasTab from "@/app/components/admin/permissions/ColunistasTab";
import UsersTab from "@/app/components/admin/permissions/UsersTab";
import InviteModal from "@/app/components/admin/permissions/InviteModal";
import ConfirmModal from "@/app/components/admin/permissions/ConfirmModal";
import SearchBar from "@/app/components/admin/permissions/SearchBar";
import { dashboardBackgroundSx } from "@/app/utils/backgroundStyles";

export default function PermissionsPage() {
  const { isAdminMaster, isAdmin, authReady } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Modais
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<"admin" | "patrocinador">("patrocinador");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "revoke" | "reactivate";
    userType: "admin" | "patrocinador" | "user";
    userId: number;
    userName: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Hooks devem ser chamados antes de qualquer return condicional
  useEffect(() => {
    if (!isAdminMaster && !isAdmin) {
      router.push("/pages/user/home");
      return;
    }
  }, [isAdminMaster, isAdmin, router]);

  // Controla animações quando a página carrega ou tab muda
  useEffect(() => {
    setShouldAnimate(true);
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [tabValue]);

  // Aguardar o contexto estar pronto antes de renderizar
  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          ...dashboardBackgroundSx,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#ffcc01" }} />
      </Box>
    );
  }

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    setInviteLoading(true);
    try {
      if (inviteType === "admin") {
        await inviteAdminUser({ name: inviteName.trim(), email: inviteEmail.trim() });
        showToast("Admin convidado com sucesso!", "success");
      } else {
        await invitePatrocinador({ name: inviteName.trim(), email: inviteEmail.trim() });
        showToast("Patrocinador convidado com sucesso!", "success");
      }
      setInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      // Trigger refresh das listas
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = (userType: "admin" | "patrocinador" | "user", userId: number, userName: string) => {
    setConfirmAction({ type: "revoke", userType, userId, userName });
    setConfirmModalOpen(true);
  };

  const handleReactivate = (userType: "admin" | "patrocinador" | "user", userId: number, userName: string) => {
    setConfirmAction({ type: "reactivate", userType, userId, userName });
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);
    try {
      if (confirmAction.type === "revoke") {
        if (confirmAction.userType === "admin") {
          await revokeAdminAccess(confirmAction.userId);
          showToast("Acesso do admin revogado com sucesso!", "success");
        } else if (confirmAction.userType === "patrocinador") {
          await revokePatrocinadorAccess(confirmAction.userId);
          showToast("Acesso do patrocinador revogado com sucesso!", "success");
        } else {
          await revokeUserAccess(confirmAction.userId);
          showToast("Acesso do usuário revogado com sucesso!", "success");
        }
      } else {
        if (confirmAction.userType === "admin") {
          await reactivateAdminAccess(confirmAction.userId);
          showToast("Acesso do admin reativado com sucesso!", "success");
        } else if (confirmAction.userType === "patrocinador") {
          await reactivatePatrocinadorAccess(confirmAction.userId);
          showToast("Acesso do patrocinador reativado com sucesso!", "success");
        } else {
          await reactivateUserAccess(confirmAction.userId);
          showToast("Acesso do usuário reativado com sucesso!", "success");
        }
      }
      setConfirmModalOpen(false);
      setConfirmAction(null);
      // Trigger refresh das listas
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleInviteModalClose = () => {
    setInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
  };

  const handleConfirmModalClose = () => {
    setConfirmModalOpen(false);
    setConfirmAction(null);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        ...dashboardBackgroundSx,
        position: "relative",
      }}
    >
      <Box className={shouldAnimate ? "slide-up-animation" : ""}>
        <PermissionsHeader />
      </Box>

      {/* Conteúdo Centralizado */}
      <Box
        className={shouldAnimate ? "slide-up-delay-1" : ""}
        sx={{
          maxWidth: "1400px",
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4, md: 5 },
        }}
      >
        <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
          <PermissionsTabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} isAdminMaster={!!isAdminMaster} />
        </Box>

        {/* Barra de Pesquisa */}
        <Box className={shouldAnimate ? "slide-up-delay-2" : ""}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </Box>

        {/* Subadmins Tab - Apenas Master */}
        {isAdminMaster && (
          <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
            <TabPanel value={tabValue} index={0}>
              <SubadminsTab
                onAddClick={() => {
                  setInviteType("admin");
                  setInviteModalOpen(true);
                }}
                onRevoke={handleRevoke}
                onReactivate={handleReactivate}
                refreshTrigger={refreshTrigger}
                searchTerm={searchTerm}
              />
            </TabPanel>
          </Box>
        )}

        {/* Colunistas Tab */}
        <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
          <TabPanel value={tabValue} index={isAdminMaster ? 1 : 0}>
            <ColunistasTab
              onAddClick={() => {
                setInviteType("patrocinador");
                setInviteModalOpen(true);
              }}
              onRevoke={handleRevoke}
              onReactivate={handleReactivate}
              refreshTrigger={refreshTrigger}
              searchTerm={searchTerm}
            />
          </TabPanel>
        </Box>

        {/* Users Tab */}
        <Box className={shouldAnimate ? "slide-up-delay-3" : ""}>
          <TabPanel value={tabValue} index={isAdminMaster ? 2 : 1}>
            <UsersTab onRevoke={handleRevoke} onReactivate={handleReactivate} refreshTrigger={refreshTrigger} searchTerm={searchTerm} />
          </TabPanel>
        </Box>
      </Box>

      {/* Modais */}
      <InviteModal
        open={inviteModalOpen}
        inviteType={inviteType}
        inviteName={inviteName}
        inviteEmail={inviteEmail}
        loading={inviteLoading}
        onClose={handleInviteModalClose}
        onNameChange={setInviteName}
        onEmailChange={setInviteEmail}
        onInvite={handleInvite}
      />

      <ConfirmModal open={confirmModalOpen} action={confirmAction} loading={confirmLoading} onClose={handleConfirmModalClose} onConfirm={handleConfirmAction} />
    </Box>
  );
}
