-- 10 COMPLETED EVALUATIONS
-- Resident: e5931501-3a5d-47c6-b616-934c5a6c90a9
-- Faculty: ff061b6a-eaf6-446c-b4f5-3739dbe49854

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

-- Evaluation 1: Laparoscopic Cholecystectomy
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-10'),
    '{"preop","intraop","postop"}',
    'moderate',
    'indirect_supervision',
    'indirect_supervision',
    'Successfully completed laparoscopic cholecystectomy. Comfortable with preoperative assessment, achieved critical view of safety, and managed postop care effectively.',
    'Excellent technical skills and clinical judgment. Ready for indirect supervision on routine laparoscopic cases. Continue to build experience with complex anatomy.',
    'Laparoscopic cholecystectomy for symptomatic gallstones',
    true,
    NOW() - INTERVAL '7 days' - INTERVAL '4 hours',
    NOW() - INTERVAL '6 days' - INTERVAL '2 hours',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '6 days' - INTERVAL '2 hours'
),

-- Evaluation 2: Open Appendectomy
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-2'),
    '{"preop","intraop"}',
    'straightforward',
    'practice_ready',
    'practice_ready',
    'Straightforward acute appendicitis case. Excellent clinical reasoning in ED workup, clear differential diagnosis, and smooth operative technique.',
    'Outstanding performance. Resident demonstrated independent decision-making and technical proficiency. Ready for independent practice on uncomplicated appendectomies.',
    'Open appendectomy for acute appendicitis',
    true,
    NOW() - INTERVAL '12 days' - INTERVAL '6 hours',
    NOW() - INTERVAL '11 days' - INTERVAL '3 hours',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '13 days',
    NOW() - INTERVAL '11 days' - INTERVAL '3 hours'
),

-- Evaluation 3: Inguinal Hernia Repair
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-11'),
    '{"preop","intraop","postop"}',
    'moderate',
    'direct_supervision',
    'direct_supervision',
    'Bilateral inguinal hernia repair with mesh. Good understanding of anatomy and mesh placement technique. Comfortable with tension-free repair principles.',
    'Solid performance with direct supervision. Good anatomical knowledge and improving technical skills. Continue building experience with mesh repairs.',
    'Bilateral inguinal hernia repair with mesh',
    true,
    NOW() - INTERVAL '18 days' - INTERVAL '2 hours',
    NOW() - INTERVAL '17 days' - INTERVAL '5 hours',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '19 days',
    NOW() - INTERVAL '17 days' - INTERVAL '5 hours'
),

-- Evaluation 4: Colonoscopy
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-3'),
    '{"preop"}',
    'straightforward',
    'indirect_supervision',
    'indirect_supervision',
    'Screening colonoscopy with polypectomy. Good technique for scope advancement and polyp identification. Proper biopsy technique demonstrated.',
    'Competent endoscopic skills. Ready for indirect supervision on routine screening cases. Continue to build experience with therapeutic interventions.',
    'Colonoscopy for colorectal cancer screening',
    true,
    NOW() - INTERVAL '5 days' - INTERVAL '3 hours',
    NOW() - INTERVAL '4 days' - INTERVAL '1 hour',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '4 days' - INTERVAL '1 hour'
),

-- Evaluation 5: Central Line Placement
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-12'),
    '{"intraop"}',
    'complex',
    'observation_only',
    'direct_supervision',
    'Complex central line in ICU patient with difficult anatomy. Observed ultrasound-guided technique and sterile procedure. Need more hands-on practice.',
    'Good understanding of sterile technique and anatomy. Needs more hands-on experience before independent practice. Appropriate for direct supervision.',
    'Central line placement in ICU',
    true,
    NOW() - INTERVAL '10 days' - INTERVAL '8 hours',
    NOW() - INTERVAL '9 days' - INTERVAL '4 hours',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '11 days',
    NOW() - INTERVAL '9 days' - INTERVAL '4 hours'
),

-- Evaluation 6: Thyroidectomy
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-17'),
    '{"preop","intraop","postop"}',
    'complex',
    'observation_only',
    'observation_only',
    'Complex thyroidectomy case. Observed nerve monitoring technique and careful dissection around recurrent laryngeal nerve. Learned about calcium management.',
    'Appropriate level for complex thyroid surgery. Good understanding of anatomy and complications. Continue observing complex endocrine cases.',
    'Thyroidectomy for thyroid nodule',
    true,
    NOW() - INTERVAL '21 days' - INTERVAL '5 hours',
    NOW() - INTERVAL '20 days' - INTERVAL '2 hours',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '22 days',
    NOW() - INTERVAL '20 days' - INTERVAL '2 hours'
),

