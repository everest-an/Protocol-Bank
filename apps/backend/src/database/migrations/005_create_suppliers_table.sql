-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(42) NOT NULL UNIQUE,
  email VARCHAR(255),
  category VARCHAR(100) DEFAULT 'Other',
  phone VARCHAR(50),
  website VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_address ON suppliers(address);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);

-- Create index on name for search
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Insert sample data
INSERT INTO suppliers (name, address, email, category) VALUES
  ('Acme Corp', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'contact@acme.com', 'AI Services'),
  ('TechVendor Inc', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 'sales@techvendor.com', 'Software'),
  ('Global Logistics', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 'info@globallogistics.com', 'Logistics'),
  ('Marketing Pro', '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', 'hello@marketingpro.com', 'Marketing')
ON CONFLICT (address) DO NOTHING;

COMMENT ON TABLE suppliers IS 'Stores supplier/vendor information';
COMMENT ON COLUMN suppliers.address IS 'Ethereum address of the supplier';
COMMENT ON COLUMN suppliers.category IS 'Business category: AI Services, Marketing, Logistics, etc.';
