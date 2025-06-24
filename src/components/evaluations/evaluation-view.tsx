'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, Award, Activity, Calendar, User, Clock, BookOpen, Layers, MessageSquare } from 'lucide-react'
import { Evaluation, getEvaluationsByEPA, EntrustmentLevel, ComplexityLevel } from '@/lib/supabase'
import { format } from 'date-fns'
import { formatEntrustmentLevel, formatComplexityLevel, getEntrustmentLevelColor, getComplexityLevelColor, getAvatarUrl } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface EvaluationViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evaluation: Evaluation | null
}

// Convert entrustment level to numeric value
function getEntrustmentLevelValue(level: string | null): number {
  if (!level) return 0
  switch (level) {
    case 'observation_only': return 1
    case 'direct_supervision': return 2
    case 'indirect_supervision': return 3
    case 'practice_ready': return 4
    default: return 0
  }
}

// Calculate trend based on current and historical data
function calculateTrend(currentLevel: number, historicalData: any[]) {
  if (historicalData.length < 2) return { trend: 'stable' as const, change: 0 }
  
  const sortedData = historicalData
    .filter(e => e.faculty_entrustment_level)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  
  if (sortedData.length < 2) return { trend: 'stable' as const, change: 0 }
  
  const previousLevel = getEntrustmentLevelValue(sortedData[sortedData.length - 2].faculty_entrustment_level)
  const change = currentLevel - previousLevel
  
  if (change > 0) return { trend: 'up', change }
  if (change < 0) return { trend: 'down', change: Math.abs(change) }
  return { trend: 'stable', change: 0 }
}

