import type { Evaluation } from './supabase'

export function exportEvaluationsToCSV(evaluations: Evaluation[], filename: string = 'evaluations.csv') {
  if (evaluations.length === 0) {
    alert('No evaluations to export')
    return
  }

  // Define all possible fields including hidden ones
  const headers = [
    'ID',
    'Created At',
    'Status',
    'Resident Name',
    'Resident Email', 
    'Faculty Name',
    'Faculty Email',
    'EPA Code',
    'EPA Title',
    'Custom Case Text',
    'Domains',
    'Resident Entrustment Level',
    'Faculty Entrustment Level',
    'Resident Complexity',
    'Faculty Complexity',
    'Resident Feedback',
    'Faculty Feedback',
    'Resident Additional Comments',
    'Faculty Additional Comments',
    'Updated At'
  ]

  // Convert evaluations to CSV rows
  const rows = evaluations.map(evaluation => [
    evaluation.id,
    evaluation.created_at,
    evaluation.is_completed ? 'completed' : 'pending',
    `${evaluation.resident?.first_name || ''} ${evaluation.resident?.last_name || ''}`.trim(),
    evaluation.resident?.email || '',
    `${evaluation.faculty?.first_name || ''} ${evaluation.faculty?.last_name || ''}`.trim(),
    evaluation.faculty?.email || '',
    evaluation.epa?.code || '',
    evaluation.epa?.title || '',
    evaluation.custom_case_text || '',
    evaluation.domains?.join('; ') || '',
    evaluation.resident_entrustment_level || '',
    evaluation.faculty_entrustment_level || '',
    evaluation.resident_complexity || '',
    evaluation.faculty_complexity || '',
    evaluation.resident_comment || '',
    evaluation.faculty_comment || '',
    '', // resident additional comments - not in current schema
    '', // faculty additional comments - not in current schema
    evaluation.updated_at || ''
  ])

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringField = String(field || '')
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`
        }
        return stringField
      }).join(',')
    )
  ].join('\n')

  // Create and trigger download
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
