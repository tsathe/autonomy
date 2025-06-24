-- Migration: Add separate complexity fields for resident and faculty
-- This allows both parties to assess complexity independently

-- Add new column for resident complexity assessment
ALTER TABLE evaluations 
ADD COLUMN resident_complexity complexity_level;

-- Rename existing complexity column to faculty_complexity for clarity
ALTER TABLE evaluations 
RENAME COLUMN complexity TO faculty_complexity;

-- Update the schema to reflect that:
-- - resident_complexity: What the resident thought the complexity was
-- - faculty_complexity: What the faculty assessed the complexity as (authoritative)

-- For existing data, we'll assume the current complexity was set by faculty
-- New evaluations will populate both fields as users respond

COMMENT ON COLUMN evaluations.resident_complexity IS 'Complexity level as assessed by the resident';
COMMENT ON COLUMN evaluations.faculty_complexity IS 'Complexity level as assessed by the faculty (authoritative)';
