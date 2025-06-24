-- EPA Evaluation App Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('resident', 'faculty', 'admin');
CREATE TYPE complexity_level AS ENUM ('straightforward', 'moderate', 'complex');
CREATE TYPE entrustment_level AS ENUM ('observation_only', 'direct_supervision', 'indirect_supervision', 'practice_ready');
CREATE TYPE domain_type AS ENUM ('preop', 'intraop', 'postop');

-- Institutions table
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    pgy_year INTEGER, -- Only for residents
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EPAs table (ABS-defined General Surgery EPAs)
CREATE TABLE epas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g., "EPA-1", "EPA-2"
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    epa_id UUID REFERENCES epas(id) ON DELETE CASCADE,
    domains domain_type[] NOT NULL DEFAULT '{}',
    complexity complexity_level NOT NULL,
    resident_entrustment_level entrustment_level,
    faculty_entrustment_level entrustment_level,
    resident_comment TEXT,
    faculty_comment TEXT,
    custom_case_text VARCHAR(500),
    is_custom BOOLEAN DEFAULT FALSE,
    resident_completed_at TIMESTAMP WITH TIME ZONE,
    faculty_completed_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN GENERATED ALWAYS AS (
        resident_completed_at IS NOT NULL AND faculty_completed_at IS NOT NULL
    ) STORED,
    initiated_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default EPAs (ABS General Surgery EPAs)
INSERT INTO epas (code, title, description) VALUES
('EPA-1', 'Gather a history and perform a physical examination', 'Obtain a focused history and perform a targeted physical examination'),
('EPA-2', 'Prioritize a differential diagnosis following a clinical encounter', 'Develop and prioritize a differential diagnosis'),
('EPA-3', 'Recommend and interpret common diagnostic and screening tests', 'Select and interpret appropriate diagnostic tests'),
('EPA-4', 'Enter and discuss orders and prescriptions', 'Write and discuss medical orders and prescriptions'),
('EPA-5', 'Document a clinical encounter in the patient record', 'Create accurate and complete documentation'),
('EPA-6', 'Provide an oral presentation of a clinical encounter', 'Present patient cases clearly and concisely'),
('EPA-7', 'Form clinical questions and retrieve evidence to advance patient care', 'Use evidence-based medicine principles'),
('EPA-8', 'Give or receive a patient handover to transition care responsibility', 'Communicate effectively during care transitions'),
('EPA-9', 'Collaborate as a member of an interprofessional team', 'Work effectively with healthcare team members'),
('EPA-10', 'Recognize a patient requiring urgent or emergent care and initiate evaluation and management', 'Identify and manage urgent situations'),
('EPA-11', 'Obtain informed consent for tests and/or procedures', 'Discuss risks, benefits, and alternatives'),
('EPA-12', 'Perform general procedures of a physician', 'Execute common medical procedures safely'),
('EPA-13', 'Identify system failures and contribute to a culture of safety and improvement', 'Participate in quality improvement initiatives');

-- Create indexes for performance
CREATE INDEX idx_evaluations_resident_id ON evaluations(resident_id);
CREATE INDEX idx_evaluations_faculty_id ON evaluations(faculty_id);
CREATE INDEX idx_evaluations_institution_id ON evaluations(institution_id);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at);
CREATE INDEX idx_evaluations_is_completed ON evaluations(is_completed);
CREATE INDEX idx_user_profiles_institution_id ON user_profiles(institution_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Row Level Security (RLS) Policies
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE epas ENABLE ROW LEVEL SECURITY;

-- Policies for institutions
CREATE POLICY "Users can view their own institution" ON institutions
    FOR SELECT USING (
        id IN (
            SELECT institution_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Policies for user_profiles
CREATE POLICY "Users can view profiles in their institution" ON user_profiles
    FOR SELECT USING (
        institution_id IN (
            SELECT institution_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Policies for evaluations
CREATE POLICY "Users can view evaluations in their institution" ON evaluations
    FOR SELECT USING (
        institution_id IN (
            SELECT institution_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create evaluations in their institution" ON evaluations
    FOR INSERT WITH CHECK (
        institution_id IN (
            SELECT institution_id FROM user_profiles 
            WHERE id = auth.uid()
        )
        AND (resident_id = auth.uid() OR faculty_id = auth.uid())
    );

CREATE POLICY "Users can update evaluations they're involved in" ON evaluations
    FOR UPDATE USING (
        resident_id = auth.uid() OR faculty_id = auth.uid()
    );

-- Policies for EPAs (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view EPAs" ON epas
    FOR SELECT TO authenticated USING (true);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role user_role;
    inst_id UUID;
    inst_name TEXT;
BEGIN
    -- Get user role from metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'resident')::user_role;
    
    -- Handle admin users - create institution first
    IF user_role = 'admin' THEN
        inst_name := NEW.raw_user_meta_data->>'institution_name';
        IF inst_name IS NOT NULL AND inst_name != '' THEN
            INSERT INTO public.institutions (name)
            VALUES (inst_name)
            RETURNING id INTO inst_id;
        END IF;
    ELSE
        -- For faculty and residents, try to parse institution_id as UUID
        BEGIN
            inst_id := (NEW.raw_user_meta_data->>'institution_id')::UUID;
        EXCEPTION WHEN invalid_text_representation THEN
            -- If not a valid UUID, set to NULL
            inst_id := NULL;
        END;
    END IF;
    
    -- Insert user profile
    INSERT INTO public.user_profiles (id, email, first_name, last_name, role, institution_id, pgy_year, department)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        user_role,
        inst_id,
        NULLIF(NEW.raw_user_meta_data->>'pgy_year', '')::INTEGER,
        NULLIF(NEW.raw_user_meta_data->>'department', '')
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
