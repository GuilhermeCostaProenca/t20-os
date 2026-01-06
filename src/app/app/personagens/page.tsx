import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function PersonagensPage() {
  return (
    <EmptyState
      title="Personagens"
      description="Em breve uma visão dedicada para fichas e controles rápidos."
      action={<Button disabled>Em construção</Button>}
    />
  );
}
