'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getCurrentUserProfile, getUsersInInstitution, exportToCSV } from '@/lib/supabase'
import { EvaluationForm } from '@/components/evaluations/evaluation-form'
import { EvaluationView } from '@/components/evaluations/evaluation-view'
import { Sidebar } from '@/components/layout/sidebar'
import { FeedSection } from '@/components/dashboard/feed-section'
import { AdminAnalytics } from '@/components/dashboard/admin-analytics'
import { UserManagement } from '@/components/dashboard/user-management'
import { Home, BarChart3, Users, Settings } from 'lucide-react'
import { format } from 'date-fns'

export function AdminDashboard() {
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)
  const [showEvaluationView, setShowEvaluationView] = useState(false)
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null)
  const [formMode, setFormMode] = useState<'create' | 'respond' | 'view'>('create')
  const [activeSection, setActiveSection] = useState('feed')

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserProfile
  })

  // Fetch all evaluations in institution
  const { data: allEvaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', 'admin', currentUser?.institution_id],
    queryFn: () => currentUser ? getEvaluations({ institution_id: currentUser.institution_id }) : [],
    enabled: !!currentUser?.institution_id
  })

  // Fetch all users in institution
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', currentUser?.institution_id],
    queryFn: () => currentUser?.institution_id ? getUsersInInstitution(currentUser.institution_id) : [],
    enabled: !!currentUser?.institution_id
  })

  // Categorize evaluations
  console.log('AdminDashboard allEvaluations', allEvaluations)
  const completedEvaluations = allEvaluations.filter(evaluation => evaluation.is_completed)
  const pendingEvaluations = allEvaluations.filter(evaluation => !evaluation.is_completed)

  const handleNewEvaluation = () => {
    setSelectedEvaluation(null)
    setFormMode('create')
    setShowEvaluationForm(true)
  }

  const handleViewEvaluation = (evaluation: any) => {
    setSelectedEvaluation(evaluation)
    setShowEvaluationView(true)
  }

  const handleExportData = () => {
    const exportData = completedEvaluations.map(evaluation => ({
      Date: format(new Date(evaluation.created_at), 'yyyy-MM-dd'),
      EPA: evaluation.epa?.code,
      'EPA Title': evaluation.epa?.title,
      'Resident Name': `${evaluation.resident?.first_name} ${evaluation.resident?.last_name}`,
      'PGY Year': evaluation.resident?.pgy_year,
      'Faculty Name': `${evaluation.faculty?.first_name} ${evaluation.faculty?.last_name}`,
      'Faculty Complexity': evaluation.faculty_complexity,
      'Resident Complexity': evaluation.resident_complexity,
      'Resident Entrustment': evaluation.resident_entrustment_level || '',
      'Faculty Entrustment': evaluation.faculty_entrustment_level || '',
      'Resident Comment': evaluation.resident_comment,
      'Faculty Comment': evaluation.faculty_comment,
      'Custom Case': evaluation.custom_case_text || ''
    }))

    exportToCSV(exportData, `institution-evaluations-${format(new Date(), 'yyyy-MM-dd')}`)
  }

  // Sidebar items
  const sidebarItems = [
    {
      id: 'feed',
      label: 'All Evaluations',
      icon: Home,
      count: completedEvaluations.length
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      count: allUsers.length
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'analytics':
        return <AdminAnalytics evaluations={allEvaluations} allUsers={allUsers} onExport={handleExportData} />
      case 'users':
        return <UserManagement />
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Institution Settings</h2>
              <p className="text-muted-foreground">Manage institution-wide settings and preferences</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </div>
          </div>
        )
      default:
        return <FeedSection evaluations={completedEvaluations} onViewEvaluation={handleViewEvaluation} />
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        items={sidebarItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onNewEvaluation={handleNewEvaluation}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl pt-16 lg:pt-3">
          {renderContent()}
        </div>
      </main>

      {/* Evaluation Form Modal */}
      <EvaluationForm
        open={showEvaluationForm}
        onOpenChange={setShowEvaluationForm}
        evaluation={selectedEvaluation}
        mode={formMode}
      />

      {/* Evaluation View Modal */}
      <EvaluationView
        open={showEvaluationView}
        onOpenChange={setShowEvaluationView}
        evaluation={selectedEvaluation}
      />
    </div>
  )
}
