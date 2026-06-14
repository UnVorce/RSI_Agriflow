'use client'

import { useState, useEffect } from 'react'
import SidebarPemerintah from '@/components/pemerintah/SideBar'
import TopBar from '@/components/layout/TopBar'
import { api } from '@/lib/api'
import { AlertTriangle, TrendingUp, MapPin, Layers } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────
interface ProvinsiData {
  provinsi: string
  totalPupuk: number
}

interface TrenBulanan {
  tahun: number
  bulan: number
  totalPupuk: number
}

interface TopSektor {
  sektor: string
  totalPupuk: number
}

interface DashboardData {
  petaProvinsi: ProvinsiData[]
  totalTerserapTon: string
  realisasiPersen: string
  top3Provinsi: ProvinsiData[]
  trenBulanan: TrenBulanan[]
  top3Sektor: TopSektor[]
}

interface Notification {
  notifikasiId: string
  judul: string
  tanggal: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']

function formatNum(val: string | number | undefined): string {
  const n = parseFloat(String(val ?? 0))
  return isNaN(n) ? '0' : n.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

// ─── Sub-components ────────────────────────────────────────────────────────
function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '28px 24px',
        border: '1px solid #eee',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e6b1e' }}>
        {icon}
        <p style={{ fontSize: '14px', color: '#666' }}>{label}</p>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '36px', color: '#1a1a1a', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )
}

