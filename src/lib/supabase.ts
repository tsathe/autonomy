import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on our database schema
export type UserRole = 'resident' | 'faculty' | 'admin'
export type ComplexityLevel = 'straightforward' | 'moderate' | 'complex'
export type EntrustmentLevel = 'observation_only' | 'direct_supervision' | 'indirect_supervision' | 'practice_ready'
export type DomainType = 'preop' | 'intraop' | 'postop'

export interface Institution {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  institution_id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  pgy_year?: number
  department?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface EPA {
  id: string
  code: string
  title: string
  description?: string
  created_at: string
}

export interface Evaluation {
  id: string
  institution_id: string
  resident_id: string
  faculty_id: string
  epa_id: string
  domains: DomainType[]
  resident_complexity?: ComplexityLevel
  faculty_complexity?: ComplexityLevel
  resident_entrustment_level?: EntrustmentLevel
  faculty_entrustment_level?: EntrustmentLevel
  resident_comment?: string
  faculty_comment?: string
  custom_case_text?: string
  is_custom: boolean
  resident_completed_at?: string
  faculty_completed_at?: string
  is_completed: boolean
  initiated_by: string
  created_at: string
  updated_at: string
  // Joined data
  resident?: UserProfile
  faculty?: UserProfile
  epa?: EPA
}

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getCurrentUserProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*, institutions(*)')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

// EPA helpers
export const getEPAs = async () => {
  const { data, error } = await supabase
    .from('epas')
    .select('*')
    .order('code')

  if (error) throw error
  return data
}

// Evaluation helpers
export const getEvaluations = async (filters?: {
  resident_id?: string
  faculty_id?: string
  is_completed?: boolean
}) => {
  let query = supabase
    .from('evaluations')
    .select(`
      *,
      resident:profiles!resident_id(id, first_name, last_name, pgy_year),
      faculty:profiles!faculty_id(id, first_name, last_name),
      epa:epas(code, title)
    `)
    .order('created_at', { ascending: false })

  if (filters?.resident_id) {
    query = query.eq('resident_id', filters.resident_id)
  }
  if (filters?.faculty_id) {
    query = query.eq('faculty_id', filters.faculty_id)
  }
  if (filters?.is_completed !== undefined) {
    query = query.eq('is_completed', filters.is_completed)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const createEvaluation = async (evaluation: Partial<Evaluation>) => {
  const { data, error } = await supabase
    .from('evaluations')
    .insert(evaluation)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateEvaluation = async (id: string, updates: Partial<Evaluation>) => {
  const { data, error } = await supabase
    .from('evaluations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// User helpers
export const getUsersInInstitution = async (institutionId: string, role?: UserRole) => {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('institution_id', institutionId)
    .order('last_name')

  if (role) {
    query = query.eq('role', role)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// AI mapping for custom cases with OpenAI integration
export const mapCustomCaseToEPA = async (customText: string, epas: EPA[]) => {
  try {
    const aiResult = await mapWithOpenAI(customText, epas)
    return aiResult
  } catch (error) {
    console.error('OpenAI mapping failed:', error)
    throw new Error(`AI mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// OpenAI-powered mapping function
const mapWithOpenAI = async (customText: string, epas: EPA[]) => {
  const response = await fetch('/api/map-case-to-epa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customText,
      availableEPAs: epas.map(epa => ({
        id: epa.id,
        code: epa.code,
        title: epa.title,
        description: epa.description
      }))
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to map with OpenAI')
  }

  const result = await response.json()
  return {
    epa_id: result.epaId,
    suggested_comment: result.suggestedComment
  }
}

// CSV export utility function
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Get evaluations by EPA for analytics
export async function getEvaluationsByEPA(epa_id: string, resident_id?: string): Promise<Evaluation[]> {
  const query = supabase
    .from('evaluations')
    .select(`
      *,
      resident:profiles!resident_id (
        id,
        first_name,
        last_name,
        avatar_url,
        role,
        institution_id
      ),
      faculty:profiles!faculty_id (
        id,
        first_name,
        last_name,
        avatar_url,
        role,
        institution_id
      ),
      epa:epas (
        id,
        title,
        description,
        number
      )
    `)
    .eq('epa_id', epa_id)
    .eq('is_completed', true)
    .order('created_at', { ascending: true })

  if (resident_id) {
    query.eq('resident_id', resident_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching evaluations by EPA:', error)
    throw error
  }

  return data || []
}
