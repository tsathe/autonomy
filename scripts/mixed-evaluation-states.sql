-- Create evaluations with mixed completion states for test users
-- This will populate inbox, pending, and completed sections

-- Get institution ID (assuming General Hospital)
WITH institution_data AS (
  SELECT id as institution_id FROM institutions LIMIT 1
),
-- Get test users
user_data AS (
  SELECT 
    id, email, first_name, last_name, role,
    CASE 
      WHEN email = 'resident1@autonomy.test' THEN 1
      WHEN email = 'resident2@autonomy.test' THEN 2
      WHEN email = 'resident3@autonomy.test' THEN 3
      WHEN email = 'faculty1@autonomy.test' THEN 1
      WHEN email = 'faculty2@autonomy.test' THEN 2
      WHEN email = 'faculty3@autonomy.test' THEN 3
    END as user_num
  FROM profiles 
  WHERE email IN (
    'resident1@autonomy.test', 'resident2@autonomy.test', 'resident3@autonomy.test',
    'faculty1@autonomy.test', 'faculty2@autonomy.test', 'faculty3@autonomy.test'
  )
),
-- Get some EPAs
epa_data AS (
  SELECT id as epa_id, code, row_number() OVER () as epa_num
  FROM epas 
  LIMIT 10
)

-- Insert mixed evaluation states
INSERT INTO evaluations (
  institution_id, resident_id, faculty_id, epa_id, custom_case_text, is_custom, domains,
  resident_complexity, faculty_complexity, resident_entrustment_level, faculty_entrustment_level,
  resident_comment, faculty_comment, resident_completed_at, faculty_completed_at, initiated_by, created_at
)
SELECT 
  i.institution_id,
  r.id as resident_id,
  f.id as faculty_id,
  e.epa_id,
  CASE 
    WHEN eval_type = 1 THEN 'Completed laparoscopic cholecystectomy case'
    WHEN eval_type = 2 THEN 'Faculty-initiated hernia repair evaluation'
    WHEN eval_type = 3 THEN 'Resident-initiated appendectomy case'
    WHEN eval_type = 4 THEN 'New trauma evaluation - pending responses'
  END as custom_case_text,
  true as is_custom,
  ARRAY['intraop']::domain_type[] as domains,
  CASE 
    WHEN eval_type = 1 THEN 'moderate'::complexity_level
    WHEN eval_type = 2 THEN 'straightforward'::complexity_level
    WHEN eval_type = 3 THEN 'complex'::complexity_level
    ELSE NULL
  END as resident_complexity,
  CASE 
    WHEN eval_type = 1 THEN 'moderate'::complexity_level
    WHEN eval_type = 2 THEN 'straightforward'::complexity_level
    WHEN eval_type = 3 THEN 'complex'::complexity_level
    ELSE NULL
  END as faculty_complexity,
  CASE 
    WHEN eval_type IN (1, 3) THEN 'indirect_supervision'::entrustment_level
    ELSE NULL
  END as resident_entrustment_level,
  CASE 
    WHEN eval_type IN (1, 2) THEN 'indirect_supervision'::entrustment_level
    ELSE NULL
  END as faculty_entrustment_level,
  CASE 
    WHEN eval_type = 1 THEN 'I performed the procedure with minimal guidance and felt confident throughout.'
    WHEN eval_type = 3 THEN 'This was challenging but I managed most steps independently. Would appreciate feedback.'
    ELSE NULL
  END as resident_comment,
  CASE 
    WHEN eval_type = 1 THEN 'Excellent technique and decision-making. Ready for more complex cases.'
    WHEN eval_type = 2 THEN 'Please provide your self-assessment for this procedure.'
    ELSE NULL
  END as faculty_comment,
  CASE 
    WHEN eval_type IN (1, 3) THEN NOW() - INTERVAL '5 days' - INTERVAL '1 hour' * (random() * 120)
    ELSE NULL
  END as resident_completed_at,
  CASE 
    WHEN eval_type IN (1, 2) THEN NOW() - INTERVAL '3 days' - INTERVAL '1 hour' * (random() * 72)
    ELSE NULL
  END as faculty_completed_at,
  CASE 
    WHEN eval_type IN (1, 3, 4) THEN r.id
    WHEN eval_type = 2 THEN f.id
  END as initiated_by,
  NOW() - INTERVAL '1 week' - INTERVAL '1 hour' * (random() * 168) as created_at

FROM institution_data i
CROSS JOIN user_data r
CROSS JOIN user_data f  
CROSS JOIN epa_data e
CROSS JOIN generate_series(1, 4) eval_type
WHERE r.role = 'resident' 
  AND f.role = 'faculty'
  AND r.user_num <= 3
  AND f.user_num <= 3
  AND e.epa_num <= 4;

