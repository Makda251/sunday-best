'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type Application = {
  id: string
  full_name: string
  email: string
  phone: string
  city: string
  state: string
  photos: string[]
  status: 'pending' | 'contacted' | 'rejected'
  notes: string | null
  created_at: string
}

function statusStyle(status: string) {
  if (status === 'contacted') return { background: '#DCFCE7', color: '#166534' }
  if (status === 'rejected') return { background: '#FEE2E2', color: '#991B1B' }
  return { background: '#FEF3C7', color: '#92400E' }
}

export default function AdminSellersPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }
      fetchApplications()
    }
    init()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('seller_applications')
      .select('*')
      .order('created_at', { ascending: false })
    setApplications(data || [])
    const notes: Record<string, string> = {}
    ;(data || []).forEach((a: Application) => { notes[a.id] = a.notes || '' })
    setNoteEdits(notes)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: Application['status']) => {
    setSavingId(id)
    await supabase.from('seller_applications').update({ status }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setSavingId(null)
  }

  const saveNotes = async (id: string) => {
    setSavingId(id)
    const notes = noteEdits[id] || ''
    await supabase.from('seller_applications').update({ notes }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, notes } : a))
    setSavingId(null)
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <Image src={lightboxPhoto} alt="Dress photo" width={800} height={1000} className="rounded-2xl object-contain max-h-[85vh] w-full" />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/dashboard/admin" className="text-sm font-medium hover:opacity-70 transition" style={{ color: '#6B6B6B' }}>
                ← Admin
              </Link>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>
              Seller Applications
              {pendingCount > 0 && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  {pendingCount} new
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#6B6B6B' }}>People interested in selling on KemisHouse</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl p-6" style={{ border: '1px solid #EBEBEB' }}>
                <div className="h-4 rounded-full mb-3" style={{ backgroundColor: '#F7F7F7', width: '40%' }} />
                <div className="h-3 rounded-full" style={{ backgroundColor: '#F7F7F7', width: '60%' }} />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ border: '1px solid #EBEBEB' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FDF0EA' }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C4622D' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: '#111111' }}>No applications yet</p>
            <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>Share kemishouse.com/sell to get your first applicants</p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: '#F7F7F7', color: '#6B6B6B', border: '1px solid #EBEBEB' }}>
              kemishouse.com/sell
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EBEBEB' }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-bold" style={{ color: '#111111' }}>{app.full_name}</h3>
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                          style={statusStyle(app.status)}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: '#6B6B6B' }}>
                        <a href={`mailto:${app.email}`} className="hover:underline" style={{ color: '#C4622D' }}>{app.email}</a>
                        <span>{app.phone}</span>
                        <span>{app.city}, {app.state}</span>
                        <span style={{ color: '#9A9A9A' }}>{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Status actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {app.status !== 'contacted' && (
                        <button
                          onClick={() => updateStatus(app.id, 'contacted')}
                          disabled={savingId === app.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50"
                          style={{ backgroundColor: '#DCFCE7', color: '#166534' }}
                        >
                          Mark contacted
                        </button>
                      )}
                      {app.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(app.id, 'rejected')}
                          disabled={savingId === app.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50"
                          style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                        >
                          Reject
                        </button>
                      )}
                      {app.status !== 'pending' && (
                        <button
                          onClick={() => updateStatus(app.id, 'pending')}
                          disabled={savingId === app.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-50"
                          style={{ backgroundColor: '#F7F7F7', color: '#6B6B6B', border: '1px solid #EBEBEB' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Photos */}
                  {app.photos && app.photos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#9A9A9A' }}>Dress photos</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {app.photos.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setLightboxPhoto(url)}
                            className="flex-shrink-0 rounded-xl overflow-hidden transition-transform hover:scale-105"
                            style={{ width: 72, height: 96, border: '1px solid #EBEBEB', backgroundColor: '#F7F7F7' }}
                          >
                            <Image
                              src={url}
                              alt={`Dress ${i + 1}`}
                              width={72}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#9A9A9A' }}>Notes</p>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={noteEdits[app.id] ?? app.notes ?? ''}
                        onChange={e => setNoteEdits(prev => ({ ...prev, [app.id]: e.target.value }))}
                        placeholder="Add a note (e.g. 'Emailed 3/12, waiting on response')"
                        className="flex-1 px-3 py-2 text-sm rounded-xl resize-none focus:outline-none transition"
                        style={{ border: '1.5px solid #EBEBEB', backgroundColor: '#F7F7F7', color: '#111111' }}
                        onFocus={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#fff' }}
                        onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.background = '#F7F7F7' }}
                      />
                      {(noteEdits[app.id] ?? '') !== (app.notes ?? '') && (
                        <button
                          onClick={() => saveNotes(app.id)}
                          disabled={savingId === app.id}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white self-end disabled:opacity-50 transition hover:opacity-90"
                          style={{ backgroundColor: '#C4622D' }}
                        >
                          {savingId === app.id ? 'Saving...' : 'Save'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
