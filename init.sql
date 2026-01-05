-- ============================================
-- Database Initialization
-- ============================================

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create email history table
CREATE TABLE IF NOT EXISTS email_history (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER REFERENCES subscribers(id),
    subject VARCHAR(500) NOT NULL,
--    body VARCHAR(5000) NOT NULL,
    product_id VARCHAR(100),
    product_name VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_email_history_subscriber ON email_history(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);

-- ============================================
-- Seed Data - Sample Subscribers
-- ============================================

INSERT INTO subscribers (email, first_name, last_name) VALUES
    ('john.doe@example.com', 'John', 'Doe'),
    ('jane.smith@example.com', 'Jane', 'Smith'),
    ('alice.wonder@example.com', 'Alice', 'Wonder'),
    ('bob.builder@example.com', 'Bob', 'Builder'),
    ('charlie.brown@example.com', 'Charlie', 'Brown')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Useful Views
-- ============================================

-- View for subscriber stats
CREATE OR REPLACE VIEW subscriber_stats AS
SELECT 
    COUNT(*) as total_subscribers,
    COUNT(CASE WHEN is_active THEN 1 END) as active_subscribers,
    COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_subscribers
FROM subscribers;

-- View for email stats
CREATE OR REPLACE VIEW email_stats AS
SELECT 
    COUNT(*) as total_emails,
    COUNT(DISTINCT subscriber_id) as unique_recipients,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    MAX(sent_at) as last_email_sent
FROM email_history;




