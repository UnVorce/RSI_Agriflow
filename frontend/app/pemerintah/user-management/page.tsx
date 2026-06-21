'use client'

import { useState, useEffect, useCallback } from 'react'
import SidebarPemerintah from '@/components/pemerintah/SideBar'
import TopBar from '@/components/layout/TopBar'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { api, ApiError } from '@/lib/api'

interface UserItem {
  no: number
  userId: number
  namaLengkap: string
  email: string
  role: string
  createdAt: string
}

interface UsersResponse {
  users: UserItem[]
  totalRows: number
}

type Tab = 'Active' | 'Rejected'
const PAGE_SIZE = 5

export default function UserManagementPage() {
  const [tab, setTab] = useState<Tab>('Active')
  const [users, setUsers] = useState<UserItem[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Edit modal
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [editNama, setEditNama] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [resettingPw, setResettingPw] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE))

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async (t: Tab, p: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get<UsersResponse>(`/api/pemerintah/users/list?status=${t}&page=${p}&pageSize=${PAGE_SIZE}`)
      if (res.data) {
        setUsers(res.data.users ?? [])
        setTotalRows(res.data.totalRows ?? 0)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(tab, page)
  }, [tab, page, fetchData])

  function handleTabChange(t: Tab) {
    setTab(t)
    setPage(1)
  }

  function openEditModal(u: UserItem) {
    setEditingUser(u)
    setEditNama(u.namaLengkap)
    setEditEmail(u.email)
    setEditRole(u.role)
    setNewPassword('')
    setSaving(false)
    setResettingPw(false)
  }

  async function handleSaveEdit() {
    if (!editingUser) return
    setSaving(true)
    try {
      await api.patch(`/api/pemerintah/users/${editingUser.userId}/edit`, {
        namaLengkap: editNama,
        email: editEmail,
        roleName: editRole,
      })
      showToast('User berhasil diperbarui', 'ok')
      setEditingUser(null)
      fetchData(tab, page)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Gagal menyimpan', 'err')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!editingUser) return
    setResettingPw(true)
    try {
      const res = await api.post<{ newPassword: string }>(`/api/pemerintah/users/${editingUser.userId}/reset-password`)
      if (res.data?.newPassword) {
        setNewPassword(res.data.newPassword)
        showToast('Password berhasil di-reset', 'ok')
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Gagal reset password', 'err')
    } finally {
      setResettingPw(false)
    }
  }

  async function handleToggleStatus(u: UserItem) {
    try {
      const res = await api.post<{ newStatus: string }>(`/api/pemerintah/users/${u.userId}/toggle-status`)
      const newStatus = res.data?.newStatus
      showToast(`User ${newStatus === 'Active' ? 'diaktifkan' : 'dinonaktifkan'}`, 'ok')
      fetchData(tab, page)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Gagal mengubah status', 'err')
    }
  }

  const tabBtn = (active: boolean) => ({
    flex: 1,
    padding: '10px 0',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '10px',
    background: active ? 'white' : 'transparent',
    color: active ? '#1a1a1a' : '#888',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.2s',
  } as React.CSSProperties)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <SidebarPemerintah />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />

        <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: '#1a1a1a' }}>
              User Management
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Kelola akun pengguna aktif dan ditolak
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: '#FEE2E2', color: '#991B1B', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '12px', padding: '4px', width: '280px' }}>
            <button style={tabBtn(tab === 'Active')} onClick={() => handleTabChange('Active')}>Aktif</button>
            <button style={tabBtn(tab === 'Rejected')} onClick={() => handleTabChange('Rejected')}>Ditolak</button>
          </div>

          {/* Table */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: '#1a1a1a' }}>
                {tab === 'Active' ? 'Akun Aktif' : 'Akun Ditolak'}
              </h2>
            </div>

            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#1e6b1e', fontFamily: 'var(--font-display)' }}>
                Memuat...
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
                {tab === 'Active' ? 'Tidak ada akun aktif' : 'Tidak ada akun ditolak'}
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '48px 1.2fr 1.8fr 120px 160px 140px', padding: '12px 24px', background: '#f9fafb', borderBottom: '1px solid #eee', fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>No</span>
                  <span>Nama</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Tanggal Buat</span>
                  <span style={{ textAlign: 'center' }}>Aksi</span>
                </div>

                {/* Rows */}
                {users.map((u) => (
                  <div key={u.userId} style={{ display: 'grid', gridTemplateColumns: '48px 1.2fr 1.8fr 120px 160px 140px', padding: '14px 24px', borderBottom: '1px solid #f0f0f0', alignItems: 'center', fontSize: '14px' }}>
                    <span style={{ color: '#888' }}>{u.no}</span>
                    <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{u.namaLengkap}</span>
                    <span style={{ color: '#555' }}>{u.email}</span>
                    <span>
                      <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#e8f5e9', color: '#1e6b1e', fontSize: '12px', fontWeight: 600 }}>{u.role}</span>
                    </span>
                    <span style={{ color: '#555', fontSize: '13px' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}</span>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => openEditModal(u)} style={{ padding: '5px 12px', borderRadius: '999px', border: '1.5px solid #1e6b1e', background: 'transparent', color: '#1e6b1e', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleToggleStatus(u)} style={{ padding: '5px 12px', borderRadius: '999px', border: '1.5px solid #BA1A1A', background: 'transparent', color: '#BA1A1A', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        {tab === 'Active' ? 'Nonaktifkan' : 'Aktifkan'}
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
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ width: 32, height: 32, borderRadius: '8px', border: '1.5px solid #ddd', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: '#333' }}>{page}/{totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ width: 32, height: 32, borderRadius: '8px', border: '1.5px solid #ddd', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.5 : 1 }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </main>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div onClick={() => setEditingUser(null)} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', padding: '36px 40px', width: '460px', maxWidth: '94vw', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: '#1a1a1a', margin: 0 }}>
                Edit User
              </h2>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={20} color="#888" />
              </button>
            </div>

            {/* ID */}
            <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: '#f5f5f5', fontSize: '14px', color: '#555' }}>
              ID: {editingUser.userId}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Nama */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: '#1a1a1a', marginBottom: '6px' }}>Nama Lengkap</label>
                <input type="text" value={editNama} onChange={e => setEditNama(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none' }} />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: '#1a1a1a', marginBottom: '6px' }}>Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none' }} />
              </div>

              {/* Role */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: '#1a1a1a', marginBottom: '6px' }}>Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', background: 'white' }}>
                  <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                  <option value="PENGECER">PENGECER</option>
                </select>
              </div>

              {/* Reset Password */}
              <div>
                <button onClick={handleResetPassword} disabled={resettingPw} style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #D97706', background: 'transparent', color: '#D97706', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px', cursor: resettingPw ? 'not-allowed' : 'pointer', opacity: resettingPw ? 0.6 : 1 }}>
                  {resettingPw ? 'Memproses...' : 'Reset Password'}
                </button>
                {newPassword && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', background: '#fefce8', border: '1px solid #fde047', fontSize: '13px', color: '#713f12' }}>
                    Password baru: <strong>{newPassword}</strong>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #ddd', background: 'white', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Batal</button>
                <button onClick={handleSaveEdit} disabled={saving || !editNama || !editEmail} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: saving || !editNama || !editEmail ? '#6B8F6B' : '#1e6b1e', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', cursor: saving || !editNama || !editEmail ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '32px', right: '32px', padding: '14px 24px', borderRadius: '12px', background: toast.type === 'ok' ? '#1e6b1e' : '#BA1A1A', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
