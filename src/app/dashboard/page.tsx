'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserProfile, type UserProfile } from '@/lib/supabase'
import { ResidentDashboard } from '@/components/dashboard/resident-dashboard'
import { FacultyDashboard } from '@/components/dashboard/faculty-dashboard'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import ModeToggle from '@/components/mode-toggle'
import { Toaster } from 'sonner'

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userProfile = await getCurrentUserProfile()
        if (!userProfile) {
          router.push('/')
          return
        }
        setUser(userProfile)
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'resident':
        return <ResidentDashboard />
      case 'faculty':
        return <FacultyDashboard />
      case 'admin':
        return <AdminDashboard />
      default:
        return <div>Invalid user role</div>
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
      {renderDashboard()}
      <Toaster />
      {/* Theme Toggle - Fixed Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50">
        <ModeToggle />
      </div>
    </div>
  )
}
