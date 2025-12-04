-- Add appointment ID columns to pass_items table
ALTER TABLE pass_items
ADD COLUMN id_app_1 uuid REFERENCES entries(id) ON DELETE SET NULL,
ADD COLUMN id_app_2 uuid REFERENCES entries(id) ON DELETE SET NULL,
ADD COLUMN id_app_3 uuid REFERENCES entries(id) ON DELETE SET NULL;
