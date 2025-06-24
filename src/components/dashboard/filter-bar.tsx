import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, Filter, ArrowUpDown, ChevronDown } from 'lucide-react'
import { FC, useState } from 'react'

interface FacultyOption {
  id: string
  last_name?: string | null
  first_name?: string | null
}

interface FilterBarProps {
  dateFilter: string | null
  setDateFilter: (v: string | null) => void
  facultyFilter: string | null
  setFacultyFilter: (v: string | null) => void
  epaFilter: string | null
  setEpaFilter: (v: string | null) => void
  sortAsc: boolean
  toggleSort: () => void
  sortBy: 'date' | 'entrustment'
  setSortBy: (v: 'date' | 'entrustment') => void
  uniqueFaculty: FacultyOption[]
  uniqueEpas: string[]
  onExport?: () => void
}

export const FilterBar: FC<FilterBarProps> = ({
  dateFilter,
  setDateFilter,
  facultyFilter,
  setFacultyFilter,
  epaFilter,
  setEpaFilter,
  sortAsc,
  toggleSort,
  sortBy,
  setSortBy,
  uniqueFaculty,
  uniqueEpas,
  onExport,
}) => {
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const hasActiveFilters = dateFilter || facultyFilter || epaFilter

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-3 gap-1 bg-muted/50 hover:bg-muted"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3 w-3" />
            Filter
            {hasActiveFilters && <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
              {[dateFilter, facultyFilter, epaFilter].filter(Boolean).length}
            </span>}
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-3 gap-1 bg-muted/50 hover:bg-muted"
            onClick={() => setShowSort(!showSort)}
          >
            <ArrowUpDown className="h-3 w-3" />
            Sort
            <ChevronDown className={`h-3 w-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
          </Button>

          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              className="px-2 h-8 text-xs"
              onClick={() => {
                setDateFilter(null)
                setFacultyFilter(null)
                setEpaFilter(null)
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-1"
            onClick={onExport}
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-2 p-3 bg-muted/30 rounded-md">
          <Input
            type="date"
            className="w-36 h-8"
            value={dateFilter ?? ''}
            onChange={(e) => setDateFilter(e.target.value || null)}
            placeholder="Filter by date"
          />
          <Select
            value={facultyFilter ?? 'all'}
            onValueChange={(v) => setFacultyFilter(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="All Faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculty</SelectItem>
              {uniqueFaculty.map((f) => (
                <SelectItem key={f.id} value={f.id}>{`Dr. ${f.last_name}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={epaFilter ?? 'all'}
            onValueChange={(v) => setEpaFilter(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="All EPA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All EPA</SelectItem>
              {uniqueEpas.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showSort && (
        <div className="flex items-center gap-2 mt-2 p-3 bg-muted/30 rounded-md">
          <Select value={sortBy} onValueChange={(v: 'date' | 'entrustment') => setSortBy(v)}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="entrustment">Sort by Entrustment Level</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3"
            onClick={toggleSort}
          >
            {sortAsc ? 'Ascending ↑' : 'Descending ↓'}
          </Button>
        </div>
      )}
    </div>
  )
}
