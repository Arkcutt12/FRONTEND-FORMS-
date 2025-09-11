-- Helper function to set current user email for RLS policies
CREATE OR REPLACE FUNCTION set_current_user_email(email TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_email', email, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get orders by email (for use in the application)
CREATE OR REPLACE FUNCTION get_orders_by_email(user_email TEXT)
RETURNS SETOF public.orders AS $$
BEGIN
  -- Set the current user email for RLS
  PERFORM set_current_user_email(user_email);
  
  -- Return orders for this email
  RETURN QUERY 
  SELECT * FROM public.orders 
  WHERE client_email = user_email 
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new order
CREATE OR REPLACE FUNCTION create_order(
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT DEFAULT NULL,
  p_selected_material TEXT DEFAULT NULL,
  p_form_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
BEGIN
  INSERT INTO public.orders (
    client_name,
    client_email,
    client_phone,
    selected_material,
    form_status
  ) VALUES (
    p_client_name,
    p_client_email,
    p_client_phone,
    p_selected_material,
    'draft'
  ) RETURNING id INTO new_order_id;
  
  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
