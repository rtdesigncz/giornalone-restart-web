-- Create medical_sessions table
CREATE TABLE IF NOT EXISTS medical_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create medical_appointments table
CREATE TABLE IF NOT EXISTS medical_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES medical_sessions(id) ON DELETE CASCADE,
    time_slot TIME NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    price DECIMAL(10, 2) DEFAULT 35.00,
    is_paid BOOLEAN DEFAULT FALSE,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, time_slot)
);

-- Create medical_waiting_list table
CREATE TABLE IF NOT EXISTS medical_waiting_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    surname TEXT,
    phone TEXT,
    notes TEXT,
    contacted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE medical_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_waiting_list ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming public access for now as per previous pattern, or authenticated)
-- For simplicity in this project context, we often use public or anon access if auth isn't strict.
-- Adjusting to allow anon/service_role full access for now to avoid permission issues during dev.

CREATE POLICY "Enable all access for all users" ON medical_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON medical_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON medical_waiting_list FOR ALL USING (true) WITH CHECK (true);
