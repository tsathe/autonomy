'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEvaluations, getEPAs, type UserProfile, type Evaluation } from '@/lib/supabase'
import { formatEntrustmentLevel, getEntrustmentLevelColor } from '@/lib/utils'
import { TrendingUp, Target, Award, BookOpen } from 'lucide-react'
import { CompetencyRadialChart } from './competency-radial-chart'
import { LearningCurveChart } from './learning-curve-chart'

interface AnalyticsDashboardProps {
  user: UserProfile
}

export function AnalyticsDashboard({ user }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('6m')

  // Fetch evaluations and EPAs
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => getEvaluations()
  })

  const { data: epas = [] } = useQuery({
    queryKey: ['epas'],
    queryFn: getEPAs
  })

  // Filter evaluations for current user
  const userEvaluations = (evaluations as Evaluation[]).filter((evaluation: Evaluation) => 
    evaluation.resident_id === user.id && evaluation.is_completed
  )

  // Calculate key metrics
  const totalEvaluations = userEvaluations.length
  const uniqueEPAs = new Set(userEvaluations.map((e: Evaluation) => e.epa_id)).size
  const averageEntrustment = userEvaluations.length > 0 
    ? userEvaluations.reduce((sum: number, e: Evaluation) => {
        const level = e.faculty_entrustment_level || e.resident_entrustment_level
        const levelValue = { 
          'observation_only': 1, 
          'direct_supervision': 2, 
          'indirect_supervision': 3, 
          'practice_ready': 4 
        }[level || 'observation_only'] || 1
        return sum + levelValue
      }, 0) / userEvaluations.length
    : 0

  const practiceReadyCount = userEvaluations.filter((evaluation: Evaluation) => 
    evaluation.faculty_entrustment_level === 'practice_ready' || 
    evaluation.resident_entrustment_level === 'practice_ready'
  ).length

  return (
    <div className="space-y-6 max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your surgical competency progress across all EPAs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvaluations}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EPAs Covered</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEPAs}/18</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">{Math.round((uniqueEPAs/18) * 100)}%</span> coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Entrustment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEntrustment.toFixed(1)}/4</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className={`text-xs ${getEntrustmentLevelColor(
                averageEntrustment >= 3.5 ? 'practice_ready' :
                averageEntrustment >= 2.5 ? 'indirect_supervision' :
                averageEntrustment >= 1.5 ? 'direct_supervision' : 'observation_only'
              )}`}>
                {formatEntrustmentLevel(
                  averageEntrustment >= 3.5 ? 'practice_ready' :
                  averageEntrustment >= 2.5 ? 'indirect_supervision' :
                  averageEntrustment >= 1.5 ? 'direct_supervision' : 'observation_only'
                )}
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Ready</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practiceReadyCount}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{practiceReadyCount}</span> procedures mastered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Competency Radial Chart - The Wheel of Autonomy */}
        <Card>
          <CardHeader>
            <CardTitle>Wheel of Autonomy</CardTitle>
            <CardDescription>
              Your entrustment levels across all 18 American Board of Surgery EPAs. 
              A complete circle indicates mastery of all competencies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompetencyRadialChart 
              evaluations={userEvaluations} 
              epas={epas}
            />
          </CardContent>
        </Card>
      </div>

      {/* Learning Curves Section */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Progression</CardTitle>
          <CardDescription>
            Track your entrustment level improvements over time for each EPA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LearningCurveChart 
            evaluations={userEvaluations} 
            epas={epas}
            timeRange={timeRange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
