'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userEmail: string
}

export default function AdminNav({ userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/inzendingen', label: 'Inzendingen' },
    { href: '/admin/opdrachten', label: 'Opdrachten' },
    { href: '/admin/vragen', label: 'Vragen' },
    { href: '/admin/instellingen', label: 'Instellingen' },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-yellow-400 font-bold mr-3 shrink-0">⚙️ Admin</span>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === link.href
                    ? 'bg-yellow-400 text-slate-900'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white text-sm ml-4 shrink-0"
          >
            Uitloggen
          </button>
        </div>
      </div>
    </nav>
  )
}
