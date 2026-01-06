import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function NpcsPage() {
  return (
    <EmptyState
      title="NPCs"
      description="Gestão detalhada de NPCs chega em breve."
      action={<Button disabled>Em construção</Button>}
    />
  );
}