// Simple Progress component
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 ${className}`}>
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      ></div>
    </div>
  )
}

export function EvaluationView({ open, onOpenChange, evaluation }: EvaluationViewProps) {
  // Don't render anything if no evaluation data
  if (!evaluation) return null
  if (!evaluation) return null

  // Fetch historical data for this EPA and resident combination
  const { data: historicalEvaluations = [] } = useQuery({
    queryKey: ['epa-evaluations', evaluation.epa_id, evaluation.resident_id],
    queryFn: () => getEvaluationsByEPA(evaluation.epa_id, evaluation.resident_id),
    enabled: !!evaluation.epa_id && !!evaluation.resident_id && open
  })

  // Calculate analytics
  const totalEvaluationsForEPA = historicalEvaluations.length
  const averageEntrustmentLevel = historicalEvaluations.length > 0 ? 
    historicalEvaluations
      .filter(e => e.faculty_entrustment_level)
      .reduce((sum, e) => sum + getEntrustmentLevelValue(e.faculty_entrustment_level!), 0) / 
    historicalEvaluations.filter(e => e.faculty_entrustment_level).length : 0

  const trend = evaluation.faculty_entrustment_level ? 
    calculateTrend(getEntrustmentLevelValue(evaluation.faculty_entrustment_level), historicalEvaluations) : 
    { trend: 'stable' as const, change: 0 }

  const progressPercentage = evaluation.faculty_entrustment_level ? 
    ((getEntrustmentLevelValue(evaluation.faculty_entrustment_level) - 1) / 3) * 100 : 0

  // Prepare learning curve data
  const learningCurveData = historicalEvaluations
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((evalData, index) => ({
      evaluation: index + 1,
      date: format(new Date(evalData.created_at), 'MMM dd'),
      faculty: getEntrustmentLevelValue(evalData.faculty_entrustment_level || null),
      resident: getEntrustmentLevelValue(evalData.resident_entrustment_level || null),
      facultyLabel: formatEntrustmentLevel(evalData.faculty_entrustment_level || ''),
      residentLabel: formatEntrustmentLevel(evalData.resident_entrustment_level || ''),
      complexity: evalData.faculty_complexity || evalData.resident_complexity
    }))

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-900 p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`Evaluation ${data.evaluation} - ${data.date}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'faculty' ? 'Faculty: ' : 'Resident: '}
              {entry.dataKey === 'faculty' ? data.facultyLabel : data.residentLabel}
            </p>
          ))}
          {data.complexity && (
            <p className="text-xs text-muted-foreground mt-1">
              Complexity: {formatComplexityLevel(data.complexity)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[60vw] !max-w-[60vw] h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 space-y-6">
          <DialogTitle className="text-xl font-semibold">Evaluation Details</DialogTitle>
          
          {/* Unified Header Section */}
          <div className="border-b pb-6">
            {/* Participants */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(evaluation.resident?.id)} />
                  <AvatarFallback>{evaluation.resident?.first_name?.[0]}{evaluation.resident?.last_name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  {evaluation.resident?.first_name} {evaluation.resident?.last_name}
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(evaluation.faculty?.id)} />
                  <AvatarFallback>{evaluation.faculty?.first_name?.[0]}{evaluation.faculty?.last_name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium">
                  Dr. {evaluation.faculty?.last_name}
                </span>
              </div>
            </div>

            {/* EPA and Case Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{evaluation.epa?.title || `EPA-${evaluation.epa_id}`}</Badge>
                {evaluation.is_custom && <Badge variant="secondary">Custom Case</Badge>}
              </div>
              <div className="text-sm font-medium text-foreground">
                {evaluation.is_custom ? evaluation.custom_case_text : evaluation.epa?.description}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(evaluation.created_at), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Resident and Faculty Sections */}
          <div className="py-6 border-b">            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Resident Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getAvatarUrl(evaluation.resident?.id)} />
                    <AvatarFallback className="text-xs">{evaluation.resident?.first_name?.[0]}{evaluation.resident?.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold text-foreground">Resident Assessment</h3>
                </div>
                
                {/* Assessment Levels */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3">
                  {evaluation.resident_entrustment_level && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Entrustment Level</span>
                      </div>
                      <Badge className={getEntrustmentLevelColor(evaluation.resident_entrustment_level)}>
                        {formatEntrustmentLevel(evaluation.resident_entrustment_level)}
                      </Badge>
                    </div>
                  )}
                  {evaluation.resident_complexity && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Case Complexity</span>
                      </div>
                      <Badge className={getComplexityLevelColor(evaluation.resident_complexity)}>
                        {formatComplexityLevel(evaluation.resident_complexity)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">Reflection</h4>
                  </div>
                  <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 rounded-r-lg p-3">
                    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {evaluation.resident_comment || (
                        <span className="italic text-muted-foreground/70">
                          No reflection provided
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Faculty Section */}
              <div className="space-y-6 lg:border-l lg:border-gray-200 dark:lg:border-gray-700 lg:pl-8">
                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getAvatarUrl(evaluation.faculty?.id)} />
                    <AvatarFallback className="text-xs">{evaluation.faculty?.first_name?.[0]}{evaluation.faculty?.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold text-foreground">Faculty Assessment</h3>
                </div>
                
                {/* Assessment Levels */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3">
                  {evaluation.faculty_entrustment_level && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Entrustment Level</span>
                      </div>
                      <Badge className={getEntrustmentLevelColor(evaluation.faculty_entrustment_level)}>
                        {formatEntrustmentLevel(evaluation.faculty_entrustment_level)}
                      </Badge>
                    </div>
                  )}
                  {evaluation.faculty_complexity && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Case Complexity</span>
                      </div>
                      <Badge className={getComplexityLevelColor(evaluation.faculty_complexity)}>
                        {formatComplexityLevel(evaluation.faculty_complexity)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">Feedback</h4>
                  </div>
                  <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 rounded-r-lg p-3">
                    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {evaluation.faculty_comment || (
                        <span className="italic text-muted-foreground/70">
                          No feedback provided
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="py-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Performance Analytics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Progress Indicator */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Entrustment Progress</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {Math.round(progressPercentage)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Level {getEntrustmentLevelValue(evaluation.faculty_entrustment_level || '')} of 4
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Observation</span>
                    <span>Practice Ready</span>
                  </div>
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {trend.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {trend.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {trend.trend === 'stable' && <Minus className="h-4 w-4 text-gray-600" />}
                  <span className="text-sm font-medium">Performance Trend</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {trend.trend === 'up' && (
                      <span className="text-green-600">+{trend.change}</span>
                    )}
                    {trend.trend === 'down' && (
                      <span className="text-red-600">-{trend.change}</span>
                    )}
                    {trend.trend === 'stable' && (
                      <span className="text-gray-600">Stable</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trend.trend === 'stable' ? 'Consistent performance' : `Level${trend.change > 1 ? 's' : ''} since last evaluation`}
                  </div>
                </div>
              </div>

              {/* EPA Statistics */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">EPA Experience</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">{totalEvaluationsForEPA}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalEvaluationsForEPA === 0 ? 'First evaluation for this EPA' : 
                     totalEvaluationsForEPA === 1 ? 'Second evaluation for this EPA' :
                     `Total evaluations for this EPA`}
                  </div>
                </div>
              </div>

              {/* Average Performance */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium">Average Level</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-foreground">
                    {averageEntrustmentLevel > 0 ? averageEntrustmentLevel.toFixed(1) : 
                     totalEvaluationsForEPA === 0 ? '—' : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalEvaluationsForEPA === 0 ? 'Baseline evaluation' : 
                     totalEvaluationsForEPA === 1 ? 'Based on current evaluation' :
                     'Across all EPA evaluations'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Learning Curve */}
          <div className="py-6 border-b">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Learning Progression</h2>
              <span className="text-sm text-muted-foreground">({evaluation.epa?.title || `EPA-${evaluation.epa_id}`})</span>
            </div>
            
            {learningCurveData.length > 1 ? (
              <>
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={learningCurveData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        label={{ value: 'Evaluation Timeline', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        domain={[0, 4]} 
                        className="text-xs"
                        tickCount={5}
                        label={{ value: 'Entrustment Level', angle: -90, position: 'insideLeft' }}
                        tickFormatter={(value) => {
                          const levels = ['', 'Observation', 'Direct', 'Indirect', 'Practice Ready']
                          return levels[value] || ''
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="faculty" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                        name="Faculty Assessment"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resident" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        strokeDasharray="5 5"
                        name="Resident Self-Assessment"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Learning Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Progress Trend</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">
                        {trend.trend === 'up' && <span className="text-green-600">↗ Improving</span>}
                        {trend.trend === 'down' && <span className="text-red-600">↘ Declining</span>}
                        {trend.trend === 'stable' && <span className="text-blue-600">→ Stable</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {trend.change > 0 ? `+${trend.change} level${trend.change > 1 ? 's' : ''}` : 'Consistent performance'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">EPA Experience</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">{totalEvaluationsForEPA}</div>
                      <div className="text-xs text-muted-foreground">
                        Total evaluations
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium">Current Level</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">
                        {getEntrustmentLevelValue(evaluation.faculty_entrustment_level || '')} / 4
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatEntrustmentLevel(evaluation.faculty_entrustment_level || '')}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">First Evaluation</p>
                <p className="text-sm">
                  This is the baseline evaluation for this EPA. Future evaluations will show progress over time.
                </p>
              </div>
            )}
          </div>

          {/* Assessment Variance */}
          {evaluation.resident_entrustment_level && 
           evaluation.faculty_entrustment_level && 
           getEntrustmentLevelValue(evaluation.resident_entrustment_level) !== getEntrustmentLevelValue(evaluation.faculty_entrustment_level) && (
            <div className="py-4 mb-6 px-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Assessment Variance: {Math.abs(getEntrustmentLevelValue(evaluation.faculty_entrustment_level) - getEntrustmentLevelValue(evaluation.resident_entrustment_level))} level{Math.abs(getEntrustmentLevelValue(evaluation.faculty_entrustment_level) - getEntrustmentLevelValue(evaluation.resident_entrustment_level)) > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-1">
                  <span>Resident:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatEntrustmentLevel(evaluation.resident_entrustment_level)}
                  </Badge>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <span>Faculty:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatEntrustmentLevel(evaluation.faculty_entrustment_level)}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {getEntrustmentLevelValue(evaluation.faculty_entrustment_level) > getEntrustmentLevelValue(evaluation.resident_entrustment_level) 
                  ? '↗ Faculty assessed higher capability than resident self-assessment'
                  : '↙ Resident self-assessed higher than faculty assessment'
                }
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
