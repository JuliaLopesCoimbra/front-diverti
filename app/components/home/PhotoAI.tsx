import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

interface Props {
  eventId: number;
}

export default function PhotoAI({ eventId }: Props) {
  const router = useRouter();

  return (
    <>
      <div>PhotoAI Component</div>
      <Button
        variant="contained"
        onClick={() => router.push(`/pages/user/roulette/${eventId}`)}
      >
        Generate Photo
      </Button>
    </>
  );
}
