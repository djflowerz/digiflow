/**
 * supabase-client.js
 * Supabase client initialization with secure configuration
 */

// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://yxtecpqwqnnflwwpgekq.supabase.co',
    // Using anon public key - safe for client-side use (read-only operations)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGVjcHF3cW5uZmx3d3BnZWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDkzMTQsImV4cCI6MjA4MDgyNTMxNH0.6kiMpKkiNdVR_arCsrQwS5uJ0FmAg43JIigGBGczAKQ'
};

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Export for use in other modules
window.supabaseClient = supabaseClient;

console.log('Supabase client initialized successfully');
