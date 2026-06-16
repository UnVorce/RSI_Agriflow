'use client'

import { useState, useEffect, useCallback } from 'react'
import SidebarPemerintah from '@/components/pemerintah/SideBar'
import TopBar from '@/components/layout/TopBar'
import { api, ApiError } from '@/lib/api'
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, ExternalLink, Users, UserCheck, UserX } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────
interface PendingUser {
  userId: number
  no: number
  namaLengkap: string
  email: string
  role: string
  registrationProof: string
}

interface SummaryData {
  total: number
  totalAktif: number
  totalDitolak: number
  users: PendingUser[]
  totalRows: number
}

const PAGE_SIZE = 10

// ─── Page ──────────────────────────────────────────────────────────────────
export default function VerifikasiPage() {
  const [summary, setSummary] = useState<Omit<SummaryData, 'users'> | null>(null)
  const [users, setUsers] = useState<PendingUser[]>([])
  const [page, setPage] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [error, setError] = useState('')

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get<any>('/api/pemerintah/users/pending', {
        page: String(p),
        pageSize: String(PAGE_SIZE),
      })
      if (res.data) {
        const raw = res.data
        // /api/auth/pending returns {message, data:[...]} — data is a Prisma array
        // OR SP-based {summary, pendingUsers}
        let rawList: any[] = []
        let summaryData = { total: 0, totalAktif: 0, totalDitolak: 0, totalRows: 0 }

        if (Array.isArray(raw)) {
          rawList = raw
        } else if (Array.isArray(raw.data)) {
          // Auth endpoint: {message, data:[...]}
          rawList = raw.data
        } else if (raw.pendingUsers) {
          // SP-based: {summary:[{Total,TotalAktif,TotalDitolak}], pendingUsers:[...]}
          const s = Array.isArray(raw.summary) ? raw.summary[0] : raw.summary
          summaryData = {
            total: Number(s?.Total ?? 0),
            totalAktif: Number(s?.TotalAktif ?? 0),
            totalDitolak: Number(s?.TotalDitolak ?? 0),
            totalRows: Number(s?.Total ?? 0),
          }
          rawList = raw.pendingUsers
        }

        const mapped: PendingUser[] = rawList.map((u: any, idx: number) => ({
          userId: Number(u.UserId ?? u.userId ?? u.no ?? idx + 1),
          no: (p - 1) * PAGE_SIZE + idx + 1,
          namaLengkap: u.NamaLengkap ?? u.namaLengkap ??
            [u.FirstName, u.MiddleName, u.LastName].filter(Boolean).join(' '),
          email: u.Email ?? u.email ?? '-',
          role: u.Role?.RoleName ?? u.Role ?? u.role ?? '-',
          registrationProof: u.RegistrationProof ?? u.registrationProof ?? '',
        }))

        if (summaryData.total === 0) {
          summaryData.totalRows = mapped.length
          summaryData.total = mapped.length
        }
        setSummary(summaryData)
        setUsers(mapped)
        setTotalRows(summaryData.totalRows || mapped.length)
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memuat data'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(page)
  }, [page, fetchData])

  // TS-006: POST /api/pemerintah/users/:userId/approve
  const handleApprove = async (userId: number) => {
    setActionLoading(userId)
    try {
      await api.post(`/api/pemerintah/users/${userId}/approve`)
      showToast('User berhasil disetujui', 'ok')
      fetchData(page)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal approve user'
      showToast(msg, 'err')
    } finally {
      setActionLoading(null)
    }
  }

  // TS-007: POST /api/pemerintah/users/:userId/reject
  const handleReject = async (userId: number) => {
    setActionLoading(userId)
    try {
      await api.post(`/api/pemerintah/users/${userId}/reject`)
      showToast('User berhasil ditolak', 'ok')
      fetchData(page)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gagal reject user'
      showToast(msg, 'err')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <SidebarPemerintah />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Header */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: '#1a1a1a' }}>
              Verifikasi Pendaftar
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Kelola dan verifikasi akun yang menunggu persetujuan
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Summary Cards */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[
                { label: 'Total Pengguna', value: summary.total, icon: <Users size={20} />, color: '#1e6b1e' },
                { label: 'Akun Aktif', value: summary.totalAktif, icon: <UserCheck size={20} />, color: '#166534' },
                { label: 'Akun Ditolak', value: summary.totalDitolak, icon: <UserX size={20} />, color: '#991B1B' },
              ].map(({ label, value, icon, color }) => (
                <div
                  key={label}
                  style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color, marginBottom: '12px' }}>
                    {icon}
                    <span style={{ fontSize: '14px', color: '#666' }}>{label}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '40px', color: '#1a1a1a', lineHeight: 1 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #eee',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: '#1a1a1a' }}>
                Daftar Pending
              </h2>
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#1e6b1e', fontFamily: 'var(--font-display)' }}>
                Memuat...
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
                Tidak ada pengguna yang menunggu verifikasi
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 1.5fr 100px 120px 140px',
                    padding: '12px 24px',
                    background: '#f9fafb',
                    borderBottom: '1px solid #eee',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <span>No</span>
                  <span>Nama</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Bukti</span>
                  <span style={{ textAlign: 'center' }}>Aksi</span>
                </div>

                {/* Table Rows */}
                {users.map((u) => (
                  <div
                    key={u.userId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '48px 1fr 1.5fr 100px 120px 140px',
                      padding: '14px 24px',
                      borderBottom: '1px solid #f0f0f0',
                      alignItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    <span style={{ color: '#888' }}>{u.no}</span>
                    <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{u.namaLengkap}</span>
                    <span style={{ color: '#555' }}>{u.email}</span>
                    <span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          background: '#e8f5e9',
                          color: '#1e6b1e',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {u.role}
                      </span>
                    </span>
                    <span>
                      {u.registrationProof ? (
                        <a
                          href={u.registrationProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e6b1e', fontSize: '13px', fontWeight: 500 }}
                        >
                          <ExternalLink size={14} />
                          Lihat
                        </a>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: '13px' }}>-</span>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleApprove(u.userId)}
                        disabled={actionLoading === u.userId}
                        title="Approve"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 14px',
                          borderRadius: '999px',
                          background: '#1e6b1e',
                          color: 'white',
                          border: 'none',
                          cursor: actionLoading === u.userId ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          opacity: actionLoading === u.userId ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle size={13} />
                        Setujui
                      </button>
                      <button
                        onClick={() => handleReject(u.userId)}
                        disabled={actionLoading === u.userId}
                        title="Reject"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 14px',
                          borderRadius: '999px',
                          background: '#BA1A1A',
                          color: 'white',
                          border: 'none',
                          cursor: actionLoading === u.userId ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          opacity: actionLoading === u.userId ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={13} />
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
                  <p style={{ fontSize: '13px', color: '#888' }}>
                    Menampilkan {users.length} dari {totalRows} data
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e5e5',
                        background: page === 1 ? '#f5f5f5' : 'white',
                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: page === 1 ? 0.5 : 1,
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '14px', color: '#333', fontWeight: 600 }}>
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e5e5',
                        background: page === totalPages ? '#f5f5f5' : 'white',
                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: page === totalPages ? 0.5 : 1,
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            padding: '14px 24px',
            borderRadius: '12px',
            background: toast.type === 'ok' ? '#1e6b1e' : '#BA1A1A',
            color: 'white',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: 9999,
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
