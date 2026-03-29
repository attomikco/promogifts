import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pale)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-[var(--brand)]">PROMO</span>
            <span className="text-[var(--black)]">GIFTS</span>
          </span>
          <p className="mt-2 text-sm text-[var(--mid)]">Panel de administración</p>
        </div>
        <div className="rounded-xl border border-[var(--light)]/60 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
