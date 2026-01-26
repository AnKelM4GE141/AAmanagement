-- Allow anyone to view invitations by token (for accepting invites)
CREATE POLICY "Anyone can view invitation by token"
  ON user_invitations
  FOR SELECT
  USING (true);

-- Allow anyone to update invitations by token (for marking as accepted)
CREATE POLICY "Anyone can accept invitation"
  ON user_invitations
  FOR UPDATE
  USING (true);