-- Insert additional completed evaluations for analytics
WITH institution_data AS (
  SELECT id as institution_id FROM institutions LIMIT 1
),
user_data AS (
  SELECT 
    id, email, first_name, last_name, role,
    CASE 
      WHEN email = 'resident1@autonomy.test' THEN 1
      WHEN email = 'resident2@autonomy.test' THEN 2
      WHEN email = 'resident3@autonomy.test' THEN 3
      WHEN email = 'faculty1@autonomy.test' THEN 1
      WHEN email = 'faculty2@autonomy.test' THEN 2
      WHEN email = 'faculty3@autonomy.test' THEN 3
    END as user_num
  FROM profiles 
  WHERE email IN (
    'resident1@autonomy.test', 'resident2@autonomy.test', 'resident3@autonomy.test',
    'faculty1@autonomy.test', 'faculty2@autonomy.test', 'faculty3@autonomy.test'
  )
),
epa_data AS (
  SELECT id as epa_id, code, row_number() OVER () as epa_num
  FROM epas 
  LIMIT 10
)
INSERT INTO evaluations (
  institution_id, resident_id, faculty_id, epa_id, custom_case_text, is_custom, domains,
  resident_complexity, faculty_complexity, resident_entrustment_level, faculty_entrustment_level,
  resident_comment, faculty_comment, resident_completed_at, faculty_completed_at, initiated_by, created_at
)
SELECT 
  i.institution_id,
  r.id as resident_id,
  f.id as faculty_id,
  e.epa_id,
  'Additional completed case for analytics #' || row_number() OVER () as custom_case_text,
  true as is_custom,
  ARRAY[
    CASE 
      WHEN random() < 0.33 THEN 'preop'
      WHEN random() < 0.66 THEN 'intraop'
      ELSE 'postop'
    END
  ]::domain_type[] as domains,
  CASE 
    WHEN random() < 0.4 THEN 'straightforward'::complexity_level
    WHEN random() < 0.7 THEN 'moderate'::complexity_level
    ELSE 'complex'::complexity_level
  END as resident_complexity,
  CASE 
    WHEN random() < 0.4 THEN 'straightforward'::complexity_level
    WHEN random() < 0.7 THEN 'moderate'::complexity_level
    ELSE 'complex'::complexity_level
  END as faculty_complexity,
  CASE 
    WHEN random() < 0.2 THEN 'observation_only'::entrustment_level
    WHEN random() < 0.4 THEN 'direct_supervision'::entrustment_level
    WHEN random() < 0.7 THEN 'indirect_supervision'::entrustment_level
    ELSE 'practice_ready'::entrustment_level
  END as resident_entrustment_level,
  CASE 
    WHEN random() < 0.2 THEN 'observation_only'::entrustment_level
    WHEN random() < 0.4 THEN 'direct_supervision'::entrustment_level
    WHEN random() < 0.7 THEN 'indirect_supervision'::entrustment_level
    ELSE 'practice_ready'::entrustment_level
  END as faculty_entrustment_level,
  'Self-assessment comment for analytics case' as resident_comment,
  'Faculty feedback for analytics case' as faculty_comment,
  NOW() - INTERVAL '30 days' + INTERVAL '1 day' * (random() * 25) as resident_completed_at,
  NOW() - INTERVAL '25 days' + INTERVAL '1 day' * (random() * 20) as faculty_completed_at,
  r.id as initiated_by,
  NOW() - INTERVAL '35 days' + INTERVAL '1 day' * (random() * 30) as created_at

FROM institution_data i
CROSS JOIN user_data r
CROSS JOIN user_data f  
CROSS JOIN epa_data e
WHERE r.role = 'resident' 
  AND f.role = 'faculty'
  AND r.user_num <= 3
  AND f.user_num <= 3
  AND e.epa_num <= 8
  AND random() < 0.3;  -- Only create 30% of possible combinations

-- Show summary of what was created
SELECT 
  'Summary of evaluations created:' as status,
  COUNT(*) as total_evaluations,
  COUNT(*) FILTER (WHERE resident_completed_at IS NOT NULL AND faculty_completed_at IS NOT NULL) as completed,
  COUNT(*) FILTER (WHERE resident_completed_at IS NULL AND faculty_completed_at IS NOT NULL) as awaiting_resident,
  COUNT(*) FILTER (WHERE resident_completed_at IS NOT NULL AND faculty_completed_at IS NULL) as awaiting_faculty,
  COUNT(*) FILTER (WHERE resident_completed_at IS NULL AND faculty_completed_at IS NULL) as no_responses
FROM evaluations 
WHERE resident_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@autonomy.test'
);
