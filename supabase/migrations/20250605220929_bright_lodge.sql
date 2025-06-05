/*
  # Add users insert policy

  1. Changes
    - Add RLS policy to allow authenticated users to insert their own profile
    
  2. Security
    - Adds INSERT policy for authenticated users
    - Users can only insert rows where the id matches their auth.uid()
*/

-- Add policy to allow authenticated users to insert their own profile
CREATE POLICY "Users can create their own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);