-- QUICK SAMPLE DATA SETUP
-- Step 1: First, run this to see your existing users
SELECT 
    id, 
    first_name, 
    last_name, 
    role, 
    pgy_year,
    email
FROM user_profiles 
ORDER BY role, first_name;

-- Step 2: Copy one resident ID and one faculty ID from above
-- Step 3: Replace the IDs in the INSERT statements below

-- REPLACE THESE WITH YOUR ACTUAL USER IDs:
-- SET @resident_id = 'your-resident-uuid-here';
-- SET @faculty_id = 'your-faculty-uuid-here';

-- Sample evaluations using your actual user IDs
-- (Replace the IDs in each INSERT statement)

-- COMPLETED EVALUATION
INSERT INTO evaluations (
    id, 
    institution_id,
    resident_id, 
    faculty_id, 
    epa_id, 
    domains, 
    complexity, 
    resident_entrustment_level, 
    faculty_entrustment_level, 
    resident_comment, 
    faculty_comment, 
    custom_case_text, 
    is_custom, 
    resident_completed_at, 
    faculty_completed_at, 
    initiated_by, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'PUT_YOUR_RESIDENT_ID_HERE', -- ← Replace this
    'PUT_YOUR_FACULTY_ID_HERE',  -- ← Replace this
    (SELECT id FROM epas WHERE code = 'EPA-10'),
    '{"preop","intraop","postop"}',
    'moderate',
    'indirect_supervision',
    'indirect_supervision',
    'Successfully completed laparoscopic cholecystectomy. I felt comfortable with the preoperative assessment and surgical technique.',
    'Resident performed excellently. Demonstrated good understanding of anatomy and surgical principles.',
    'Laparoscopic cholecystectomy for symptomatic gallstones',
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    'PUT_YOUR_RESIDENT_ID_HERE', -- ← Replace this
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
);

-- PENDING FACULTY EVALUATION
INSERT INTO evaluations (
    id, 
    institution_id,
    resident_id, 
    faculty_id, 
    epa_id, 
    domains, 
    complexity, 
    resident_entrustment_level, 
    resident_comment, 
    custom_case_text, 
    is_custom, 
    resident_completed_at, 
    initiated_by, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'PUT_YOUR_RESIDENT_ID_HERE', -- ← Replace this
    'PUT_YOUR_FACULTY_ID_HERE',  -- ← Replace this
    (SELECT id FROM epas WHERE code = 'EPA-2'),
    '{"preop"}',
    'straightforward',
    'direct_supervision',
    'Completed appendectomy case. Good clinical reasoning and clear surgical plan.',
    'Open appendectomy for acute appendicitis',
    true,
    NOW() - INTERVAL '1 day',
    'PUT_YOUR_RESIDENT_ID_HERE', -- ← Replace this
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
);

-- PENDING RESIDENT EVALUATION
INSERT INTO evaluations (
    id, 
    institution_id,
    resident_id, 
    faculty_id, 
    epa_id, 
    domains, 
    complexity, 
    initiated_by, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'PUT_YOUR_RESIDENT_ID_HERE', -- ← Replace this
    'PUT_YOUR_FACULTY_ID_HERE',  -- ← Replace this
    (SELECT id FROM epas WHERE code = 'EPA-5'),
    '{"postop"}',
    'moderate',
    'PUT_YOUR_FACULTY_ID_HERE',  -- ← Replace this
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
);

-- Verify your data
SELECT 
    e.id,
    r.first_name || ' ' || r.last_name as resident_name,
    f.first_name || ' ' || f.last_name as faculty_name,
    ep.code as epa_code,
    ep.title as epa_title,
    e.complexity,
    CASE 
        WHEN e.resident_completed_at IS NOT NULL AND e.faculty_completed_at IS NOT NULL THEN 'Completed'
        WHEN e.resident_completed_at IS NOT NULL AND e.faculty_completed_at IS NULL THEN 'Pending Faculty'
        ELSE 'Pending Resident'
    END as status,
    e.created_at
FROM evaluations e
JOIN user_profiles r ON e.resident_id = r.id
JOIN user_profiles f ON e.faculty_id = f.id
JOIN epas ep ON e.epa_id = ep.id
ORDER BY e.created_at DESC;
