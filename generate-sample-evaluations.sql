-- Sample Evaluation Data for Existing Users
-- Replace the user IDs below with your actual user IDs from Supabase

-- Step 1: Insert some sample evaluations
-- You'll need to replace these UUIDs with actual user IDs from your user_profiles table

-- COMPLETED EVALUATIONS (both resident and faculty completed)
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
) VALUES 
-- Completed Evaluation 1: Laparoscopic Cholecystectomy
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1), -- Use existing institution
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    (SELECT id FROM epas WHERE code = 'EPA-10'), -- Gallbladder EPA
    '{"preop","intraop","postop"}',
    'moderate',
    'indirect_supervision',
    'indirect_supervision',
    'Successfully completed laparoscopic cholecystectomy. I felt comfortable with the preoperative assessment and surgical technique. The critical view of safety was well demonstrated.',
    'Resident performed excellently. Demonstrated good understanding of anatomy and surgical principles. Ready for indirect supervision on similar cases.',
    'Laparoscopic cholecystectomy for symptomatic gallstones',
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
),

-- Completed Evaluation 2: Appendectomy
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    (SELECT id FROM epas WHERE code = 'EPA-2'), -- Differential diagnosis EPA
    '{"preop","intraop"}',
    'straightforward',
    'direct_supervision',
    'practice_ready',
    'Straightforward appendectomy case. Good clinical reasoning in the ED workup and clear surgical plan.',
    'Excellent performance. Resident is ready for independent practice on uncomplicated appendectomies.',
    'Open appendectomy for acute appendicitis',
    true,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '4 days'
),

-- Completed Evaluation 3: Hernia Repair
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    (SELECT id FROM epas WHERE code = 'EPA-11'), -- Inguinal hernia EPA
    '{"preop","intraop","postop"}',
    'complex',
    'observation_only',
    'direct_supervision',
    'Complex bilateral hernia repair. I observed most of the procedure and assisted with closure. Need more practice with mesh placement.',
    'Good understanding of anatomy but needs more hands-on experience. Appropriate for direct supervision with continued mentoring.',
    'Bilateral inguinal hernia repair with mesh',
    true,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '6 days',
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '6 days'
);

-- PENDING FACULTY EVALUATION (resident completed, awaiting faculty)
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
) VALUES 
-- Pending Faculty Review 1
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    (SELECT id FROM epas WHERE code = 'EPA-5'), -- Documentation EPA
    '{"postop"}',
    'straightforward',
    'indirect_supervision',
    'Completed thorough documentation of postoperative care. Patient had smooth recovery with appropriate pain management and wound care instructions.',
    'Postoperative wound care and management',
    true,
    NOW() - INTERVAL '1 day',
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
),

-- Pending Faculty Review 2
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    (SELECT id FROM epas WHERE code = 'EPA-6'), -- Oral presentation EPA
    '{"preop"}',
    'moderate',
    'direct_supervision',
    'Presented case in morning rounds. Covered all key points including history, physical exam, imaging findings, and surgical plan. Received good feedback from team.',
    NULL,
    false,
    NOW() - INTERVAL '6 hours',
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '6 hours'
);

-- PENDING RESIDENT EVALUATION (just initiated)
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
) VALUES 
-- Just Initiated 1
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    (SELECT id FROM epas WHERE code = 'EPA-8'), -- Patient handover EPA
    '{"postop"}',
    'straightforward',
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
),

-- Just Initiated 2
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    'YOUR_FACULTY_ID_HERE',  -- Replace with actual faculty ID
    (SELECT id FROM epas WHERE code = 'EPA-9'), -- Interprofessional team EPA
    '{"intraop"}',
    'moderate',
    'YOUR_RESIDENT_ID_HERE', -- Replace with actual resident ID
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
);

-- Quick way to see what you have:
-- SELECT 
--   e.*,
--   r.first_name || ' ' || r.last_name as resident_name,
--   f.first_name || ' ' || f.last_name as faculty_name,
--   ep.code as epa_code,
--   ep.title as epa_title,
--   CASE 
--     WHEN e.resident_completed_at IS NOT NULL AND e.faculty_completed_at IS NOT NULL THEN 'Completed'
--     WHEN e.resident_completed_at IS NOT NULL AND e.faculty_completed_at IS NULL THEN 'Pending Faculty'
--     ELSE 'Pending Resident'
--   END as status
-- FROM evaluations e
-- JOIN user_profiles r ON e.resident_id = r.id
-- JOIN user_profiles f ON e.faculty_id = f.id
-- JOIN epas ep ON e.epa_id = ep.id
-- ORDER BY e.created_at DESC;
