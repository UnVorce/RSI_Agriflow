import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background foto sawah */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: "url('utama.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
          zIndex: 0,
        }}
      />
      {/* Green tint overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(21, 82, 21, 0.35)',
          zIndex: 0,
        }}
      />

      {/* Top-left back nav */}
      <nav
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '20px 32px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'white',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '17px',
            letterSpacing: '-0.01em',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
          AgriFlow
        </Link>
      </nav>

      {/* Page content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        {children}
      </div>
    </main>
  )
}