// Função helper para garantir que a URL da API tenha o protocolo correto
export const getApiUrl = (): string => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  
  if (!API_URL) {
    return "";
  }
  
  // Garante que a URL tem o protocolo (http:// ou https://)
  let baseUrl = API_URL.trim();
  
  // Se não começar com http:// ou https://, adiciona http://
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `http://${baseUrl}`;
  }
  
  // Remove barra final se existir
  baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return baseUrl;
};












