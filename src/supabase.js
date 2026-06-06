import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://avtlgmbspqdwuubkpxvk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2dGxnbWJzcHFkd3V1YmtweHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTY3NTgsImV4cCI6MjA5NjIzMjc1OH0.bIShHd_lGfoYnQa32IkcIhtAqARfuXuoiVnzjVnAaYg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)