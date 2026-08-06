export default function CarregandoAdmin() {
  return (
    <main
      className="min-h-screen bg-branco-falso flex items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando o painel…</span>
      <div
        aria-hidden="true"
        className="w-10 h-10 rounded-full border-4 border-marrom-claro/30 border-t-marrom-escuro motion-safe:animate-spin"
      />
    </main>
  )
}
