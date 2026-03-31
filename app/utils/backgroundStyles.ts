/**
 * Fundo fixo preto fosco.
 */
export const dashboardOnlySx = {
  backgroundColor: "#111111",
  backgroundImage:
    "radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 32%), radial-gradient(circle at bottom right, rgba(255,255,255,0.03), transparent 28%), linear-gradient(180deg, #1a1a1a 0%, #111111 45%, #0b0b0b 100%)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  width: "100%",
  boxSizing: "border-box",
} as const;

/**
 * Mantem o mesmo fundo preto fosco em qualquer tela.
 */
export const dashboardBackgroundSx = {
  ...dashboardOnlySx,
} as const;
