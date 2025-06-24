'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getEPAs, getUsersInInstitution, createEvaluation, updateEvaluation, getCurrentUserProfile, mapCustomCaseToEPA, type Evaluation, type EPA, type UserProfile } from '@/lib/supabase'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { HelpCircle, Sparkles, ChevronLeft, ChevronRight, Send, MapPin } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface EvaluationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evaluation?: Evaluation
  mode: 'create' | 'respond' | 'view'
}

const ENTRUSTMENT_LEVELS = [
  { value: 'observation_only', label: 'Observation Only', description: 'Learner observes the activity' },
  { value: 'direct_supervision', label: 'Direct Supervision', description: 'Learner performs with direct, hands-on supervision' },
  { value: 'indirect_supervision', label: 'Indirect Supervision', description: 'Learner performs with indirect supervision readily available' },
  { value: 'practice_ready', label: 'Practice Ready', description: 'Learner can perform independently' }
]

const COMPLEXITY_LEVELS = [
  { value: 'straightforward', label: 'Straightforward' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'complex', label: 'Complex' }
]

export function EvaluationForm({ open, onOpenChange, evaluation, mode }: EvaluationFormProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    resident_id: '',
    faculty_id: '',
    epa_id: '',
    complexity: '' as any,
    resident_entrustment_level: '' as any,
    faculty_entrustment_level: '' as any,
    resident_comment: '',
    faculty_comment: '',
    custom_case_text: '',
    is_custom: false
  })
  const [customCaseTab, setCustomCaseTab] = useState(true)
  const [mappedEPA, setMappedEPA] = useState<{ epa_id: string; suggested_comment: string } | null>(null)
  const [isEpaGridVisible, setIsEpaGridVisible] = useState(false)
  const [facultySearchOpen, setFacultySearchOpen] = useState(false)
  const [facultySearchValue, setFacultySearchValue] = useState("")
  const [selectedFaculty, setSelectedFaculty] = useState<UserProfile | null>(null)

  const queryClient = useQueryClient()

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUserProfile()
        setCurrentUser(user)
        
        if (user && mode === 'create') {
          setFormData(prev => ({ ...prev, resident_id: user.id }))
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    fetchUser()
  }, [mode])

  // Load evaluation data if editing
  useEffect(() => {
    if (evaluation) {
      setFormData({
        resident_id: evaluation.resident_id,
        faculty_id: evaluation.faculty_id,
        epa_id: evaluation.epa_id,
        complexity: evaluation.complexity,
        resident_entrustment_level: evaluation.resident_entrustment_level || '',
        faculty_entrustment_level: evaluation.faculty_entrustment_level || '',
        resident_comment: evaluation.resident_comment || '',
        faculty_comment: evaluation.faculty_comment || '',
        custom_case_text: evaluation.custom_case_text || '',
        is_custom: evaluation.is_custom
      })
      setCustomCaseTab(evaluation.is_custom)
      
      // Skip to appropriate step based on existing data
      if (evaluation.epa_id) {
        setCurrentStep(mode === 'respond' ? 3 : 2)
      }
    }
  }, [evaluation, mode])

  // Fetch EPAs
  const { data: epas = [] } = useQuery({
    queryKey: ['epas'],
    queryFn: getEPAs
  })

  // Fetch faculty in institution
  const { data: faculty = [] } = useQuery({
    queryKey: ['faculty', currentUser?.institution_id],
    queryFn: () => currentUser?.institution_id ? getUsersInInstitution(currentUser.institution_id, 'faculty') : Promise.resolve([]),
    enabled: !!currentUser?.institution_id
  })

  // AI mapping mutation
  const aiMappingMutation = useMutation({
    mutationFn: async (customText: string) => {
      return await mapCustomCaseToEPA(customText, epas)
    },
    onSuccess: (result) => {
      setMappedEPA(result)
      setFormData(prev => ({ 
        ...prev, 
        epa_id: result.epa_id,
        is_custom: true
      }))
      toast.success('EPA mapped successfully!')
    },
    onError: (error) => {
      console.error('AI mapping error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error)
      toast.error(`AI mapping failed: ${errorMessage}`)
    }
  })

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Starting save mutation with data:', data)
      console.log('Mode:', mode)
      console.log('Current user:', currentUser)
      console.log('Evaluation ID:', evaluation?.id)
      
      if (mode === 'create') {
        console.log('Creating new evaluation...')
        const result = await createEvaluation({
          ...data,
          institution_id: currentUser?.institution_id,
          initiated_by: currentUser?.id
        })
        console.log('Create evaluation result:', result)
        return result
      } else {
        console.log('Updating existing evaluation...')
        const result = await updateEvaluation(evaluation!.id, data)
        console.log('Update evaluation result:', result)
        return result
      }
    },
    onSuccess: (data) => {
      console.log('Save mutation success:', data)
      queryClient.invalidateQueries({ queryKey: ['evaluations'] })
      toast.success(mode === 'create' ? 'Evaluation created!' : 'Response submitted!')
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Save evaluation error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error)
      toast.error(`Failed to save evaluation: ${errorMessage}`)
    }
  })

  const handleCustomCaseMapping = () => {
    if (formData.custom_case_text.trim()) {
      aiMappingMutation.mutate(formData.custom_case_text)
    }
  }

  const handleNext = () => {
    console.log('handleNext called, current step:', currentStep)
    if (currentStep < 3) {
      const nextStep = currentStep + 1
      console.log('Moving to step:', nextStep)
      setCurrentStep(nextStep)
    } else {
      console.log('Already at final step, cannot go next')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent submission if we're in create mode and not on the final step
    if (mode === 'create' && currentStep < 3) {
      console.log('Preventing form submission - still in create mode on step', currentStep)
      return
    }
    
    // Validate required fields
    if (mode === 'create') {
      if (!formData.faculty_id) {
        toast.error('Please select a faculty member')
        return
      }
      if (!formData.epa_id) {
        toast.error('Please select an EPA')
        return
      }
      if (!formData.complexity) {
        toast.error('Please select case complexity')
        return
      }
      if (!currentUser?.institution_id) {
        toast.error('Institution information is missing')
        return
      }
    }
    
    const dataToSave = {
      ...formData,
      // Convert empty strings to null for enum fields to avoid database validation errors
      complexity: formData.complexity || null,
      resident_entrustment_level: formData.resident_entrustment_level || null,
      faculty_entrustment_level: formData.faculty_entrustment_level || null,
      // Only set completion timestamps when responding to existing evaluations, not when creating new ones
      ...(mode === 'respond' && currentUser?.role === 'resident' && { resident_completed_at: new Date().toISOString() }),
      ...(mode === 'respond' && currentUser?.role === 'faculty' && { faculty_completed_at: new Date().toISOString() }),
      // Don't set is_completed - it's a generated column in the database
    }
    
    console.log('Attempting to save evaluation with data:', dataToSave)
    console.log('Current user:', currentUser)
    console.log('Mode:', mode)
    
    saveMutation.mutate(dataToSave)
  }

  const isCurrentUserResident = currentUser?.role === 'resident'
  const isCurrentUserFaculty = currentUser?.role === 'faculty'
  const isRespondingAsResident = mode === 'respond' && isCurrentUserResident
  const isRespondingAsFaculty = mode === 'respond' && isCurrentUserFaculty
  const canEdit = mode === 'create' || mode === 'respond'

  const canProceedFromStep1 = formData.epa_id || (formData.custom_case_text && mappedEPA)
  const canProceedFromStep2 = formData.faculty_id && formData.complexity && 
    ((isCurrentUserResident && formData.resident_entrustment_level) || (isCurrentUserFaculty && formData.faculty_entrustment_level))

  const getStepTitle = () => {
    console.log('getStepTitle called for step:', currentStep)
    switch (currentStep) {
      case 1: return 'Select EPA'
      case 2: return 'Evaluation Details'
      case 3: return 'Reflection'
      default: return 'New Evaluation'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Choose the EPA that best matches your case'
      case 2: return 'Provide details about the case and your assessment'
      case 3: return 'Share your thoughts and reflection on this experience'
      default: return 'Create a new EPA-based evaluation'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl truncate">
                {mode === 'create' ? getStepTitle() : mode === 'respond' ? 'Complete Evaluation' : 'View Evaluation'}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1 text-muted-foreground">
                {mode === 'create' ? getStepDescription() : 
                 mode === 'respond' ? 'Complete your part of the evaluation' : 
                 'View evaluation details'}
              </DialogDescription>
            </div>
            
            {mode === 'create' && (
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : step < currentStep 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 flex-1 overflow-y-auto">
          {/* Step 1: EPA Selection */}
          {(currentStep === 1 && mode === 'create') && (
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-1 mb-8">
                  <div className="flex bg-muted rounded-full p-1">
                    <Button
                      type="button"
                      variant={customCaseTab ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCustomCaseTab(true)}
                      className={`min-w-[120px] rounded-full ${customCaseTab ? 'shadow-sm' : ''}`}
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      Smart AI
                    </Button>
                    <Button
                      type="button"
                      variant={!customCaseTab ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCustomCaseTab(false)}
                      className={`min-w-[120px] rounded-full ${!customCaseTab ? 'shadow-sm' : ''}`}
                    >
                      Browse EPAs
                    </Button>
                  </div>
                </div>

                {customCaseTab ? (
                  <div className="space-y-4 min-h-[400px]">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-center mb-3">Describe your case</h3>
                      <p className="text-sm text-muted-foreground mb-4">Our AI will automatically map it to the right EPA</p>
                    </div>
                    
                    <div className="max-w-2xl mx-auto">
                      <div className="flex gap-3 items-center">
                        <Input
                          placeholder="e.g., 'appendectomy for acute appendicitis' or 'hernia repair'"
                          value={formData.custom_case_text}
                          onChange={(e) => setFormData(prev => ({ ...prev, custom_case_text: e.target.value }))}
                          disabled={!canEdit}
                          className="text-base flex-1"
                        />
                        
                        {formData.custom_case_text.trim() && (
                          <Button
                            type="button"
                            onClick={handleCustomCaseMapping}
                            disabled={aiMappingMutation.isPending}
                            variant="secondary"
                            className="shrink-0 h-9 w-9"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {mappedEPA && (
                      <div className="max-w-2xl mx-auto p-4 bg-muted/50 border border-muted rounded-lg">
                        <div className="text-center">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">✓ Matched Successfully!</h4>
                          <p className="text-sm font-medium text-foreground">
                            {epas.find(e => e.id === mappedEPA.epa_id)?.code}: {epas.find(e => e.id === mappedEPA.epa_id)?.title}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 min-h-[400px]">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Select an EPA</h3>
                      <p className="text-sm text-muted-foreground">Choose from the 18 American Board of Surgery EPAs</p>
                    </div>
                    
                    <div className="max-h-[320px] overflow-y-auto">
                      <div className="grid gap-2">
                        {epas.map((epa) => (
                          <button
                            key={epa.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, epa_id: epa.id, is_custom: false }))}
                            disabled={!canEdit}
                            className={`p-3 text-left border rounded-lg hover:bg-muted/50 transition-colors ${
                              formData.epa_id === epa.id ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                          >
                            <div className="font-medium text-sm">{epa.code}: {epa.title}</div>
                            {epa.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{epa.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Evaluation Details */}
          {(currentStep === 2 && mode === 'create') && (
            <div className="space-y-8">
              {/* Faculty Selection - Only for residents */}
              {isCurrentUserResident && (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-xl">Select Faculty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!formData.faculty_id ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Search faculty..."
                          value={facultySearchValue}
                          onChange={(e) => setFacultySearchValue(e.target.value)}
                          disabled={!canEdit}
                          className="w-full"
                        />
                        {facultySearchValue && (
                          <div className="border rounded-lg max-h-40 overflow-y-auto">
                            {faculty
                              .filter((f) => 
                                f.first_name.toLowerCase().includes(facultySearchValue.toLowerCase()) || 
                                f.last_name.toLowerCase().includes(facultySearchValue.toLowerCase())
                              )
                              .map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, faculty_id: f.id }))
                                    setFacultySearchValue("")
                                  }}
                                  className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                                >
                                  <div className="font-medium">{f.first_name} {f.last_name}</div>
                                  {f.department && <div className="text-sm text-muted-foreground">{f.department}</div>}
                                </button>
                              ))}
                            {faculty.filter((f) => 
                              f.first_name.toLowerCase().includes(facultySearchValue.toLowerCase()) || 
                              f.last_name.toLowerCase().includes(facultySearchValue.toLowerCase())
                            ).length === 0 && (
                              <div className="p-3 text-sm text-muted-foreground text-center">
                                No faculty found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-muted/30 border border-muted rounded-lg">
                        <div>
                          <div className="font-medium text-foreground">
                            {faculty.find(f => f.id === formData.faculty_id)?.first_name} {faculty.find(f => f.id === formData.faculty_id)?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {faculty.find(f => f.id === formData.faculty_id)?.department || 'Selected Faculty'}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, faculty_id: '' }))
                            setFacultySearchValue("")
                          }}
                          disabled={!canEdit}
                        >
                          Change
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Case Complexity */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl">Case Complexity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {COMPLEXITY_LEVELS.map((level) => (
                      <Button
                        key={level.value}
                        type="button"
                        variant={formData.complexity === level.value ? "default" : "outline"}
                        size="lg"
                        onClick={() => setFormData(prev => ({ ...prev, complexity: level.value as any }))}
                        className="h-16"
                      >
                        {level.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Entrustment Assessment */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-xl">
                    {isCurrentUserResident ? 'Your Self-Assessment' : 'Faculty Assessment'}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {isCurrentUserResident 
                      ? 'How much supervision do you think you needed?' 
                      : 'How much supervision did you provide?'}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {ENTRUSTMENT_LEVELS.map((level) => (
                      <Button
                        key={level.value}
                        type="button"
                        variant={
                          (isCurrentUserResident && formData.resident_entrustment_level === level.value) ||
                          (isCurrentUserFaculty && formData.faculty_entrustment_level === level.value)
                            ? "default" : "outline"
                        }
                        size="lg"
                        onClick={() => {
                          if (isCurrentUserResident) {
                            setFormData(prev => ({ ...prev, resident_entrustment_level: level.value as any }))
                          } else {
                            setFormData(prev => ({ ...prev, faculty_entrustment_level: level.value as any }))
                          }
                        }}
                        className="h-auto p-4 text-left flex-col items-start"
                      >
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm opacity-70 mt-1">{level.description}</div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Reflection */}
          {(currentStep === 3 || mode === 'respond' || mode === 'view') && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">
                  {isCurrentUserResident ? 'Your Reflection' : 'Faculty Feedback'}
                </CardTitle>
                <p className="text-muted-foreground">
                  {isCurrentUserResident 
                    ? 'Share your thoughts on this experience' 
                    : 'Provide constructive feedback'}
                </p>
              </CardHeader>
              <CardContent>
                {/* Resident Reflection */}
                {(isCurrentUserResident || (mode === 'view' && (evaluation?.is_completed || isCurrentUserResident))) && (
                  <Textarea
                    placeholder="What went well? What would you do differently? What did you learn?"
                    value={formData.resident_comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, resident_comment: e.target.value }))}
                    disabled={!canEdit || (mode === 'respond' && !isRespondingAsResident)}
                    rows={8}
                    className="text-base"
                  />
                )}

                {/* Faculty Feedback */}
                {(isCurrentUserFaculty || (mode === 'view' && (evaluation?.is_completed || isCurrentUserFaculty))) && (
                  <Textarea
                    placeholder="Provide specific, actionable feedback to help the resident improve..."
                    value={formData.faculty_comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, faculty_comment: e.target.value }))}
                    disabled={!canEdit || (mode === 'respond' && !isRespondingAsFaculty)}
                    rows={8}
                    className="text-base"
                  />
                )}

                {/* Hidden feedback message */}
                {mode === 'view' && !evaluation?.is_completed && (
                  <div className="p-6 bg-muted rounded-lg border text-center">
                    <p className="text-base text-muted-foreground">
                      {isCurrentUserResident 
                        ? "Faculty feedback will be visible once the evaluation is complete."
                        : "Resident reflection will be visible once the evaluation is complete."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <DialogFooter className="pt-4 flex-shrink-0 border-t">
            <div className="flex justify-between w-full">
              <div>
                {mode === 'create' && currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrevious} size="sm">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="sm">
                  Cancel
                </Button>
                
                {(() => {
                  console.log('Button render - mode:', mode, 'currentStep:', currentStep, 'canEdit:', canEdit)
                  console.log('Show Next button?', mode === 'create' && currentStep < 3)
                  console.log('Show Submit button?', canEdit && !(mode === 'create' && currentStep < 3))
                  return mode === 'create' && currentStep < 3 ? (
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault()
                        console.log('Next button clicked, current step:', currentStep)
                        handleNext()
                      }}
                      disabled={
                        (currentStep === 1 && !canProceedFromStep1) ||
                        (currentStep === 2 && !canProceedFromStep2)
                      }
                      size="sm"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : canEdit && (
                    <Button type="submit" disabled={saveMutation.isPending} size="sm">
                      {!saveMutation.isPending && (mode === 'create' || mode === 'respond') && (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {saveMutation.isPending ? 'Saving...' : 
                        mode === 'create' ? 
                          (isCurrentUserResident ? 'Send to Faculty' : 'Send to Resident') :
                          'Complete Evaluation'
                      }
                    </Button>
                  )
                })()}
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
