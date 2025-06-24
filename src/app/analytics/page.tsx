'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getCurrentUserProfile } from '@/lib/supabase'
import { Navigation } from '@/components/layout/navigation'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { Toaster } from 'sonner'

export default function AnalyticsPage() {
  const router = useRouter()

  // Fetch current user
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserProfile
  })

  useEffect(() => {
    if (!isLoading && currentUser && currentUser.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [currentUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-6">
        <AdminDashboard />
      </main>
      <Toaster />
    </div>
  )
}
