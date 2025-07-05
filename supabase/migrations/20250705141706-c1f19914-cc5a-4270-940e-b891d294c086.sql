-- Create a policy to allow authenticated users to see names of other users for comments
CREATE POLICY "Enable select names for authenticated users" 
ON public.cliente 
FOR SELECT 
TO authenticated
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Enable select for users to view own data" ON public.cliente;

-- Create a new policy that allows users to see all cliente data but only update their own
CREATE POLICY "Users can view all cliente data" 
ON public.cliente 
FOR SELECT 
TO authenticated
USING (true);

-- Keep the update policy restrictive (users can only update their own data)
-- The existing update and delete policies are fine as they are