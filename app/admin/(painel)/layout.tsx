import MenuPainel from '@/components/admin/MenuPainel'

/** Moldura do painel (tudo em /admin menos o login). */
export default function LayoutPainel({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-branco-falso flex flex-col md:flex-row">
      <MenuPainel />
      <main className="flex-1 min-w-0 p-4 md:p-10">{children}</main>
    </div>
  )
}
