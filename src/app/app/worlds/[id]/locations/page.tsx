import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function WorldLocationsPage() {
  return (
    <EmptyState
      title="Locais"
      description="Mapa e hubs de locais vão aparecer aqui."
      action={<Button disabled>Em construção</Button>}
    />
  );
}
