import { createClient } from '@supabase/supabase-js'

const supabase = createClient('http://localhost:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
// wait, I can just write a quick script that executes via vite or node if I have the env vars, but I don't know them.
