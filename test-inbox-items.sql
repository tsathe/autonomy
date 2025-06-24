-- Test Inbox Items for Completion Testing
-- Using resident ID: e5931501-3a5d-47c6-b616-934c5a6c90a9
-- Using faculty ID: ff061b6a-eaf6-446c-b4f5-3739dbe49854

-- First, let's make sure we have some EPAs to work with
-- (You might already have these, but just in case)

-- INBOX ITEMS FOR FACULTY (resident has completed, faculty needs to respond)
-- These will appear in the faculty member's inbox
INSERT INTO evaluations (
    institution_id, 
    resident_id, 
    faculty_id, 
    epa_id, 
    domains,
    resident_complexity,
    resident_entrustment_level,
    resident_comment,
    custom_case_text,
    is_custom,
    resident_completed_at,
    initiated_by,
    created_at
) VALUES
-- Case 1: Appendectomy (resident thinks moderate complexity, moderate supervision)
(
    (SELECT institution_id FROM user_profiles WHERE id = 'e5931501-3a5d-47c6-b616-934c5a6c90a9'),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-1' LIMIT 1),
    ARRAY['intraop']::domain_type[],
    'moderate',
    'indirect_supervision',
    'This was a challenging appendectomy case. Patient had some adhesions from previous surgery which made dissection more difficult. I felt I needed minimal guidance from attending. Good learning experience with laparoscopic techniques.',
    'Complicated appendectomy with adhesions',
    true,
    NOW() - INTERVAL '2 hours',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '2 hours'
),

-- Case 2: Hernia Repair (resident thinks straightforward, direct supervision)
(
    (SELECT institution_id FROM user_profiles WHERE id = 'e5931501-3a5d-47c6-b616-934c5a6c90a9'),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-2' LIMIT 1),
    ARRAY['preop', 'intraop', 'postop']::domain_type[],
    'straightforward',
    'direct_supervision',
    'Routine inguinal hernia repair. Patient was cooperative and anatomy was straightforward. I performed most of the case with attending guidance on mesh placement and fixation technique.',
    'Standard inguinal hernia repair in healthy patient',
    true,
    NOW() - INTERVAL '6 hours',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '6 hours'
),

-- Case 3: Gallbladder (resident thinks complex, observation only)
(
    (SELECT institution_id FROM user_profiles WHERE id = 'e5931501-3a5d-47c6-b616-934c5a6c90a9'),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-3' LIMIT 1),
    ARRAY['intraop']::domain_type[],
    'complex',
    'observation_only',
    'Very difficult laparoscopic cholecystectomy. Severe inflammation and scarring from previous episodes of cholecystitis. I mainly observed as attending performed critical view of safety dissection. Great learning case.',
    'Acute cholecystitis with severe inflammation',
    true,
    NOW() - INTERVAL '1 day',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '1 day'
);

-- INBOX ITEMS FOR RESIDENT (faculty has completed, resident needs to respond)
-- These will appear in the resident's inbox
INSERT INTO evaluations (
    institution_id, 
    resident_id, 
    faculty_id, 
    epa_id, 
    domains,
    faculty_complexity,
    faculty_entrustment_level,
    faculty_comment,
    custom_case_text,
    is_custom,
    faculty_completed_at,
    initiated_by,
    created_at
) VALUES
-- Case 4: Breast Biopsy (faculty assessment)
(
    (SELECT institution_id FROM user_profiles WHERE id = 'ff061b6a-eaf6-446c-b4f5-3739dbe49854'),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-4' LIMIT 1),
    ARRAY['preop', 'intraop']::domain_type[],
    'straightforward',
    'indirect_supervision',
    'Resident performed this core needle biopsy with minimal supervision. Good technique with ultrasound guidance. Appropriate patient communication and post-procedure instructions. Ready for more independence.',
    'US-guided core needle breast biopsy',
    true,
    NOW() - INTERVAL '3 hours',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '3 hours'
),

-- Case 5: Skin Lesion Excision (faculty assessment)
(
    (SELECT institution_id FROM user_profiles WHERE id = 'ff061b6a-eaf6-446c-b4f5-3739dbe49854'),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-5' LIMIT 1),
    ARRAY['preop', 'intraop', 'postop']::domain_type[],
    'moderate',
    'direct_supervision',
    'Wide local excision of melanoma with sentinel lymph node biopsy. Resident showed good understanding of oncologic principles but needed guidance on margins and lymphatic mapping. Room for improvement in surgical planning.',
    'Melanoma excision with sentinel node biopsy',
    true,
    NOW() - INTERVAL '5 hours',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '5 hours'
),

-- Case 6: Emergency Trauma (faculty assessment)
(
    (SELECT institution_id FROM user_profiles WHERE id = 'ff061b6a-eaf6-446c-b4f5-3739dbe49854'),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-6' LIMIT 1),
    ARRAY['preop', 'intraop']::domain_type[],
    'complex',
    'direct_supervision',
    'Emergency exploratory laparotomy for penetrating abdominal trauma. Resident demonstrated good decision-making under pressure but required significant guidance during damage control surgery. Good potential with more experience.',
    'Penetrating abdominal trauma with multiple injuries',
    true,
    NOW() - INTERVAL '8 hours',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '8 hours'
);

-- Add a few more recent ones for variety
INSERT INTO evaluations (
    institution_id, 
    resident_id, 
    faculty_id, 
    epa_id, 
    domains,
    resident_complexity,
    resident_entrustment_level,
    resident_comment,
    custom_case_text,
    is_custom,
    resident_completed_at,
    initiated_by,
    created_at
) VALUES
-- Case 7: Recent case (30 minutes ago)
(
    (SELECT institution_id FROM user_profiles WHERE id = 'e5931501-3a5d-47c6-b616-934c5a6c90a9'),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-1' LIMIT 1),
    ARRAY['intraop']::domain_type[],
    'straightforward',
    'practice_ready',
    'Routine laparoscopic appendectomy. Uncomplicated case with clear anatomy. I performed the entire case independently with attending available but not scrubbed. Felt very confident throughout.',
    'Uncomplicated laparoscopic appendectomy',
    true,
    NOW() - INTERVAL '30 minutes',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '30 minutes'
),

-- Case 8: Yesterday's case
(
    (SELECT institution_id FROM user_profiles WHERE id = 'e5931501-3a5d-47c6-b616-934c5a6c90a9'),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-2' LIMIT 1),
    ARRAY['preop', 'intraop']::domain_type[],
    'moderate',
    'indirect_supervision',
    'Ventral hernia repair with mesh. Some technical challenges with adhesiolysis but managed well. Attending provided guidance on mesh selection and positioning.',
    'Ventral hernia repair with component separation',
    true,
    NOW() - INTERVAL '18 hours',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '18 hours'
);

-- Ready to test!
-- 1. Run this SQL in Supabase
-- 2. Check your inbox - you should see items waiting for response
-- 3. Complete one from your inbox and verify it appears in completed feed immediately!
