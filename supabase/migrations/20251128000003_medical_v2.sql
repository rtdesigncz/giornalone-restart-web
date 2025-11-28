-- Add start_time and end_time to medical_sessions
ALTER TABLE medical_sessions 
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '15:00',
ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '18:00';

-- Add client_surname to medical_appointments
ALTER TABLE medical_appointments 
ADD COLUMN IF NOT EXISTS client_surname TEXT;
