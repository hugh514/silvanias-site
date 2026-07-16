export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main>
      <h1>Produto {id}</h1>
    </main>
  )
}