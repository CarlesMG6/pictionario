import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezdjyncsllalhetazfer.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZGp5bmNzbGxhbGhldGF6ZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjUwMjcsImV4cCI6MjA2NjI0MTAyN30.JTut3GW7j5hZpN7JnegurFwHzQm8UiniwvNHe3jxLFY';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);