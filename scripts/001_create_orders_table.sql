-- Create comprehensive orders table for storing all form data
CREATE TABLE IF NOT EXISTS public.orders (
  -- Primary key and metadata
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Request information
  request_number TEXT GENERATED ALWAYS AS ('ARK-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(EXTRACT(DOY FROM created_at)::TEXT, 3, '0') || '-' || SUBSTRING(id::TEXT, 1, 8)) STORED,
  request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Client information
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- DXF file information
  dxf_file_name TEXT,
  dxf_file_url TEXT,
  dxf_analysis_json JSONB, -- JSON response from DXF analysis backend
  dxf_validation_status TEXT CHECK (dxf_validation_status IN ('pending', 'analyzing', 'valid', 'invalid', 'error')),
  dxf_error_details TEXT,
  
  -- Material selection
  selected_material TEXT NOT NULL,
  material_thickness NUMERIC,
  material_color TEXT,
  material_provider TEXT CHECK (material_provider IN ('Arkcutt', 'Cliente')),
  
  -- Material provider details (when client provides material)
  client_material_details JSONB,
  
  -- Location and pickup information
  selected_location TEXT,
  pickup_type TEXT CHECK (pickup_type IN ('recogida', 'domicilio')),
  pickup_address TEXT,
  pickup_city TEXT,
  pickup_postal_code TEXT,
  pickup_notes TEXT,
  
  -- Urgency and special requirements
  is_urgent BOOLEAN DEFAULT FALSE,
  special_requirements TEXT,
  
  -- Budget information
  budget_json JSONB, -- JSON response from budget calculation backend
  budget_total NUMERIC(10,2),
  budget_currency TEXT DEFAULT 'EUR',
  budget_status TEXT CHECK (budget_status IN ('pending', 'calculating', 'completed', 'error')),
  
  -- PDF information
  budget_pdf_url TEXT,
  
  -- Form completion status
  form_status TEXT CHECK (form_status IN ('draft', 'analyzing', 'completed', 'error')) DEFAULT 'draft',
  
  -- Additional metadata
  user_agent TEXT,
  ip_address INET,
  session_id TEXT,
  
  -- Feedback
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comments TEXT,
  feedback_submitted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public form)
-- Note: Adjust these policies based on your security requirements

-- Allow anyone to insert new orders (public form submission)
CREATE POLICY "Allow public order creation" ON public.orders 
  FOR INSERT 
  WITH CHECK (true);

-- Allow reading orders by email (so users can view their own orders)
CREATE POLICY "Allow users to view their own orders" ON public.orders 
  FOR SELECT 
  USING (client_email = current_setting('request.jwt.claims', true)::json->>'email' OR current_setting('app.current_user_email', true) = client_email);

-- Allow updates to orders by email (for status updates, feedback, etc.)
CREATE POLICY "Allow users to update their own orders" ON public.orders 
  FOR UPDATE 
  USING (client_email = current_setting('request.jwt.claims', true)::json->>'email' OR current_setting('app.current_user_email', true) = client_email);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_client_email ON public.orders(client_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_request_number ON public.orders(request_number);
CREATE INDEX IF NOT EXISTS idx_orders_form_status ON public.orders(form_status);
CREATE INDEX IF NOT EXISTS idx_orders_budget_status ON public.orders(budget_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.orders IS 'Stores all order data from the laser cutting form including client info, DXF analysis, material selection, and budget calculations';
COMMENT ON COLUMN public.orders.dxf_analysis_json IS 'Complete JSON response from DXF analysis backend including layers, vectors, and validation results';
COMMENT ON COLUMN public.orders.budget_json IS 'Complete JSON response from budget calculation backend including pricing breakdown';
COMMENT ON COLUMN public.orders.client_material_details IS 'JSON object containing material details when client provides their own material';
