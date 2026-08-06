export default function Carregando() {
  return (
    <main
      className="min-h-screen bg-branco-falso flex items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando o catálogo…</span>
      {/* motion-safe: quem pediu movimento reduzido vê o indicador parado
          em vez de um elemento a girar sem parar. Princípio II. */}
      <div
        aria-hidden="true"
        className="w-10 h-10 rounded-full border-4 border-marrom-claro/30 border-t-marrom-escuro motion-safe:animate-spin"
      />
    </main>
  )
}
