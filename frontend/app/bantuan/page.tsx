'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/layout/AuthLayout'

interface FormData {
  email: string
  firstName: string
  lastName: string
  topik: string
  ringkasan: string
}

interface FormErrors {
  email?: string
  firstName?: string
  topik?: string
  ringkasan?: string
  general?: string
}

export default function BantuanPage() {
  const router = useRouter()
  const MAX = 100

  const [form, setForm] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    topik: '',
    ringkasan: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // clear error on change
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.email) newErrors.email = 'Email wajib diisi.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Format email tidak valid.'
    if (!form.firstName) newErrors.firstName = 'Nama wajib diisi.'
    if (!form.topik) newErrors.topik = 'Topik wajib diisi.'
    if (!form.ringkasan) newErrors.ringkasan = 'Rincian masalah wajib diisi.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bantuan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,       // opsional, boleh kosong
          email: form.email,
          topik: form.topik,
          ringkasan: form.ringkasan,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        // ERR-VAL-06: field kosong (422) atau ERR-SYS-02: gagal simpan (500)
        setErrors({ general: json.message ?? 'Gagal mengirim laporan. Coba lagi.' })
        return
      }

      // Sukses → tampilkan state sukses sebentar lalu redirect
      setSuccess(true)
      setTimeout(() => router.push('/'), 5000)

    } catch {
      // ERR-SYS-01: DB/network tidak merespons
      setErrors({ general: 'Layanan sedang tidak tersedia. Silakan coba beberapa saat lagi.' })
    } finally {
      setLoading(false)
    }
  }

  // ── styles ──────────────────────────────────────────────────────────────
  const inputStyle = (hasError?: string): React.CSSProperties => ({
    width: '100%',
    padding: '13px 16px',
    borderRadius: '12px',
    border: `1.5px solid ${hasError ? '#e53e3e' : 'rgba(200,230,200,0.5)'}`,
    fontSize: '14px',
    color: '#0f3d0f',
    background: 'rgba(255,255,255,0.6)',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '14px',
    color: '#1a1a1a',
    marginBottom: '8px',
  }

  const errorText: React.CSSProperties = {
    fontSize: '12px',
    color: '#e53e3e',
    marginTop: '4px',
  }

  return (
    <AuthLayout>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        background: 'rgba(240,249,240,0.75)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '48px',
        border: '1px solid rgba(255,255,255,0.4)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '32px',
          color: '#1a1a1a',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}>
          Form Bantuan
        </h1>
        <p style={{ fontSize: '14px', color: '#555', marginBottom: '32px' }}>
          Formulir keluhan pengguna sistem AgriFlow
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Success alert */}
          {success && (
            <div style={{ padding: '24px', borderRadius: '12px', color: '#065F46', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>
                Laporan Terkirim!
              </p>
              <p style={{ fontSize: '14px' }}>
                Terima kasih. Tim kami akan segera meninjau laporanmu.
              </p>
            </div>
          )}

          {!success && (
            <>

          {/* Email + Nama */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email <span style={{ color: '#e53e3e' }}>*</span></label>
              <input
                name="email"
                type="email"
                placeholder="aanindya05@gmail.com"
                value={form.email}
                onChange={handleChange}
                style={inputStyle(errors.email)}
              />
              {errors.email && <p style={errorText}>{errors.email}</p>}
            </div>
            <div>
              <label style={labelStyle}>Nama Lengkap <span style={{ color: '#e53e3e' }}>*</span></label>
              <input
                name="firstName"
                type="text"
                placeholder="Anindya Artanti"
                value={form.firstName}
                onChange={handleChange}
                style={inputStyle(errors.firstName)}
              />
              {errors.firstName && <p style={errorText}>{errors.firstName}</p>}
            </div>
          </div>

          {/* Topik */}
          <div>
            <label style={labelStyle}>Topik <span style={{ color: '#e53e3e' }}>*</span></label>
            <input
              name="topik"
              type="text"
              placeholder="Gagal login"
              value={form.topik}
              onChange={handleChange}
              style={inputStyle(errors.topik)}
            />
            {errors.topik && <p style={errorText}>{errors.topik}</p>}
          </div>

          {/* Rincian */}
          <div>
            <label style={labelStyle}>
              Rincian Masalah (max. {MAX} karakter) <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <textarea
              name="ringkasan"
              placeholder="Saya gagal login karena lupa password akun saya"
              maxLength={MAX}
              value={form.ringkasan}
              onChange={handleChange}
              rows={3}
              style={{ ...inputStyle(errors.ringkasan), resize: 'none', lineHeight: 1.6 }}
            />
            <p style={{ fontSize: '12px', color: '#888', textAlign: 'right', marginTop: '4px' }}>
              {form.ringkasan.length}/{MAX}
            </p>
            {errors.ringkasan && <p style={errorText}>{errors.ringkasan}</p>}
          </div>

          {/* General error */}
          {errors.general && (
            <div style={{ padding: '12px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}>
              {errors.general}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '12px',
              background: loading ? '#6B8F6B' : '#1e6b1e',
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '15px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'MENGIRIM...' : 'KIRIM'}
          </button>

            </>
          )}

        </div>
      </div>
    </AuthLayout>
  )
}