import { UserResponse } from "@/app/services/auth/authAdminService";

/**
 * Formata uma data para o formato brasileiro
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Ordena usuários alfabeticamente por nome (ou email se não houver nome)
 */
export const sortUsersAlphabetically = (users: UserResponse[]): UserResponse[] => {
  return [...users].sort((a, b) => {
    const nameA = (a.name || a.email || "").toLowerCase().trim();
    const nameB = (b.name || b.email || "").toLowerCase().trim();
    return nameA.localeCompare(nameB, "pt-BR");
  });
};

/**
 * Filtra usuários por termo de busca (nome ou email)
 */
export const filterUsers = (users: UserResponse[], searchTerm: string): UserResponse[] => {
  if (!searchTerm.trim()) {
    return users;
  }

  const term = searchTerm.toLowerCase().trim();
  return users.filter((user) => {
    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return name.includes(term) || email.includes(term);
  });
};

