'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getCurrentUserProfile } from '@/lib/supabase'
import { EvaluationForm } from '@/components/evaluations/evaluation-form'
import { EvaluationView } from '@/components/evaluations/evaluation-view'
import { Sidebar } from '@/components/layout/sidebar'
import { FeedSection } from '@/components/dashboard/feed-section'
import { InboxSection } from '@/components/dashboard/inbox-section'
import { PendingSection } from '@/components/dashboard/pending-section'
import { Home, Inbox, Clock, BarChart3 } from 'lucide-react'

// Analytics components (keeping the existing analytics)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEntrustmentLevel, formatComplexityLevel, formatDomain, exportToCSV } from '@/lib/utils'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { Button } from '@/components/ui/button'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'
import { Download } from 'lucide-react'
import { format } from 'date-fns'

export function ResidentDashboard() {
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

  // Fetch evaluations
  const { data: allEvaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations', currentUser?.id],
    queryFn: () => currentUser ? getEvaluations({ resident_id: currentUser.id }) : [],
    enabled: !!currentUser
  })

  // Categorize evaluations
  const completedEvaluations = allEvaluations.filter(evaluation => evaluation.is_completed)
  
  const inboxEvaluations = allEvaluations.filter(evaluation => 
    !evaluation.is_completed && 
    evaluation.initiated_by !== currentUser?.id && 
    !evaluation.resident_completed_at
  )
  
  const sentToFacultyEvaluations = allEvaluations.filter(evaluation => 
    !evaluation.is_completed && 
    evaluation.initiated_by === currentUser?.id && 
    !evaluation.faculty_completed_at
  )

  // Analytics data
  const entrustmentTrends = completedEvaluations.map((evaluation, index) => ({
    evaluation: index + 1,
    resident: evaluation.resident_entrustment_level === 'practice_ready' ? 4 : 
              evaluation.resident_entrustment_level === 'indirect_supervision' ? 3 :
              evaluation.resident_entrustment_level === 'direct_supervision' ? 2 : 1,
    faculty: evaluation.faculty_entrustment_level === 'practice_ready' ? 4 : 
             evaluation.faculty_entrustment_level === 'indirect_supervision' ? 3 :
             evaluation.faculty_entrustment_level === 'direct_supervision' ? 2 : 1,
    date: format(new Date(evaluation.created_at), 'MMM dd')
  }))

  const complexityDistribution = completedEvaluations.reduce((acc, evaluation) => {
    acc[evaluation.complexity] = (acc[evaluation.complexity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const complexityChartData = Object.entries(complexityDistribution).map(([complexity, count]) => ({
    complexity: formatComplexityLevel(complexity),
    count
  }))

  // Handlers
  const handleNewEvaluation = () => {
    setSelectedEvaluation(null)
    setFormMode('create')
    setShowEvaluationForm(true)
  }

  const handleRespondToEvaluation = (evaluation: any) => {
    setSelectedEvaluation(evaluation)
    setFormMode('respond')
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
      Complexity: formatComplexityLevel(evaluation.complexity),
      'Resident Level': formatEntrustmentLevel(evaluation.resident_entrustment_level || ''),
      'Faculty Level': formatEntrustmentLevel(evaluation.faculty_entrustment_level || ''),
      'Resident Comment': evaluation.resident_comment,
      'Faculty Comment': evaluation.faculty_comment
    }))
    
    exportToCSV(exportData, 'epa-evaluations.csv')
  }

  // Sidebar items
  const sidebarItems = [
    {
      id: 'feed',
      label: 'Feed',
      icon: Home,
      count: completedEvaluations.length
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      count: inboxEvaluations.length
    },
    {
      id: 'pending',
      label: 'Pending',
      icon: Clock,
      count: sentToFacultyEvaluations.length
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3
    }
  ]

  // Analytics component
  const AnalyticsSection = () => (
    <AnalyticsDashboard user={currentUser!} />
  )
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'inbox':
        return <InboxSection evaluations={inboxEvaluations} onRespondToEvaluation={handleRespondToEvaluation} />
      case 'pending':
        return <PendingSection evaluations={sentToFacultyEvaluations} onViewEvaluation={handleViewEvaluation} />
      case 'analytics':
        return <AnalyticsSection />
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
