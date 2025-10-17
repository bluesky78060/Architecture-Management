-- Create user_approvals table for SNS login access control
-- Users must be approved before they can access the system

CREATE TABLE IF NOT EXISTS user_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'google', 'kakao', etc.
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_approvals_user_id ON user_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_approvals_email ON user_approvals(email);
CREATE INDEX IF NOT EXISTS idx_user_approvals_status ON user_approvals(status);

-- Enable RLS
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own approval status
DROP POLICY IF EXISTS "Users can view their own approval status" ON user_approvals;
CREATE POLICY "Users can view their own approval status"
  ON user_approvals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own approval record
DROP POLICY IF EXISTS "Users can create their own approval record" ON user_approvals;
CREATE POLICY "Users can create their own approval record"
  ON user_approvals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only approved users can access the system (will be applied to other tables)
-- This is a helper function to check if user is approved
CREATE OR REPLACE FUNCTION is_user_approved(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_approvals
    WHERE user_id = check_user_id
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create approval record on first SNS login
-- This will be handled by the application instead for better control

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_approvals_updated_at
  BEFORE UPDATE ON user_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_user_approvals_updated_at();

-- Grant necessary permissions
GRANT SELECT ON user_approvals TO authenticated;
GRANT INSERT ON user_approvals TO authenticated;

-- Comment
COMMENT ON TABLE user_approvals IS 'Stores user approval status for SNS login access control';
COMMENT ON COLUMN user_approvals.status IS 'pending: awaiting approval, approved: can access system, rejected: access denied';
