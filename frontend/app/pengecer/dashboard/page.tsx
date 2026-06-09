'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/pengecer/Sidebar'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'
import { api } from '@/lib/api'

interface DashboardData {
  summary: {
    TotalStokKeseluruhan?: number
    TotalPetaniTerdaftar?: number
    TotalSisaKuotaPetani?: number
    totalStokKeseluruhan?: number
    totalPetaniTerdaftar?: number
    totalSisaKuotaPetani?: number
  }
  recentReceipts: Array<{
    KirimanId?: string
    kirimanId?: string
    JenisPupuk?: string
    jenisPupuk?: string
    JumlahDikirim?: number
    jumlahDikirim?: number
    TimestampDikirim?: string
    timestampDikirim?: string
    Status?: string
    status?: string
  }>
  recentRedemptions: Array<{
    PenebusanId?: string
    penebusanId?: string
    JenisPupuk?: string
    jenisPupuk?: string
    Jumlah?: number
    jumlah?: number
    TimestampPenebusan?: string
    timestampPenebusan?: string
    Status?: string
    status?: string
  }>
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === 'Berhasil' || status === 'Sesuai'
  return (
    <span style={{ padding: '5px 18px', borderRadius: '999px', background: ok ? '#72A94F' : '#BA1A1A', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px' }}>
      {status}
    </span>
  )
}

function ActivityRow({ id, date, jenis, jumlah, status }: { id: string; date: string; jenis: string; jumlah: string; status: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: '#f5f5f5', gap: '12px' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', color: '#1a1a1a' }}>ID : {id}</p>
        <p style={{ fontSize: '12px', color: '#888' }}>{date}</p>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', color: '#333', fontWeight: 500 }}>{jenis}</p>
        <p style={{ fontSize: '12px', color: '#888' }}>{jumlah}</p>
      </div>
      <StatusBadge status={status} />
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<DashboardData>('/api/pengecer/dashboard')
      .then(res => { if (res.data) setData(res.data) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const pick = (obj: any, ...keys: string[]) => {
    for (const k of keys) if (obj?.[k] !== undefined) return obj[k]
    return 0
  }

  const summary = data?.summary || {}
  const statCards = [
    { label: 'Total Stok Keseluruhan', value: pick(summary, 'TotalStokKeseluruhan', 'totalStokKeseluruhan', 'totalStock'), unit: 'Ton' },
    { label: 'Total Petani Terdaftar',  value: pick(summary, 'TotalPetaniTerdaftar', 'totalPetaniTerdaftar', 'totalPetani'),  unit: '' },
    { label: 'Total Sisa Kuota Petani', value: pick(summary, 'TotalSisaKuotaPetani', 'totalSisaKuotaPetani', 'totalSisaKuota'), unit: 'Ton' },
  ]

  const toActivityRow = (item: any, kind: 'receipt' | 'redemption') => {
    if (kind === 'receipt') {
      return {
        id: item.KirimanId || item.kirimanId || '-',
        date: (item.TimestampDikirim || item.timestampDikirim) ? new Date(item.TimestampDikirim || item.timestampDikirim).toLocaleDateString('id-ID') : '-',
        jenis: item.JenisPupuk || item.jenisPupuk || '-',
        jumlah: `${item.JumlahDikirim ?? item.jumlahDikirim ?? 0} kg`,
        status: item.Status || item.status || '-',
      }
    }
    return {
      id: item.PenebusanId || item.penebusanId || item.tebusanId || '-',
      date: (item.TimestampPenebusan || item.timestampPenebusan) ? new Date(item.TimestampPenebusan || item.timestampPenebusan).toLocaleDateString('id-ID') : '-',
      jenis: item.JenisPupuk || item.jenisPupuk || '-',
      jumlah: `${item.Jumlah ?? item.jumlah ?? 0} kg`,
      status: item.Status || item.status || '-',
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <TopBar pageCode="MK-DASH-02" />
        <main style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>Memuat...</div>
          ) : error ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#c53030', fontSize: '14px' }}>{error}</div>
          ) : (
            <>
              <div style={{ borderRadius: '20px', overflow: 'hidden', height: '200px', backgroundImage: "url('/utama.png')", backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', padding: '0 40px', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,40,10,0.35)', borderRadius: '20px' }} />
                <h1 style={{ position: 'relative', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '36px', color: 'white', letterSpacing: '-0.02em' }}>
                  Selamat Datang, Pengecer!
                </h1>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {statCards.map(({ label, value, unit }) => (
                  <div key={label} style={{ background: 'white', borderRadius: '16px', padding: '28px 24px', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>{label}</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '44px', color: '#1a1a1a', lineHeight: 1 }}>
                      {value}{' '}
                      {unit && <span style={{ fontSize: '18px', fontWeight: 500, color: '#888' }}>{unit}</span>}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: '16px', padding: '28px 28px', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', marginBottom: '20px', color: '#1a1a1a' }}>
                  Aktivitas Terbaru
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Konfirmasi Penerimaan</p>
                      <Link href="/pengecer/riwayat" style={{ fontSize: '13px', color: '#1e6b1e', fontWeight: 500 }}>Lihat Semua</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(data?.recentReceipts ?? []).length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '12px' }}>Belum ada penerimaan</p>
                      ) : (
                        (data?.recentReceipts ?? []).map((item: any, i: number) => <ActivityRow key={i} {...toActivityRow(item, 'receipt')} />)
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>Penebusan Pupuk</p>
                      <Link href="/pengecer/riwayat" style={{ fontSize: '13px', color: '#1e6b1e', fontWeight: 500 }}>Lihat Semua</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(data?.recentRedemptions ?? []).length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '12px' }}>Belum ada penebusan</p>
                      ) : (
                        (data?.recentRedemptions ?? []).map((item: any, i: number) => <ActivityRow key={i} {...toActivityRow(item, 'redemption')} />)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
