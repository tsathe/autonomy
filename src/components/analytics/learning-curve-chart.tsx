'use client'

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { type Evaluation, type EPA } from '@/lib/supabase'
import { formatEntrustmentLevel } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, TrendingUp, Filter } from 'lucide-react'

interface LearningCurveChartProps {
  evaluations: Evaluation[]
  epas: EPA[]
  timeRange: string
}

export function LearningCurveChart({ evaluations, epas, timeRange }: LearningCurveChartProps) {
  const [selectedEPA, setSelectedEPA] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'individual' | 'overlay'>('individual')

  // Filter evaluations by time range
  const filteredEvaluations = useMemo(() => {
    const now = new Date()
    let cutoffDate: Date

    switch (timeRange) {
      case '1m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case '3m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case '6m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case '1y':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        return evaluations
    }

    return evaluations.filter(e => new Date(e.created_at) >= cutoffDate)
  }, [evaluations, timeRange])

  // Get EPAs with evaluations
  const epasWithEvaluations = epas.filter(epa => 
    filteredEvaluations.some(e => e.epa_id === epa.id)
  )

  // Prepare chart data
  const chartData = useMemo(() => {
    if (viewMode === 'individual' && selectedEPA) {
      // Show single EPA progression
      const epaEvaluations = filteredEvaluations
        .filter(e => e.epa_id === selectedEPA)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      return epaEvaluations.map((evaluation, index) => {
        const entrustmentLevel = evaluation.faculty_entrustment_level || evaluation.resident_entrustment_level
        const levelValue = { 
          'observation_only': 1, 
          'direct_supervision': 2, 
          'indirect_supervision': 3, 
          'practice_ready': 4 
        }[entrustmentLevel || 'observation_only'] || 1

        return {
          date: new Date(evaluation.created_at).toLocaleDateString(),
          evaluation: index + 1,
          entrustment: levelValue,
          entrustmentLabel: formatEntrustmentLevel(entrustmentLevel || 'observation_only'),
          facultyComment: evaluation.faculty_comment,
          complexity: evaluation.faculty_complexity || evaluation.resident_complexity
        }
      })
    } else if (viewMode === 'overlay') {
      // Show multiple EPAs overlaid
      const dates = [...new Set(filteredEvaluations.map(e => e.created_at.split('T')[0]))]
        .sort()
        .slice(-20) // Last 20 evaluation dates

      return dates.map(date => {
        const dayEvaluations = filteredEvaluations.filter(e => e.created_at.startsWith(date))
        const dataPoint: any = { date: new Date(date).toLocaleDateString() }

        epasWithEvaluations.forEach(epa => {
          const epaEvals = dayEvaluations.filter(e => e.epa_id === epa.id)
          if (epaEvals.length > 0) {
            const avgEntrustment = epaEvals.reduce((sum, e) => {
              const level = e.faculty_entrustment_level || e.resident_entrustment_level
              return sum + ({ 
                'observation_only': 1, 
                'direct_supervision': 2, 
                'indirect_supervision': 3, 
                'practice_ready': 4 
              }[level || 'observation_only'] || 1)
            }, 0) / epaEvals.length
            
            dataPoint[epa.code] = avgEntrustment
          }
        })

        return dataPoint
      }).filter(point => Object.keys(point).length > 1) // Only include dates with evaluations
    }

    return []
  }, [filteredEvaluations, selectedEPA, viewMode, epasWithEvaluations])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2">
          <div className="font-medium">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.dataKey === 'entrustment' ? 'Entrustment:' : `${entry.dataKey}:`}
              </span>
              <Badge variant="outline" className="text-xs">
                {entry.value.toFixed(1)}/4
              </Badge>
            </div>
          ))}
          {payload[0]?.payload?.entrustmentLabel && (
            <div className="text-xs text-muted-foreground">
              {payload[0].payload.entrustmentLabel}
            </div>
          )}
          {payload[0]?.payload?.complexity && (
            <div className="text-xs text-muted-foreground">
              Complexity: {payload[0].payload.complexity}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Colors for different EPAs
  const colors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
  ]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={viewMode} onValueChange={(value: 'individual' | 'overlay') => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual EPA</SelectItem>
              <SelectItem value="overlay">Multiple EPAs</SelectItem>
            </SelectContent>
          </Select>

          {viewMode === 'individual' && (
            <Select value={selectedEPA || ''} onValueChange={setSelectedEPA}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select EPA..." />
              </SelectTrigger>
              <SelectContent>
                {epasWithEvaluations.map(epa => (
                  <SelectItem key={epa.id} value={epa.id}>
                    {epa.code} - {epa.title.substring(0, 30)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{chartData.length} data points</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto opacity-50" />
              <p>No evaluation data for the selected time range</p>
              <p className="text-sm">
                {viewMode === 'individual' 
                  ? selectedEPA 
                    ? 'Try selecting a different EPA or time range'
                    : 'Please select an EPA to view'
                  : 'Try expanding the time range'
                }
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 4]} 
                className="text-xs"
                tickCount={5}
                label={{ value: 'Entrustment Level', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {viewMode === 'individual' ? (
                <Line
                  type="monotone"
                  dataKey="entrustment"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              ) : (
                <>
                  <Legend />
                  {epasWithEvaluations.slice(0, 10).map((epa, index) => (
                    <Line
                      key={epa.id}
                      type="monotone"
                      dataKey={epa.code}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 4 }}
                      connectNulls={false}
                    />
                  ))}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Individual EPA Insights */}
      {viewMode === 'individual' && selectedEPA && chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-sm font-medium">Progress Trend</div>
            <div className="text-xs text-muted-foreground">
              {chartData.length > 1 ? (
                chartData[chartData.length - 1].entrustment > chartData[0].entrustment ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Improving
                  </Badge>
                ) : chartData[chartData.length - 1].entrustment < chartData[0].entrustment ? (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Declining
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Stable
                  </Badge>
                )
              ) : (
                'Insufficient data'
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Current Level</div>
            <div className="text-xs">
              {chartData.length > 0 && (
                <Badge variant="outline">
                  {chartData[chartData.length - 1].entrustmentLabel}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Total Evaluations</div>
            <div className="text-xs text-muted-foreground">
              {chartData.length} evaluations
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
