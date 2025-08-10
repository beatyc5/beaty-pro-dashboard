-- Create the cables table in Supabase
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS wgc_databasewgc_database_field_cables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cable_name VARCHAR(255) NOT NULL,
    cable_type VARCHAR(100) NOT NULL,
    length DECIMAL(10,2) NOT NULL,
    diameter DECIMAL(8,2) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    installation_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    location VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cables_cable_name ON wgc_databasewgc_database_field_cables(cable_name);
CREATE INDEX IF NOT EXISTS idx_cables_cable_type ON wgc_databasewgc_database_field_cables(cable_type);
CREATE INDEX IF NOT EXISTS idx_cables_status ON wgc_databasewgc_database_field_cables(status);
CREATE INDEX IF NOT EXISTS idx_cables_location ON wgc_databasewgc_database_field_cables(location);
CREATE INDEX IF NOT EXISTS idx_cables_created_at ON wgc_databasewgc_database_field_cables(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cables_updated_at 
    BEFORE UPDATE ON wgc_databasewgc_database_field_cables 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO wgc_databasewgc_database_field_cables (
    cable_name, 
    cable_type, 
    length, 
    diameter, 
    manufacturer, 
    installation_date, 
    status, 
    location, 
    notes
) VALUES 
    ('Main Power Cable A', 'Power', 150.00, 25.00, 'CableCo Inc', '2024-01-15', 'Active', 'Deck 1', 'Primary power distribution cable'),
    ('Data Cable B', 'Data', 200.00, 12.00, 'DataCable Ltd', '2024-02-20', 'Active', 'Deck 2', 'Ethernet data transmission'),
    ('Control Cable C', 'Control', 75.00, 8.00, 'ControlSys', '2024-03-10', 'Maintenance', 'Engine Room', 'Control system interface'),
    ('Emergency Power Cable', 'Power', 100.00, 30.00, 'EmergencyCable Corp', '2024-01-10', 'Active', 'Emergency Room', 'Backup power system'),
    ('Communication Cable D', 'Data', 180.00, 15.00, 'CommTech Solutions', '2024-02-15', 'Active', 'Bridge', 'Ship communication system'),
    ('Sensor Cable E', 'Control', 50.00, 6.00, 'SensorCable Inc', '2024-03-05', 'Inactive', 'Storage', 'Spare sensor cable'),
    ('Lighting Cable F', 'Power', 120.00, 18.00, 'LightCable Co', '2024-01-20', 'Active', 'Deck 3', 'Deck lighting system'),
    ('Navigation Cable G', 'Data', 90.00, 10.00, 'NavTech Ltd', '2024-02-25', 'Active', 'Navigation Room', 'GPS and navigation data'),
    ('HVAC Control Cable', 'Control', 60.00, 8.00, 'HVAC Systems', '2024-03-01', 'Active', 'HVAC Room', 'Climate control system'),
    ('Security Camera Cable', 'Data', 150.00, 12.00, 'SecurityCable Corp', '2024-01-30', 'Active', 'Security Room', 'CCTV system connection');

-- Enable Row Level Security (RLS) - optional for security
-- ALTER TABLE wgc_databasewgc_database_field_cables ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (if RLS is enabled)
-- CREATE POLICY "Allow public read access" ON wgc_databasewgc_database_field_cables
--     FOR SELECT USING (true);

-- Create policy for authenticated users to insert/update/delete (if RLS is enabled)
-- CREATE POLICY "Allow authenticated users full access" ON wgc_databasewgc_database_field_cables
--     FOR ALL USING (auth.role() = 'authenticated'); 