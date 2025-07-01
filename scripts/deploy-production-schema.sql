-- Production Database Schema Deployment Script
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('resident', 'faculty', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE complexity_level AS ENUM ('straightforward', 'moderate', 'complex');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entrustment_level AS ENUM ('observation_only', 'direct_supervision', 'indirect_supervision', 'practice_ready');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE domain_type AS ENUM ('preop', 'intraop', 'postop');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create institutions table
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (renamed from user_profiles for Supabase compatibility)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    pgy_year INTEGER,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create EPAs table
CREATE TABLE IF NOT EXISTS epas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    epa_id UUID REFERENCES epas(id) ON DELETE CASCADE,
    case_description TEXT NOT NULL,
    setting VARCHAR(100) NOT NULL,
    date_of_case DATE NOT NULL,
    resident_entrustment entrustment_level,
    faculty_entrustment entrustment_level,
    resident_complexity complexity_level,
    faculty_complexity complexity_level,
    resident_feedback TEXT,
    faculty_feedback TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default institution
INSERT INTO institutions (name) VALUES ('Test Medical Center') ON CONFLICT DO NOTHING;

-- Insert EPA data (American Board of Surgery General Surgery EPAs)
INSERT INTO epas (code, title, description) VALUES
('EPA-1', 'Manage hernias in adults', 'Evaluate, diagnose, and manage adult hernias including inguinal, ventral, and incisional hernias'),
('EPA-2', 'Manage acute abdomen', 'Evaluate and manage patients presenting with acute abdominal pain'),
('EPA-3', 'Manage anorectal disease', 'Diagnose and treat common anorectal conditions'),
('EPA-4', 'Manage appendicitis', 'Diagnose and treat appendicitis including surgical management'),
('EPA-5', 'Manage breast disease', 'Evaluate and manage benign and malignant breast conditions'),
('EPA-6', 'Manage colon disease', 'Manage colorectal conditions including cancer and inflammatory bowel disease'),
('EPA-7', 'Provide consultation', 'Provide effective surgical consultation and recommendations'),
('EPA-8', 'Manage critically ill patient', 'Manage critically ill surgical patients in the ICU setting'),
('EPA-9', 'Perform endoscopy', 'Perform diagnostic and therapeutic endoscopic procedures'),
('EPA-10', 'Manage gallbladder disease', 'Diagnose and treat gallbladder and biliary tract disease'),
('EPA-11', 'Manage inguinal hernia', 'Specific management of inguinal hernias in adults'),
('EPA-12', 'Manage skin and soft tissue neoplasms', 'Evaluate and treat skin and soft tissue masses'),
('EPA-13', 'Manage pancreatitis', 'Diagnose and manage acute and chronic pancreatitis'),
('EPA-14', 'Manage dialysis access', 'Create and maintain vascular access for dialysis'),
('EPA-15', 'Manage bowel obstruction', 'Diagnose and treat small and large bowel obstruction'),
('EPA-16', 'Manage soft tissue infections', 'Treat necrotizing and non-necrotizing soft tissue infections'),
('EPA-17', 'Manage thyroid and parathyroid disease', 'Evaluate and treat endocrine neck conditions'),
('EPA-18', 'Manage trauma', 'Initial assessment and management of trauma patients')
ON CONFLICT (code) DO NOTHING;

-- Create user creation trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    institution_uuid UUID;
BEGIN
    -- Get or create default institution
    SELECT id INTO institution_uuid FROM institutions WHERE name = 'Test Medical Center' LIMIT 1;
    
    IF institution_uuid IS NULL THEN
        INSERT INTO institutions (name) VALUES ('Test Medical Center') RETURNING id INTO institution_uuid;
    END IF;

    -- Create profile
    INSERT INTO profiles (
        id,
        institution_id,
        email,
        first_name,
        last_name,
        role,
        pgy_year,
        department
    ) VALUES (
        NEW.id,
        institution_uuid,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 2)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'resident')::user_role,
        CASE WHEN NEW.raw_user_meta_data->>'role' = 'resident' THEN 1 ELSE NULL END,
        'General Surgery'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY definer;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view evaluations they're involved in" ON evaluations FOR SELECT USING (
    auth.uid() = resident_id OR auth.uid() = faculty_id
);

COMMIT;
