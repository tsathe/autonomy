-- Fix complexity field constraints
-- Make both resident_complexity and faculty_complexity nullable
-- since they should only be set when the respective person completes their evaluation

-- Remove NOT NULL constraint from faculty_complexity
ALTER TABLE evaluations 
ALTER COLUMN faculty_complexity DROP NOT NULL;

-- Ensure resident_complexity is also nullable (it should be by default since we added it)
-- This line might not be necessary but just to be safe:
ALTER TABLE evaluations 
ALTER COLUMN resident_complexity DROP NOT NULL;
