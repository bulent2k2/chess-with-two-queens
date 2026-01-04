import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://ayuukuocywgowspgjpje.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjhkZmVmYjUwLWU1ODUtNDZhYS04Y2U1LWI3YmQwMTY1OGYwNyJ9.eyJwcm9qZWN0SWQiOiJheXV1a3VvY3l3Z293c3BnanBqZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1Mjk1MDU0LCJleHAiOjIwODA2NTUwNTQsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.0HkWE_FnbPG_o6TRDqIAryYx-WIbP5kUiXcdReFYTF8';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };