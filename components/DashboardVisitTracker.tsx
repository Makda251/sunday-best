'use client'

import { useEffect } from 'react'

type DashboardVisitTrackerProps = {
  role: 'seller' | 'admin'
}

export default function DashboardVisitTracker({ role }: DashboardVisitTrackerProps) {
  useEffect(() => {
    // Mark dashboard as visited when component mounts
    const key = `${role}_dashboard_last_visit`
    localStorage.setItem(key, new Date().toISOString())

    // Dispatch custom event to notify navbar
    window.dispatchEvent(new Event('dashboard-visited'))
  }, [role])

  return null
}
