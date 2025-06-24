'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatEntrustmentLevel, formatComplexityLevel, getEntrustmentLevelColor, getComplexityLevelColor } from '@/lib/utils'
import { format } from 'date-fns'
import { Eye } from 'lucide-react'

interface FeedSectionProps {
  evaluations: any[]
  onViewEvaluation: (evaluation: any) => void
}

export function FeedSection({ evaluations, onViewEvaluation }: FeedSectionProps) {
  if (evaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
          <CardDescription>Your completed EPA evaluations will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No completed evaluations yet</p>
            <p className="text-sm">Create your first evaluation to get started!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Feed</h2>
        <p className="text-muted-foreground">Recent completed evaluations</p>
      </div>
      
      <div className="space-y-3">
        {evaluations.map((evaluation) => (
          <Card key={evaluation.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{evaluation.epa?.code}</Badge>
                    <span className="font-medium text-sm truncate">{evaluation.epa?.title}</span>
                    <Badge className={getComplexityLevelColor(evaluation.complexity)}>
                      {formatComplexityLevel(evaluation.complexity)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Faculty:</span>
                      <Badge className={getEntrustmentLevelColor(evaluation.faculty_entrustment_level || '')}>
                        {formatEntrustmentLevel(evaluation.faculty_entrustment_level || '')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Self:</span>
                      <Badge className={getEntrustmentLevelColor(evaluation.resident_entrustment_level || '')}>
                        {formatEntrustmentLevel(evaluation.resident_entrustment_level || '')}
                      </Badge>
                    </div>
                    <span>
                      {format(new Date(evaluation.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-muted-foreground">
                    With {evaluation.faculty?.first_name} {evaluation.faculty?.last_name}
                  </div>
                </div>
                
                <Button 
                  onClick={() => onViewEvaluation(evaluation)} 
                  variant="outline" 
                  size="sm"
                  className="ml-4"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
