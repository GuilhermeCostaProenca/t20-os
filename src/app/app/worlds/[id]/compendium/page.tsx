import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function WorldCompendiumPage() {
  return (
    <EmptyState
      title="Compêndio"
      description="Busca e referências rápidas entram aqui."
      action={<Button disabled>Em construção</Button>}
    />
  );
}
