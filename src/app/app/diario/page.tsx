import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function DiarioPage() {
  return (
    <EmptyState
      title="Diário"
      description="Sessões e resumos aparecerão aqui."
      action={<Button disabled>Em construção</Button>}
    />
  );
}
