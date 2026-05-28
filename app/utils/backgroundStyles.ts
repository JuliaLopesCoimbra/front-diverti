export const dashboardOnlySx = {
  backgroundImage: "url(/background/fundo.png)",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
  width: "100%",
  boxSizing: "border-box",
} as const;

export const dashboardBackgroundSx = {
  ...dashboardOnlySx,
} as const;
