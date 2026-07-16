export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main>
      <h1>Editar Produto {id}</h1>
    </main>
  )
}