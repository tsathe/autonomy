'use client'

import { useState } from 'react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { type Evaluation, type EPA } from '@/lib/supabase'
import { formatEntrustmentLevel, getEntrustmentLevelColor } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CompetencyRadialChartProps {
  evaluations: Evaluation[]
  epas: EPA[]
}

export function CompetencyRadialChart({ evaluations, epas }: CompetencyRadialChartProps) {
  // Calculate average entrustment for each EPA
  const epaData = epas.map(epa => {
    const epaEvaluations = evaluations.filter(e => e.epa_id === epa.id)
    
    if (epaEvaluations.length === 0) {
      return {
        epa: epa.code,
        title: epa.title,
        entrustment: 0,
        evaluationCount: 0,
        latestEntrustment: null,
        trend: 'none' as const
      }
    }

    // Calculate average entrustment level
    const avgEntrustment = epaEvaluations.reduce((sum, e) => {
      const level = e.faculty_entrustment_level || e.resident_entrustment_level
      const levelValue = { 
        'observation_only': 1, 
        'direct_supervision': 2, 
        'indirect_supervision': 3, 
        'practice_ready': 4 
      }[level || 'observation_only'] || 1
      return sum + levelValue
    }, 0) / epaEvaluations.length

    // Get latest entrustment for trend calculation
    const sortedEvaluations = epaEvaluations
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    const latestEntrustment = sortedEvaluations[sortedEvaluations.length - 1]
    const previousEntrustment = sortedEvaluations[sortedEvaluations.length - 2]
    
    let trend: 'up' | 'down' | 'stable' | 'none' = 'none'
    if (previousEntrustment && latestEntrustment) {
      const latest = { 
        'observation_only': 1, 
        'direct_supervision': 2, 
        'indirect_supervision': 3, 
        'practice_ready': 4 
      }[latestEntrustment.faculty_entrustment_level || latestEntrustment.resident_entrustment_level || 'observation_only']
      
      const previous = { 
        'observation_only': 1, 
        'direct_supervision': 2, 
        'indirect_supervision': 3, 
        'practice_ready': 4 
      }[previousEntrustment.faculty_entrustment_level || previousEntrustment.resident_entrustment_level || 'observation_only']
      
      if (latest > previous) trend = 'up'
      else if (latest < previous) trend = 'down'
      else trend = 'stable'
    }

    return {
      epa: epa.code,
      title: epa.title,
      entrustment: avgEntrustment,
      evaluationCount: epaEvaluations.length,
      latestEntrustment: latestEntrustment?.faculty_entrustment_level || latestEntrustment?.resident_entrustment_level,
      trend
    }
  })

  // Mock data for now - would come from program settings or PGY-level averages
  const getExpectedLevel = (epaId: string, pgyLevel: number = 3): number => {
    // These would typically come from program curriculum or peer averages
    const expectations: Record<string, number[]> = {
      // [PGY1, PGY2, PGY3, PGY4, PGY5] expected levels
      'EPA-1': [1.5, 2.0, 2.5, 3.0, 3.5], // Inguinal Hernia - common procedure
      'EPA-2': [1.0, 1.5, 2.0, 2.5, 3.0], // Acute Abdomen - complex diagnosis
      'EPA-3': [1.5, 2.0, 2.5, 3.0, 3.5], // Anorectal Disease
      'EPA-4': [2.0, 2.5, 3.0, 3.5, 4.0], // Appendicitis - should master early
      'EPA-5': [1.0, 1.5, 2.0, 2.5, 3.0], // Breast Disease - requires experience
      'EPA-6': [1.0, 1.5, 2.0, 2.5, 3.0], // Colon Disease - complex
      'EPA-7': [1.5, 2.0, 2.5, 3.0, 3.5], // Consultation skills
      'EPA-8': [1.0, 1.5, 2.0, 2.5, 3.0], // Critical Care - advanced
      'EPA-9': [1.5, 2.0, 2.5, 3.0, 3.5], // Endoscopy
      'EPA-10': [1.5, 2.0, 2.5, 3.0, 3.5], // Gallbladder
      'EPA-11': [1.5, 2.0, 2.5, 3.0, 3.5], // Groin Hernia
      'EPA-12': [2.0, 2.5, 3.0, 3.5, 4.0], // Skin neoplasms - should master
      'EPA-13': [1.0, 1.5, 2.0, 2.5, 3.0], // Pancreatitis - complex
      'EPA-14': [1.0, 1.5, 2.0, 2.5, 3.0], // Dialysis access - specialized
      'EPA-15': [1.5, 2.0, 2.5, 3.0, 3.5], // Bowel obstruction
      'EPA-16': [2.0, 2.5, 3.0, 3.5, 4.0], // Soft tissue infections - common
      'EPA-17': [1.0, 1.5, 2.0, 2.5, 3.0], // Thyroid surgery - specialized
      'EPA-18': [1.5, 2.0, 2.5, 3.0, 3.5], // Trauma
    };
    
    const levels = expectations[epaId] || [1.5, 2.0, 2.5, 3.0, 3.5];
    return levels[Math.min(pgyLevel - 1, 4)] || 2.5;
  };

  // Add benchmark data to the chart
  const chartData = epaData.map(epa => ({
    ...epa,
    expected: getExpectedLevel(epa.epa, 3) // Using PGY-3 as default for now
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-2 max-w-xs">
          <div className="font-medium">{label}</div>
          <div className="text-sm text-muted-foreground truncate">{data.title}</div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Entrustment:</span>
            <Badge variant="outline" className="text-xs font-mono">
              {data.entrustment.toFixed(1)}/4
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {data.evaluationCount} evaluation{data.evaluationCount !== 1 ? 's' : ''}
          </div>
          {data.latestEntrustment && (
            <div className="text-xs">
              Latest: {formatEntrustmentLevel(data.latestEntrustment)}
            </div>
          )}
          {data.trend !== 'none' && (
            <div className="flex items-center space-x-1 text-xs">
              {data.trend === 'up' && <><TrendingUp className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">Improving</span></>}
              {data.trend === 'down' && <><TrendingDown className="h-3 w-3 text-rose-500" /><span className="text-rose-500">Declining</span></>}
              {data.trend === 'stable' && <><Minus className="h-3 w-3 text-slate-500" /><span className="text-slate-500">Stable</span></>}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Function to get EPA descriptions
  const getEPADescription = (epaId: string): string => {
    const descriptions: Record<string, string> = {
      'EPA-1': 'Inguinal Hernia Repair',
      'EPA-2': 'Acute Abdomen Management',
      'EPA-3': 'Anorectal Disease Treatment',
      'EPA-4': 'Appendicitis Management',
      'EPA-5': 'Breast Disease Evaluation',
      'EPA-6': 'Colon Disease Management',
      'EPA-7': 'Consultation and Recommendations',
      'EPA-8': 'Critical Care Management',
      'EPA-9': 'Endoscopy Procedures',
      'EPA-10': 'Gallbladder Disease Management',
      'EPA-11': 'Groin Hernia Repair',
      'EPA-12': 'Skin and Soft Tissue Neoplasms',
      'EPA-13': 'Pancreatitis Management',
      'EPA-14': 'Dialysis Access Procedures',
      'EPA-15': 'Small Bowel Obstruction',
      'EPA-16': 'Soft Tissue Infections',
      'EPA-17': 'Thyroid and Parathyroid Surgery',
      'EPA-18': 'Trauma Management'
    };
    
    return descriptions[epaId] || 'Surgical Competency Area';
  };

  return (
    <Tabs defaultValue="chart" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="chart">Wheel</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      
      <TabsContent value="chart" className="space-y-6">
        {/* Main Radial Chart */}
        <div className="h-[500px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
              <defs>
                <linearGradient id="competencyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              
              <PolarGrid 
                className="opacity-30" 
                radialLines={true}
                stroke="#64748b"
              />
              <PolarAngleAxis 
                dataKey="epa" 
                className="text-xs font-medium"
                tick={{ 
                  fontSize: 11, 
                  fontWeight: 500,
                  fill: '#e2e8f0'
                }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 4]} 
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickCount={5}
                className="text-xs"
                axisLine={false}
                tickLine={false}
              />
              <Radar
                name="Entrustment Level"
                dataKey="entrustment"
                stroke="#3b82f6"
                fill="url(#competencyGradient)"
                fillOpacity={0.2}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ 
                  fill: '#3b82f6', 
                  strokeWidth: 2, 
                  r: 5,
                  stroke: '#ffffff'
                }}
                activeDot={{
                  r: 7,
                  fill: '#3b82f6',
                  stroke: '#ffffff',
                  strokeWidth: 2
                }}
              />
              <Radar
                name="Expected Level"
                dataKey="expected"
                stroke="#10b981"
                strokeOpacity={0.5}
                fill="none"
                fillOpacity={0}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 3"
                dot={{ 
                  fill: '#10b981', 
                  fillOpacity: 0.6,
                  strokeWidth: 0, 
                  r: 2.5
                }}
                activeDot={{
                  r: 4,
                  fill: '#10b981',
                  fillOpacity: 0.8,
                  strokeWidth: 0
                }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Simple Stats */}
        <div className="flex justify-center space-x-8 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {chartData.filter(d => d.entrustment >= 3.5).length}
            </div>
            <div className="text-xs text-slate-400">Practice Ready</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {(chartData.reduce((sum, d) => sum + d.entrustment, 0) / chartData.length).toFixed(1)}
            </div>
            <div className="text-xs text-slate-400">Average Entrustment</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {chartData.filter(d => d.evaluationCount > 0).length}
            </div>
            <div className="text-xs text-slate-400">EPAs Measured</div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="details" className="space-y-8">
        {/* Entrustment Scale Guide */}
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Entrustment Scale</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-foreground">Level 1 - Observation Only</div>
                <div className="text-xs text-muted-foreground">Requires complete supervision</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-foreground">Level 2 - Direct Supervision</div>
                <div className="text-xs text-muted-foreground">Supervisor actively involved</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-foreground">Level 3 - Indirect Supervision</div>
                <div className="text-xs text-muted-foreground">Supervisor readily available</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-foreground">Level 4 - Practice Ready</div>
                <div className="text-xs text-muted-foreground">Independent practice capable</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-card rounded-lg p-6 border text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {chartData.filter(d => d.entrustment >= 3.5).length}
            </div>
            <div className="text-sm text-foreground mb-1">Practice Ready</div>
            <div className="text-xs text-muted-foreground">EPAs at Level 4</div>
          </div>
          <div className="bg-card rounded-lg p-6 border text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {(chartData.reduce((sum, d) => sum + d.entrustment, 0) / chartData.length).toFixed(1)}
            </div>
            <div className="text-sm text-foreground mb-1">Average Score</div>
            <div className="text-xs text-muted-foreground">Across all EPAs</div>
          </div>
          <div className="bg-card rounded-lg p-6 border text-center">
            <div className="text-3xl font-bold text-foreground mb-2">
              {Math.round((chartData.filter(d => d.evaluationCount > 0).length / 18) * 100)}%
            </div>
            <div className="text-sm text-foreground mb-1">Coverage</div>
            <div className="text-xs text-muted-foreground">{chartData.filter(d => d.evaluationCount > 0).length} of 18 EPAs</div>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="space-y-6">
          {/* Needs Improvement */}
          {chartData.filter(d => d.evaluationCount > 0 && d.entrustment < 2.5).length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-6 border border-red-200 dark:border-red-800/30">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                Needs Focused Attention
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartData
                  .filter(d => d.evaluationCount > 0 && d.entrustment < 2.5)
                  .map(epa => (
                    <Card key={epa.epa}>
                      <CardHeader>
                        <CardTitle>
                          {getEPADescription(epa.epa)}
                          <Badge variant="outline" className="text-xs font-mono ml-2">
                            {epa.epa}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>
                          <div className="text-xs text-red-600 dark:text-red-400">
                            Current: Level {epa.entrustment.toFixed(1)} • {epa.evaluationCount} evaluations
                          </div>
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Progressing Well */}
          {chartData.filter(d => d.evaluationCount > 0 && d.entrustment >= 2.5 && d.entrustment < 3.5).length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800/30">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                Progressing Well
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartData
                  .filter(d => d.evaluationCount > 0 && d.entrustment >= 2.5 && d.entrustment < 3.5)
                  .map(epa => (
                    <Card key={epa.epa}>
                      <CardHeader>
                        <CardTitle>
                          {getEPADescription(epa.epa)}
                          <Badge variant="outline" className="text-xs font-mono ml-2">
                            {epa.epa}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Current: Level {epa.entrustment.toFixed(1)} • {epa.evaluationCount} evaluations
                          </div>
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Practice Ready */}
          {chartData.filter(d => d.entrustment >= 3.5).length > 0 && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6 border border-green-200 dark:border-green-800/30">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                Practice Ready
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartData
                  .filter(d => d.entrustment >= 3.5)
                  .map(epa => (
                    <Card key={epa.epa}>
                      <CardHeader>
                        <CardTitle>
                          {getEPADescription(epa.epa)}
                          <Badge variant="outline" className="text-xs font-mono ml-2">
                            {epa.epa}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Current: Level {epa.entrustment.toFixed(1)} • {epa.evaluationCount} evaluations
                          </div>
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Not Yet Evaluated */}
          {chartData.filter(d => d.evaluationCount === 0).length > 0 && (
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <div className="w-3 h-3 bg-muted-foreground rounded-full mr-3"></div>
                Not Yet Evaluated
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartData
                  .filter(d => d.evaluationCount === 0)
                  .map(epa => (
                    <Card key={epa.epa}>
                      <CardHeader>
                        <CardTitle>
                          {getEPADescription(epa.epa)}
                          <Badge variant="outline" className="text-xs font-mono ml-2">
                            {epa.epa}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>
                          <div className="text-xs text-muted-foreground">
                            Ready for first evaluation
                          </div>
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
