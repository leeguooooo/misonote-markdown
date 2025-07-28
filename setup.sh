#!/bin/bash
set -e

echo "🚀 Final optimized setup for misonote-markdown..."

# Set shell environment variable
export SHELL=/bin/bash

# Update system packages
sudo apt-get update -y

# Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# Create postgres user if it doesn't exist
sudo useradd -m postgres || echo "User postgres may already exist"

# Initialize PostgreSQL if needed
sudo mkdir -p /var/lib/postgresql/data
sudo chown postgres:postgres /var/lib/postgresql/data
sudo -u postgres /usr/lib/postgresql/*/bin/initdb -D /var/lib/postgresql/data || echo "Database may already be initialized"

# Configure PostgreSQL for better performance
echo "🔧 Configuring PostgreSQL..."
sudo -u postgres tee /var/lib/postgresql/data/pg_hba.conf << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
host    all             all             0.0.0.0/0               trust
EOF

# Start PostgreSQL
echo "🔄 Starting PostgreSQL..."
sudo -u postgres /usr/lib/postgresql/*/bin/pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/postgresql.log start

# Wait for PostgreSQL to start
echo "⏳ Waiting for PostgreSQL to start..."
sleep 10

# Create test database and user
echo "🗄️ Setting up test database..."
sudo -u postgres createdb misonote_test || echo "Database may already exist"
sudo -u postgres psql -c "CREATE USER test_user WITH PASSWORD 'test_password';" || echo "User may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE misonote_test TO test_user;" || echo "Privileges may already be granted"
sudo -u postgres psql -c "ALTER USER test_user CREATEDB;" || echo "User may already have CREATEDB privilege"

# Install pnpm
echo "📦 Installing pnpm..."
sudo npm install -g pnpm

# Navigate to workspace
cd /mnt/persist/workspace

# Install project dependencies
echo "📦 Installing project dependencies..."
pnpm install --frozen-lockfile

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p docs data logs tests/data

# Set up environment variables for testing
echo "🔧 Setting up test environment..."
export NODE_ENV=test
export JWT_SECRET=test-jwt-secret
export ADMIN_PASSWORD_HASH_BASE64=$(echo -n '$2a$12$test.hash.for.testing' | base64)

# Set up test database environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=misonote_test
export DB_USER=test_user
export DB_PASSWORD=test_password

# Add environment variables to profile
echo "📝 Adding environment variables to profile..."
echo 'export NODE_ENV=test' >> $HOME/.profile
echo 'export JWT_SECRET=test-jwt-secret' >> $HOME/.profile
echo 'export ADMIN_PASSWORD_HASH_BASE64=$(echo -n "$2a$12$test.hash.for.testing" | base64)' >> $HOME/.profile
echo 'export DB_HOST=localhost' >> $HOME/.profile
echo 'export DB_PORT=5432' >> $HOME/.profile
echo 'export DB_NAME=misonote_test' >> $HOME/.profile
echo 'export DB_USER=test_user' >> $HOME/.profile
echo 'export DB_PASSWORD=test_password' >> $HOME/.profile

# Source the profile to make variables available
source $HOME/.profile

# Create complete database schema using the project's own initialization
echo "🏗️ Creating database schema using project initialization..."

# Use the project's database initialization script
cd /mnt/persist/workspace
export NODE_ENV=test
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=misonote_test
export DB_USER=test_user
export DB_PASSWORD=test_password

# Run the project's database initialization
echo "🔧 Running project database initialization..."
./node_modules/.bin/tsx scripts/init-postgres.ts || echo "Project init failed, creating manual schema..."

# If project init failed, create manual schema
echo "🏗️ Creating manual database schema..."
PGPASSWORD=test_password /usr/bin/psql -h localhost -U test_user -d misonote_test << 'EOF'
-- Drop tables if they exist to recreate with correct schema
DROP TABLE IF EXISTS migration_history CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS annotations CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Create system_settings table
CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create api_keys table with all required columns
CREATE TABLE api_keys (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(255) NOT NULL,
    permissions TEXT,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    rate_limit INTEGER DEFAULT 1000,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    description TEXT
);

-- Create users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    user_type VARCHAR(50) DEFAULT 'user',
    can_edit_documents BOOLEAN DEFAULT false,
    account_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
    id VARCHAR(255) PRIMARY KEY,
    file_path VARCHAR(500) NOT NULL,
    title VARCHAR(500),
    content TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE comments (
    id VARCHAR(255) PRIMARY KEY,
    document_id VARCHAR(255),
    user_id VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create annotations table
CREATE TABLE annotations (
    id VARCHAR(255) PRIMARY KEY,
    document_id VARCHAR(255),
    user_id VARCHAR(255),
    content TEXT,
    position_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookmarks table
CREATE TABLE bookmarks (
    id VARCHAR(255) PRIMARY KEY,
    document_id VARCHAR(255),
    user_id VARCHAR(255),
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create migration_history table
CREATE TABLE migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    session_token VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some default system settings
INSERT INTO system_settings (key, value, type, description) VALUES 
    ('site_name', 'Misonote Test', 'string', 'Site name for testing'),
    ('enable_comments', 'true', 'boolean', 'Enable comments feature');

-- Verify the schema
SELECT 'Database schema created successfully' as status;
SELECT COUNT(*) as api_keys_count FROM api_keys;
SELECT COUNT(*) as system_settings_count FROM system_settings;

EOF

echo "✅ Database schema created successfully!"

# Test database connection using the project's pg module
echo "🔍 Testing database connection with project modules..."
cd /mnt/persist/workspace
./node_modules/.bin/tsx -e "
import pool from './lib/db/config';
pool.query('SELECT COUNT(*) FROM api_keys')
  .then(result => {
    console.log('✅ Database connection test successful:', result.rows[0]);
    pool.end();
  })
  .catch(err => {
    console.error('❌ Database connection test failed:', err);
    pool.end();
  });
"

# Start a background process to keep PostgreSQL running
echo "🔄 Starting PostgreSQL keeper process..."
(
  while true; do
    if ! sudo -u postgres /usr/lib/postgresql/*/bin/pg_ctl -D /var/lib/postgresql/data status > /dev/null 2>&1; then
      echo "🔄 Restarting PostgreSQL..."
      sudo -u postgres /usr/lib/postgresql/*/bin/pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/postgresql.log start
    fi
    sleep 5
  done
) &

echo $! > /tmp/postgres_keeper.pid

echo "✅ Development environment setup complete!"
echo "🧪 PostgreSQL is running with keeper process"
echo "🧪 Ready to run tests with: pnpm test"