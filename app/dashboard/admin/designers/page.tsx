'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DesignerInfo {
  name: string
  count: number
  productIds: string[]
}

export default function DesignerManagementPage() {
  const [designers, setDesigners] = useState<DesignerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDesigner, setEditingDesigner] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [updating, setUpdating] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/')
      return
    }

    fetchDesigners()
  }

  const fetchDesigners = async () => {
    setLoading(true)

    // Get all products with designers
    const { data: products } = await supabase
      .from('products')
      .select('id, designer')
      .not('designer', 'is', null)

    if (products) {
      // Group by designer name
      const designerMap = new Map<string, DesignerInfo>()

      products.forEach(product => {
        const name = product.designer!
        if (designerMap.has(name)) {
          const existing = designerMap.get(name)!
          existing.count++
          existing.productIds.push(product.id)
        } else {
          designerMap.set(name, {
            name,
            count: 1,
            productIds: [product.id]
          })
        }
      })

      // Convert to array and sort by count
      const designerList = Array.from(designerMap.values())
        .sort((a, b) => b.count - a.count)

      setDesigners(designerList)
    }

    setLoading(false)
  }

  const handleRenameDesigner = async (oldName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingDesigner(null)
      setNewName('')
      return
    }

    setUpdating(true)

    const designer = designers.find(d => d.name === oldName)
    if (!designer) return

    // Update all products with this designer name
    const { error } = await supabase
      .from('products')
      .update({ designer: newName.trim() })
      .in('id', designer.productIds)

    if (error) {
      alert(`Error updating designer: ${error.message}`)
    } else {
      alert(`Successfully renamed "${oldName}" to "${newName}" (${designer.count} products updated)`)
      setEditingDesigner(null)
      setNewName('')
      fetchDesigners()
    }

    setUpdating(false)
  }

  const handleDeleteDesigner = async (designerName: string) => {
    if (!confirm(`Remove designer name "${designerName}" from all products? The products will still exist but without a designer name.`)) {
      return
    }

    setUpdating(true)

    const designer = designers.find(d => d.name === designerName)
    if (!designer) return

    // Set designer to null for all these products
    const { error } = await supabase
      .from('products')
      .update({ designer: null })
      .in('id', designer.productIds)

    if (error) {
      alert(`Error removing designer: ${error.message}`)
    } else {
      alert(`Successfully removed designer name from ${designer.count} products`)
      fetchDesigners()
    }

    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Designer Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage designer names across all products. You can rename or remove designer names.
          </p>
        </div>

        {designers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No designers found in the system.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {designers.map((designer) => (
                  <tr key={designer.name}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingDesigner === designer.name ? (
                        <input
                          type="text"
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full max-w-xs"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="New designer name"
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{designer.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {designer.count} {designer.count === 1 ? 'product' : 'products'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingDesigner === designer.name ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRenameDesigner(designer.name)}
                            disabled={updating}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingDesigner(null)
                              setNewName('')
                            }}
                            disabled={updating}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setEditingDesigner(designer.name)
                              setNewName(designer.name)
                            }}
                            disabled={updating}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDeleteDesigner(designer.name)}
                            disabled={updating}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
