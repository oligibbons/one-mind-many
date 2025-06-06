/*
  # Update user role to admin

  1. Changes
    - Updates the role of user with email 'olipg@hotmail.co.uk' to 'admin'
*/

DO $$ 
BEGIN
  UPDATE users
  SET role = 'admin'
  WHERE email = 'olipg@hotmail.co.uk';
END $$;