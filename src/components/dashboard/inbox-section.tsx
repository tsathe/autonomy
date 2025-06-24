'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { MessageSquare, Clock } from 'lucide-react'

interface InboxSectionProps {
  evaluations: any[]
  onRespondToEvaluation: (evaluation: any) => void
}

export function InboxSection({ evaluations, onRespondToEvaluation }: InboxSectionProps) {
  if (evaluations.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inbox</h2>
          <p className="text-muted-foreground">Evaluations requiring your response</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-sm">No evaluations waiting for your response</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inbox</h2>
        <p className="text-muted-foreground">{evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} requiring your response</p>
      </div>
      
      <div className="space-y-3">
        {evaluations.map((evaluation) => (
          <Card key={evaluation.id} className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{evaluation.epa?.code}</Badge>
                    <span className="font-medium text-sm truncate">{evaluation.epa?.title}</span>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    From {evaluation.faculty?.first_name} {evaluation.faculty?.last_name} • 
                    {format(new Date(evaluation.created_at), 'MMM dd, yyyy')}
                  </div>
                  
                  {evaluation.faculty_comment && (
                    <div className="text-sm bg-muted/50 p-2 rounded border-l-2 border-l-muted-foreground/20">
                      <p className="font-medium text-muted-foreground mb-1">Faculty Note:</p>
                      <p>{evaluation.faculty_comment}</p>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={() => onRespondToEvaluation(evaluation)} 
                  className="ml-4"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Respond
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
