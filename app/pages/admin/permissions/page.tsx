"use client";
import { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { useRouter } from "next/navigation";
import {
  inviteSubadmin,
  inviteColunista,
  revokeSubadminAccess,
  revokeColunistaAccess,
  revokeUserAccess,
  reactivateSubadminAccess,
  reactivateColunistaAccess,
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

export default function PermissionsPage() {
  const { isAdminMaster, isSubadmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Modais
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<"subadmin" | "colunista">("colunista");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "revoke" | "reactivate";
    userType: "subadmin" | "colunista" | "user";
    userId: number;
    userName: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!isAdminMaster && !isSubadmin) {
      router.push("/pages/user/home");
      return;
    }
  }, [isAdminMaster, isSubadmin, router]);

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    setInviteLoading(true);
    try {
      if (inviteType === "subadmin") {
        await inviteSubadmin({ name: inviteName.trim(), email: inviteEmail.trim() });
        showToast("Subadmin convidado com sucesso!", "success");
      } else {
        await inviteColunista({ name: inviteName.trim(), email: inviteEmail.trim() });
        showToast("Colunista convidado com sucesso!", "success");
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

  const handleRevoke = (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => {
    setConfirmAction({ type: "revoke", userType, userId, userName });
    setConfirmModalOpen(true);
  };

  const handleReactivate = (userType: "subadmin" | "colunista" | "user", userId: number, userName: string) => {
    setConfirmAction({ type: "reactivate", userType, userId, userName });
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setConfirmLoading(true);
    try {
      if (confirmAction.type === "revoke") {
        if (confirmAction.userType === "subadmin") {
          await revokeSubadminAccess(confirmAction.userId);
          showToast("Acesso do subadmin revogado com sucesso!", "success");
        } else if (confirmAction.userType === "colunista") {
          await revokeColunistaAccess(confirmAction.userId);
          showToast("Acesso do colunista revogado com sucesso!", "success");
        } else {
          await revokeUserAccess(confirmAction.userId);
          showToast("Acesso do usuário revogado com sucesso!", "success");
        }
      } else {
        if (confirmAction.userType === "subadmin") {
          await reactivateSubadminAccess(confirmAction.userId);
          showToast("Acesso do subadmin reativado com sucesso!", "success");
        } else if (confirmAction.userType === "colunista") {
          await reactivateColunistaAccess(confirmAction.userId);
          showToast("Acesso do colunista reativado com sucesso!", "success");
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
        backgroundImage: "url(/background/dashboard.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      <PermissionsHeader />

      {/* Conteúdo Centralizado */}
      <Box
        sx={{
          maxWidth: "1400px",
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4, md: 5 },
        }}
      >
        <PermissionsTabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} isAdminMaster={!!isAdminMaster} />

        {/* Barra de Pesquisa */}
        <SearchBar value={searchTerm} onChange={setSearchTerm} />

        {/* Subadmins Tab - Apenas Master */}
        {isAdminMaster && (
          <TabPanel value={tabValue} index={0}>
            <SubadminsTab
              onAddClick={() => {
                setInviteType("subadmin");
                setInviteModalOpen(true);
              }}
              onRevoke={handleRevoke}
              onReactivate={handleReactivate}
              refreshTrigger={refreshTrigger}
              searchTerm={searchTerm}
            />
          </TabPanel>
        )}

        {/* Colunistas Tab */}
        <TabPanel value={tabValue} index={isAdminMaster ? 1 : 0}>
          <ColunistasTab
            onAddClick={() => {
              setInviteType("colunista");
              setInviteModalOpen(true);
            }}
            onRevoke={handleRevoke}
            onReactivate={handleReactivate}
            refreshTrigger={refreshTrigger}
            searchTerm={searchTerm}
          />
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={isAdminMaster ? 2 : 1}>
          <UsersTab onRevoke={handleRevoke} onReactivate={handleReactivate} refreshTrigger={refreshTrigger} searchTerm={searchTerm} />
        </TabPanel>
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
