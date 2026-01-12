import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Carrega a experiência completa da aba Foto IA (camera + resultados)
interface PhotoAIPageProps {
  eventId: number;
}

const PhotoAIClient = dynamic<PhotoAIPageProps>(
  () => import("@/app/pages/user/photoAI/page"),
  { ssr: false }
) as ComponentType<PhotoAIPageProps>;

interface PhotoAIProps {
  eventId: number;
}

export default function PhotoAI({ eventId }: PhotoAIProps) {
  return <PhotoAIClient eventId={eventId} />;
}