-- Evaluation 7: Bowel Obstruction Management
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-15'),
    '{"preop","intraop"}',
    'moderate',
    'direct_supervision',
    'indirect_supervision',
    'Small bowel obstruction requiring operative intervention. Good clinical assessment and surgical planning. Effective adhesiolysis and bowel inspection.',
    'Strong clinical reasoning and improving surgical skills. Ready for indirect supervision on similar cases. Good judgment in operative decision-making.',
    'Bowel obstruction workup and management',
    true,
    NOW() - INTERVAL '15 days' - INTERVAL '7 hours',
    NOW() - INTERVAL '14 days' - INTERVAL '3 hours',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '16 days',
    NOW() - INTERVAL '14 days' - INTERVAL '3 hours'
),

-- Evaluation 8: Breast Biopsy
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-12'),
    '{"preop","intraop"}',
    'straightforward',
    'practice_ready',
    'practice_ready',
    'Core needle biopsy of breast lesion. Excellent technique with ultrasound guidance. Proper specimen handling and patient communication throughout.',
    'Excellent performance on breast procedures. Ready for independent practice on routine biopsies. Continue to expand experience with breast pathology.',
    'Breast biopsy for suspicious lesion',
    true,
    NOW() - INTERVAL '3 days' - INTERVAL '2 hours',
    NOW() - INTERVAL '2 days' - INTERVAL '6 hours',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '2 days' - INTERVAL '6 hours'
),

-- Evaluation 9: Ventral Hernia Repair
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-11'),
    '{"preop","intraop","postop"}',
    'complex',
    'direct_supervision',
    'direct_supervision',
    'Large ventral hernia repair with component separation. Complex case requiring extensive dissection. Good understanding of tissue planes and mesh placement.',
    'Challenging case handled well with direct supervision. Good anatomical knowledge and improving comfort with complex abdominal wall reconstruction.',
    'Ventral hernia repair',
    true,
    NOW() - INTERVAL '25 days' - INTERVAL '4 hours',
    NOW() - INTERVAL '24 days' - INTERVAL '1 hour',
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    NOW() - INTERVAL '26 days',
    NOW() - INTERVAL '24 days' - INTERVAL '1 hour'
),

-- Evaluation 10: ERCP
(
    gen_random_uuid(),
    (SELECT institution_id FROM user_profiles LIMIT 1),
    'e5931501-3a5d-47c6-b616-934c5a6c90a9',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    (SELECT id FROM epas WHERE code = 'EPA-3'),
    '{"intraop"}',
    'complex',
    'observation_only',
    'observation_only',
    'ERCP for choledocholithiasis. Observed advanced endoscopic technique including sphincterotomy and stone extraction. Complex procedure requiring specialized skills.',
    'Appropriate observation level for advanced endoscopy. Good understanding of biliary anatomy and ERCP indications. Continue observing complex procedures.',
    'Endoscopic retrograde cholangiopancreatography (ERCP)',
    true,
    NOW() - INTERVAL '1 day' - INTERVAL '3 hours',
    NOW() - INTERVAL '1 day' - INTERVAL '1 hour',
    'ff061b6a-eaf6-446c-b4f5-3739dbe49854',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day' - INTERVAL '1 hour'
);

-- Verify the inserted data
SELECT 
    e.id,
    ep.code as epa_code,
    ep.title as epa_title,
    e.complexity,
    e.resident_entrustment_level,
    e.faculty_entrustment_level,
    e.custom_case_text,
    e.created_at::date as eval_date,
    CASE 
        WHEN e.resident_completed_at IS NOT NULL AND e.faculty_completed_at IS NOT NULL THEN 'Completed'
        ELSE 'Incomplete'
    END as status
FROM evaluations e
JOIN epas ep ON e.epa_id = ep.id
WHERE e.resident_id = 'e5931501-3a5d-47c6-b616-934c5a6c90a9'
  AND e.faculty_id = 'ff061b6a-eaf6-446c-b4f5-3739dbe49854'
ORDER BY e.created_at DESC;
