'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, Calendar } from 'lucide-react'
import Sidebar from '@/components/pengecer/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { api, ApiError } from '@/lib/api'

const jenisPupukOptions = ['Urea', 'Kompos', 'NPK', 'SP-36', 'NPK Formulasi Khusus', 'Organik', 'Kimia']

type Step = 1 | 2 | 3

interface RecentReceipt { kirimanId: string; timestampDikirim: string; jenisPupuk: string; jumlahDikirim: number }

export default function TerimaStokPage() {
  const [step, setStep]           = useState<Step>(1)
  const [idInput, setIdInput]     = useState('')
  const [idError, setIdError]     = useState('')
  const [pengiriman, setPengiriman] = useState<{ jenis: string; jumlah: number; waktu: string } | null>(null)
  const [idKonfirm, setIdKonfirm] = useState('')
  const [cekLoading, setCekLoading] = useState(false)
  const [kirimLoading, setKirimLoading] = useState(false)
  const [kirimError, setKirimError] = useState('')
  const [recentReceipts, setRecentReceipts] = useState<RecentReceipt[]>([])

  // Step 2 form
  const [jenis, setJenis]         = useState('')
  const [jenisSearch, setJenisSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [jumlah, setJumlah]       = useState('')
  const [waktu, setWaktu]         = useState('')
  const dateInputRef              = useRef<HTMLInputElement>(null)
  const dropdownRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    api.get<{ receipts: RecentReceipt[] }>('/api/pengecer/penerimaan/history')
      .then(res => { if (res.data?.receipts) setRecentReceipts(res.data.receipts.slice(0, 4)) })
      .catch(() => {})
  }, [])

  const filteredJenis = jenisPupukOptions.filter(j =>
    j.toLowerCase().includes(jenisSearch.toLowerCase())
  )

  const [status, setStatus]             = useState<'Sesuai' | 'Tidak Sesuai'>('Sesuai')
  const [waktuKonfirmasi, setWaktuKonfirmasi] = useState('')

  // ── Step 1: cek ID ──────────────────────────────────────────────────────────
  async function handleCekId() {
    const id = idInput.trim()
    if (!id) { setIdError('Masukkan ID Pengiriman'); return }
    setCekLoading(true)
    setIdError('')
    try {
      const res = await api.get<any>(`/api/pengecer/validasi-kiriman/${id}`)
      if (res.data) {
        const d = res.data
        setPengiriman({ jenis: d.JenisPupuk || d.jenisPupuk || '', jumlah: d.JumlahDikirim ?? d.jumlahDikirim ?? 0, waktu: d.TimestampDikirim || d.timestampDikirim || '' })
        setIdKonfirm(id)
        setJenis(''); setJumlah(''); setWaktu('')
        setStep(2)
      }
    } catch (err) {
      setIdError(err instanceof ApiError ? err.message : 'ID Pengiriman tidak valid')
    } finally {
      setCekLoading(false)
    }
  }

  // ── Step 2: konfirmasi detail ───────────────────────────────────────────────
  async function handleKonfirmasi() {
    if (!jumlah || !waktu) return
    setKirimLoading(true)
    setKirimError('')
    try {
      const [dd, mm, yyyy] = waktu.split('/')
      const timestampDiterima = `${yyyy}-${mm}-${dd}T00:00:00Z`

      await api.post('/api/pengecer/terima-stok', {
        kirimanId: idKonfirm,
        jumlahDiterima: parseFloat(jumlah),
        timestampDiterima,
      })

      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const jam = `${pad(now.getHours())}:${pad(now.getMinutes())}`
      setWaktuKonfirmasi(`${waktu} | ${jam}`)
      setStatus('Sesuai')
      setStep(3)
    } catch (err) {
      setKirimError(err instanceof ApiError ? err.message : 'Gagal menerima stok')
    } finally {
      setKirimLoading(false)
    }
  }

  // ── Stepper indicator ───────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: 'ID Pengiriman' },
    { n: 2, label: 'Detail Penerimaan' },
    { n: 3, label: 'Simpan Penerimaan' },
  ]

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '12px',
    border: '1.5px solid #c8e0c8',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    color: '#1a1a1a',
    background: 'white',
    outline: 'none',
  }

  const btnPrimary = {
    width: '100%',
    padding: '15px',
    borderRadius: '12px',
    background: '#1e6b1e',
    color: 'white',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '15px',
    letterSpacing: '0.05em',
    border: 'none',
    cursor: 'pointer',
  }

  const btnOutline = {
    width: '100%',
    padding: '15px',
    borderRadius: '12px',
    background: 'white',
    color: '#1e6b1e',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '15px',
    letterSpacing: '0.05em',
    border: '2px solid #1e6b1e',
    cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Sidebar notifCount={2} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <TopBar />

        <main style={{ flex: 1, padding: '32px 36px', display: 'grid', gridTemplateColumns: 'auto 320px', gap: '40px', alignItems: 'start' }}>

          {/* ── Left: form area dengan batas lebar ── */}
          <div style={{ maxWidth: '700px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                Terima Stok
              </h1>
              {step === 2 && (
                <span style={{ fontSize: '15px', color: '#555', fontWeight: 500 }}>ID : {idKonfirm}</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '32px', alignItems: 'start' }}>

              {/* Stepper */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {steps.map(({ n, label }, i) => {
                  const done    = step > n
                  const active  = step === n
                  const pending = step < n
                  return (
                    <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Circle */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: pending ? 'white' : '#1e6b1e',
                          border: `2px solid ${pending ? '#ccc' : '#1e6b1e'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700, fontSize: '14px',
                            color: pending ? '#aaa' : 'white',
                          }}>{n}</span>
                        </div>
                        {/* Label */}
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: active ? 700 : 400,
                          fontSize: '14px',
                          color: pending ? '#aaa' : '#1e6b1e',
                        }}>{label}</span>
                      </div>
                      {/* Connector line */}
                      {i < steps.length - 1 && (
                        <div style={{
                          width: 2, height: 36,
                          background: step > n ? '#1e6b1e' : '#ddd',
                          marginLeft: '17px', marginTop: '2px', marginBottom: '2px',
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Form content */}
              <div>

                {/* ── STEP 1 ── */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: '#1a1a1a' }}>
                      Masukkan ID Pengiriman
                    </p>
                    <input
                      type="text"
                      value={idInput}
                      onChange={e => { setIdInput(e.target.value); setIdError('') }}
                      placeholder="135246"
                      style={inputStyle}
                      onKeyDown={e => e.key === 'Enter' && handleCekId()}
                    />
                    {idError && (
                      <p style={{ fontSize: '13px', color: '#c53030' }}>{idError}</p>
                    )}
                    <button style={{ ...btnPrimary, opacity: cekLoading ? 0.6 : 1 }} disabled={cekLoading} onClick={handleCekId}>
                      {cekLoading ? 'Memeriksa...' : 'CEK ID'}
                    </button>
                  </div>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Jenis Pupuk — searchable dropdown */}
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', marginBottom: '10px', color: '#1a1a1a' }}>
                        Jenis Pupuk
                      </p>
                      <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={jenisSearch || jenis}
                          onChange={e => {
                            setJenisSearch(e.target.value)
                            setJenis('')
                            setShowDropdown(true)
                          }}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="Cari jenis pupuk..."
                          style={{ ...inputStyle, paddingRight: '40px' }}
                        />
                        <span
                          onClick={() => setShowDropdown(v => !v)}
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#1e6b1e', userSelect: 'none' }}
                        >▾</span>

                        {showDropdown && filteredJenis.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            left: 0, right: 0,
                            background: 'white',
                            border: '1.5px solid #c8e0c8',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            zIndex: 50,
                            maxHeight: '200px',
                            overflowY: 'auto',
                          }}>
                            {filteredJenis.map((j, i) => (
                              <div
                                key={j}
                                onMouseDown={() => {
                                  setJenis(j)
                                  setJenisSearch('')
                                  setShowDropdown(false)
                                }}
                                style={{
                                  padding: '11px 16px',
                                  fontSize: '14px',
                                  color: '#1a1a1a',
                                  cursor: 'pointer',
                                  background: jenis === j ? '#f0f9f0' : 'white',
                                  borderRadius: i === 0 ? '10px 10px 0 0' : i === filteredJenis.length - 1 ? '0 0 10px 10px' : '0',
                                  fontWeight: jenis === j ? 600 : 400,
                                  transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f0f9f0')}
                                onMouseLeave={e => (e.currentTarget.style.background = jenis === j ? '#f0f9f0' : 'white')}
                              >
                                {j}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Jumlah Pupuk */}
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', marginBottom: '10px', color: '#1a1a1a' }}>
                        Jumlah Pupuk
                      </p>
                      <input
                        type="number"
                        value={jumlah}
                        onChange={e => setJumlah(e.target.value)}
                        placeholder="Masukkan jumlah pupuk"
                        style={inputStyle}
                      />
                    </div>

                    {/* Waktu Penerimaan — ketik langsung atau klik icon kalender */}
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', marginBottom: '10px', color: '#1a1a1a' }}>
                        Waktu Penerimaan
                      </p>
                      <div style={{ position: 'relative' }}>
                        {/* Input ketik manual DD/MM/YYYY */}
                        <input
                          type="text"
                          value={waktu}
                          onChange={e => setWaktu(e.target.value)}
                          placeholder="DD/MM/YYYY"
                          maxLength={10}
                          style={{ ...inputStyle, paddingRight: '44px' }}
                        />
                        {/* Native date input — hanya visible di belakang icon, trigger saat icon diklik */}
                        <input
                          ref={dateInputRef}
                          type="date"
                          onChange={e => {
                            if (!e.target.value) return
                            const [y, m, d] = e.target.value.split('-')
                            setWaktu(`${d}/${m}/${y}`)
                          }}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '24px',
                            height: '24px',
                            opacity: 0,
                            cursor: 'pointer',
                            zIndex: 3,
                          }}
                        />
                        {/* Icon kalender — klik buka date picker */}
                        <Calendar
                          size={18}
                          color="#1e6b1e"
                          onClick={() => dateInputRef.current?.showPicker?.()}
                          style={{
                            position: 'absolute',
                            right: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            zIndex: 2,
                            pointerEvents: 'auto',
                          }}
                        />
                      </div>
                    </div>

                    {kirimError && <p style={{ fontSize: '13px', color: '#c53030', marginBottom: '8px' }}>{kirimError}</p>}
                    <button style={{ ...btnPrimary, opacity: kirimLoading ? 0.6 : 1 }} disabled={kirimLoading} onClick={handleKonfirmasi}>{kirimLoading ? 'Mengirim...' : 'KONFIRMASI'}</button>
                    <button style={btnOutline} onClick={() => setStep(1)}>KEMBALI</button>
                  </div>
                )}

                {/* ── STEP 3 ── */}
                {step === 3 && (
                  <div style={{
                    background: '#f0f9f0',
                    borderRadius: '20px',
                    padding: '36px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    maxWidth: '420px',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: '#1e6b1e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '8px',
                    }}>
                      <CheckCircle2 size={36} color="white" strokeWidth={2} />
                    </div>

                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: '#1a1a1a' }}>
                      Data Berhasil Disimpan
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                      Data Penerimaan berhasil disimpan
                    </p>

                    {/* Detail rows */}
                    {[
                      { label: 'ID Pengiriman',    val: idKonfirm },
                      { label: 'Jenis Pupuk',      val: jenis },
                      { label: 'Jumlah Pupuk',     val: jumlah },
                      { label: 'Waktu Penerimaan', val: waktuKonfirmasi },
                      { label: 'Status Penerimaan', val: status },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: '14px', color: '#555' }}>{label}</span>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700, fontSize: '14px',
                          color: label === 'Status Penerimaan' ? (status === 'Sesuai' ? '#1e6b1e' : '#c53030') : '#1a1a1a',
                        }}>{val}</span>
                      </div>
                    ))}

                    {/* Buttons - now in one line without wrapping */}
                    <Link href="/pengecer/dashboard" style={{ ...btnPrimary, display: 'block', textAlign: 'center', marginTop: '20px', textDecoration: 'none' }}>
                      Kembali ke Halaman Utama
                    </Link>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <Link
                        href="/pengecer/riwayat"
                        style={{
                          ...btnOutline,
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          fontSize: '13px',
                          padding: '12px 8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Riwayat Penerimaan
                      </Link>
                      <Link
                        href="/pengecer/manajemen-stok"
                        style={{
                          ...btnOutline,
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          fontSize: '13px',
                          padding: '12px 8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Manajemen Stok
                      </Link>
                    </div>

                    <p style={{ fontSize: '13px', color: '#555', marginTop: '8px' }}>
                      Ada kendala ?{' '}
                      <Link href="/bantuan" style={{ color: '#1e6b1e', fontWeight: 600 }}>Hubungi Bantuan</Link>
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Right: Riwayat Penerimaan ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: '#1a1a1a' }}>
                Riwayat Penerimaan
              </h2>
              <Link href="/pengecer/riwayat" style={{ fontSize: '13px', color: '#1e6b1e', fontWeight: 600 }}>
                Lihat Semua
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentReceipts.length === 0 && (
                <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '16px' }}>Belum ada penerimaan</p>
              )}
              {recentReceipts.map(({ kirimanId, timestampDikirim, jenisPupuk, jumlahDikirim }) => (
                <div key={kirimanId} style={{ background: '#f0f0f0', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>ID : {kirimanId?.slice(0, 8) || '-'}</p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{timestampDikirim ? new Date(timestampDikirim).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>{jenisPupuk}</p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{jumlahDikirim} Kg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}