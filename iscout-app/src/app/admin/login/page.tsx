import LoginForm from './LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">iScout</h1>
          <p className="text-slate-400 mt-1">Admin inloggen</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
