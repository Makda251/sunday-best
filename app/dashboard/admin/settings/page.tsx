'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)

      // Load settings
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('*')
        .single()

      if (settings) {
        setEmailNotificationsEnabled(settings.email_notifications_enabled ?? true)
      }

      setLoading(false)
    }

    init()
  }, [router, supabase])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Upsert settings (insert or update)
      const { error: upsertError } = await supabase
        .from('admin_settings')
        .upsert({
          id: 1, // Single settings row
          email_notifications_enabled: emailNotificationsEnabled,
          updated_at: new Date().toISOString(),
        })

      if (upsertError) {
        throw upsertError
      }

      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure your admin dashboard preferences
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {/* Email Notifications Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Email Notifications
            </h2>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="email-notifications"
                    type="checkbox"
                    checked={emailNotificationsEnabled}
                    onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="email-notifications" className="font-medium text-gray-700 cursor-pointer">
                    Enable order notification emails
                  </label>
                  <p className="text-gray-500">
                    Receive an email notification when a new order is placed. Email will be sent to{' '}
                    <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                      {process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'asmesmarketplace@gmail.com'}
                    </span>
                  </p>
                </div>
              </div>

              {emailNotificationsEnabled && (
                <div className="ml-7 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You will receive an email for each new order placed.
                    If this becomes overwhelming, you can disable notifications and check the admin dashboard regularly instead.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Additional Settings Sections (Future) */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            More Settings Coming Soon
          </h2>
          <p className="text-sm text-gray-600">
            Additional configuration options will be added here in future updates.
          </p>
        </div>
      </div>
    </div>
  )
}
