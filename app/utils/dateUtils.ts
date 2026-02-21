export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d`;

  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
};
















