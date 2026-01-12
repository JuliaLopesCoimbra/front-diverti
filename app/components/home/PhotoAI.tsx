import dynamic from "next/dynamic";

// Carrega a experiência completa da aba Foto IA (camera + resultados)
const PhotoAIClient = dynamic(
  () => import("@/app/pages/user/photoAI/page"),
  { ssr: false }
);

export default function PhotoAI() {
  return <PhotoAIClient />;
}