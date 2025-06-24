'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'resident' | 'faculty' | 'admin'>('resident')
  const [institutionId, setInstitutionId] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [pgyYear, setPgyYear] = useState<number | undefined>()
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log('Starting sign up process...')

    // Construct metadata based on role
    const metadata: { [key: string]: any } = {
      first_name: firstName,
      last_name: lastName,
      role,
    }

    if (role === 'resident') {
      metadata.pgy_year = pgyYear
      metadata.institution_id = institutionId
    } else if (role === 'faculty') {
      metadata.department = department
      metadata.institution_id = institutionId
    } else if (role === 'admin') {
      metadata.institution_name = institutionName
    }

    console.log('Metadata:', metadata)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      console.log('Sign up response:', { data, error })

      if (error) {
        console.error('Sign up error:', error)
        toast.error(error.message)
      } else if (data.user) {
        console.log('Sign up successful:', data.user)
        toast.success('Account created successfully! You are now signed in.')
      }
    } catch (err) {
      console.error('Unexpected error during sign up:', err)
      toast.error('An unexpected error occurred. Please try again.')
    }
    
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('Starting sign in process...')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in response:', { error })
      
      if (error) {
        console.error('Sign in error:', error)
        toast.error(error.message)
      } else {
        console.log('Sign in successful')
        toast.success('Signed in successfully!')
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err)
      toast.error('An unexpected error occurred. Please try again.')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>EPA Evaluation System</CardTitle>
          <CardDescription>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
            <div className="grid gap-4">
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="firstName"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                    <Input
                      id="lastName"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Select onValueChange={(value) => setRole(value as any)} value={role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (Create an Institution)</SelectItem>
                      <SelectItem value="faculty">Faculty (Join an Institution)</SelectItem>
                      <SelectItem value="resident">Resident (Join an Institution)</SelectItem>
                    </SelectContent>
                  </Select>

                  {role === 'admin' && (
                    <Input
                      id="institutionName"
                      placeholder="Your Institution's Name"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      required
                    />
                  )}

                  {(role === 'resident' || role === 'faculty') && (
                    <Input
                      id="institutionId"
                      placeholder="Institution ID (from your admin)"
                      value={institutionId}
                      onChange={(e) => setInstitutionId(e.target.value)}
                      required
                    />
                  )}

                  {role === 'resident' && (
                    <Input
                      id="pgyYear"
                      type="number"
                      placeholder="PGY Year (e.g., 2)"
                      onChange={(e) => setPgyYear(parseInt(e.target.value))}
                      required
                    />
                  )}

                  {role === 'faculty' && (
                    <Input
                      id="department"
                      placeholder="Department (e.g., General Surgery)"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    />
                  )}
                </>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
