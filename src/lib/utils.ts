import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format entrustment level for display
export const formatEntrustmentLevel = (level: string) => {
  const levels = {
    observation_only: 'Observation Only',
    direct_supervision: 'Direct Supervision',
    indirect_supervision: 'Indirect Supervision',
    practice_ready: 'Practice Ready'
  }
  return levels[level as keyof typeof levels] || level
}

// Format complexity level for display
export const formatComplexityLevel = (level: string) => {
  const levels = {
    straightforward: 'Straightforward',
    moderate: 'Moderate',
    complex: 'Complex'
  }
  return levels[level as keyof typeof levels] || level
}

// Format domain for display
export const formatDomain = (domain: string) => {
  const domains = {
    preop: 'Pre-operative',
    intraop: 'Intra-operative',
    postop: 'Post-operative'
  }
  return domains[domain as keyof typeof domains] || domain
}

// Get entrustment level color
export const getEntrustmentLevelColor = (level: string) => {
  const colors = {
    observation_only: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    direct_supervision: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    indirect_supervision: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    practice_ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
  return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

// Get complexity level color
export const getComplexityLevelColor = (level: string) => {
  const colors = {
    straightforward: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    moderate: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    complex: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  }
  return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

// Export data to CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle arrays and objects
        if (Array.isArray(value)) {
          return `"${value.join('; ')}"`
        }
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value)}"`
        }
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '')
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Centralized avatar utility - ensures consistent avatars across the app
export const getAvatarUrl = (userId?: string, customUrl?: string, style: string = 'avataaars') => {
  if (!userId) return undefined
  
  // Use custom avatar URL if provided
  if (customUrl) return customUrl
  
  // Fallback to generated avatar
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}&backgroundColor=transparent`
}
