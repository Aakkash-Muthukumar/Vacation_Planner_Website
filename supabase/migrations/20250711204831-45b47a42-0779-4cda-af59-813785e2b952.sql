-- Create vacation_plans table
CREATE TABLE public.vacation_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  starting_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_people INTEGER NOT NULL DEFAULT 1,
  budget DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vacation_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own vacation plans" 
ON public.vacation_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vacation plans" 
ON public.vacation_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vacation plans" 
ON public.vacation_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vacation plans" 
ON public.vacation_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vacation_plans_updated_at
  BEFORE UPDATE ON public.vacation_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();