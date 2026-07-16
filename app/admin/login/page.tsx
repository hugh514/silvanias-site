import Image from 'next/image'
import LoginForm from '@/components/admin/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-branco-falso p-4">
      <div className="w-full max-w-4xl bg-branco rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">
        {/* Lado da logo */}
        <div className="flex flex-col items-center justify-center p-8 md:p-12 md:w-1/2 border-b md:border-b-0 md:border-r border-preto m-5">
          
          <Image
            src="/images/logo.png"
            alt="Silvania's Cacau"
            width={280}
            height={280}
            className="w-48 md:w-64 h-auto"
            priority
          />
        </div>

        {/* Lado do formulário */}
        <div className="flex flex-col items-center justify-center p-8 md:p-12 md:w-1/2">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}