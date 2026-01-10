export default function PlaceholderPage({ params }: { params: { id: string } }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground space-y-4">
            <h2 className="text-2xl font-bold opacity-50">Em desenvolvimento</h2>
            <p>Este módulo estará disponível em breve.</p>
        </div>
    )
}