function ProvinsiRow({ provinsi, totalPupuk, rank }: ProvinsiData & { rank: number }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#f5f5f5',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{medals[rank] ?? rank + 1}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>
          {provinsi}
        </p>
      </div>
      <p style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>
        {formatNum(totalPupuk)} Ton
      </p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function DashboardPemerintahPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.allSettled([
      api.get<any>('/api/pemerintah/dashboard'),
      api.get<any>('/api/pemerintah/notifications/top'),
    ])
      .then(([dashRes, notifRes]) => {
        if (dashRes.status === 'fulfilled' && dashRes.value.data) {
          const raw = dashRes.value.data
          // Normalize — SP returns multiple result sets, backend maps them
          // totalAbsorbed may be an array (single-row result set) or object
          const absorbedRow = Array.isArray(raw.totalAbsorbed) ? raw.totalAbsorbed[0] : raw.totalAbsorbed
          const realizationRow = Array.isArray(raw.realizationPercent) ? raw.realizationPercent[0] : raw.realizationPercent
          const normalized: DashboardData = {
            petaProvinsi: raw.mapByProvince ?? raw.petaProvinsi ?? [],
            totalTerserapTon: String(
              absorbedRow?.TotalTerserapTon ??
              absorbedRow?.totalTerserapTon ??
              raw.totalTerserapTon ??
              '0'
            ),
            realisasiPersen: String(
              realizationRow?.RealisasiPersen ??
              realizationRow?.realisasiPersen ??
              raw.realisasiPersen ??
              '0'
            ),
            top3Provinsi: raw.topProvinces ?? raw.top3Provinsi ?? [],
            trenBulanan: raw.monthlyTrend ?? raw.trenBulanan ?? [],
            top3Sektor: raw.topSectors ?? raw.top3Sektor ?? [],
          }
          setData(normalized)
          setError('')
        }
        if (notifRes.status === 'fulfilled' && notifRes.value.data) {
          const raw = notifRes.value.data
          const rawList: any[] = Array.isArray(raw) ? raw : (raw.notifications ?? [])
          // Normalize PascalCase → camelCase
          const list: Notification[] = rawList.map((n: any) => ({
            notifikasiId: String(n.NotifikasiId ?? n.notifikasiId ?? ''),
            judul: n.Judul ?? n.judul ?? '-',
            tanggal: n.Tanggal ?? n.tanggal ?? '-',
          }))
          setNotifs(list)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
        <SidebarPemerintah />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', color: '#1e6b1e' }}>Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <SidebarPemerintah />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Main */}
          <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Hero */}
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                height: '180px',
                backgroundImage: "url('/utama.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                padding: '0 40px',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,40,10,0.38)', borderRadius: '20px' }} />
              <h1 style={{ position: 'relative', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '34px', color: 'white', letterSpacing: '-0.02em' }}>
                Dashboard Pemerintah
              </h1>
            </div>

            {error && (
              <div style={{ padding: '12px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <StatCard
                label="Total Pupuk Terserap"
                value={`${formatNum(data?.totalTerserapTon)} Ton`}
                icon={<Layers size={20} />}
              />
              <StatCard
                label="Realisasi Penebusan"
                value={`${formatNum(data?.realisasiPersen)} %`}
                icon={<TrendingUp size={20} />}
              />
            </div>

            {/* Top 3 Provinsi */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #eee',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <MapPin size={18} color="#1e6b1e" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: '#1a1a1a' }}>
                  Top 3 Provinsi Penyerapan
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data?.top3Provinsi ?? []).length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '12px' }}>Belum ada data</p>
                ) : (
                  (data?.top3Provinsi ?? []).map((prov, idx) => (
                    <ProvinsiRow key={prov.provinsi} {...prov} rank={idx} />
                  ))
                )}
              </div>
            </div>

            {/* Tren Bulanan */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #eee',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <TrendingUp size={18} color="#1e6b1e" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: '#1a1a1a' }}>
                  Tren Penyerapan Bulanan
                </h2>
              </div>
              {(data?.trenBulanan ?? []).length === 0 ? (
                <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '12px' }}>Belum ada data</p>
              ) : (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {(data?.trenBulanan ?? []).map((t, idx) => {
                    const maxVal = Math.max(...(data?.trenBulanan ?? []).map(x => x.totalPupuk), 1)
                    const heightPct = (t.totalPupuk / maxVal) * 100
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '48px' }}>
                        <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end' }}>
                          <div
                            style={{
                              width: '32px',
                              height: `${heightPct}%`,
                              minHeight: '4px',
                              background: '#1e6b1e',
                              borderRadius: '4px 4px 0 0',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>
                          {BULAN[(t.bulan - 1) % 12]}
                        </span>
                        <span style={{ fontSize: '10px', color: '#aaa' }}>{t.tahun}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top 3 Sektor */}
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #eee',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: '#1a1a1a', marginBottom: '20px' }}>
                Top 3 Sektor
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data?.top3Sektor ?? []).length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '12px' }}>Belum ada data</p>
                ) : (
                  (data?.top3Sektor ?? []).map((s, idx) => (
                    <div
                      key={s.sektor}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: '#f5f5f5',
                        gap: '12px',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: '#1e6b1e', width: '24px' }}>
                        {idx + 1}
                      </span>
                      <p style={{ flex: 1, fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>{s.sektor}</p>
                      <p style={{ fontSize: '13px', color: '#555' }}>{formatNum(s.totalPupuk)} Ton</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </main>

          {/* Sidebar Notifikasi Kanan */}
          <aside style={{ width: '360px', background: '#fafafa', borderLeft: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #72A94F', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: '#114111' }}>
                  Notifikasi
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifs.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '12px' }}>Tidak ada notifikasi</p>
                ) : (
                  notifs.map((n, idx) => (
                    <div
                      key={n.notifikasiId || idx}
                      style={{
                        background: '#e8e8e8',
                        borderRadius: '12px',
                        position: 'relative',
                        overflow: 'hidden',
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', background: '#BA1A1A' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', paddingLeft: '8px' }}>
                        <AlertTriangle size={16} color="#BA1A1A" strokeWidth={2} />
                        <span style={{ fontSize: '12px', color: '#333' }}>{n.tanggal || '-'}</span>
                      </div>
                      <p style={{ paddingLeft: '8px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: '#1a1a1a' }}>
                        {n.judul}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
