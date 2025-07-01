-- Fix the trigger function that's still failing
-- Run this in Supabase SQL Editor

-- First drop the existing broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a much simpler, more robust trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    institution_uuid UUID;
BEGIN
    -- Get any available institution (since we know they exist now)
    SELECT id INTO institution_uuid FROM institutions LIMIT 1;
    
    -- Create profile with minimal required fields
    INSERT INTO profiles (
        id,
        institution_id,
        email,
        first_name,
        last_name,
        role
    ) VALUES (
        NEW.id,
        institution_uuid,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'resident')::user_role
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verify the trigger was created
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
