-- Fix foreign key constraints to point to profiles instead of user_profiles

-- Drop existing foreign key constraints
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_resident_id_fkey;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_faculty_id_fkey;
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_initiated_by_fkey;

-- Add new foreign key constraints pointing to profiles table
ALTER TABLE evaluations 
ADD CONSTRAINT evaluations_resident_id_fkey 
FOREIGN KEY (resident_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE evaluations 
ADD CONSTRAINT evaluations_faculty_id_fkey 
FOREIGN KEY (faculty_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE evaluations 
ADD CONSTRAINT evaluations_initiated_by_fkey 
FOREIGN KEY (initiated_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify the constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='evaluations';
