const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://laqllcisijtcormbdwev.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcWxsY2lzaWp0Y29ybWJkd2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDgxODksImV4cCI6MjA3ODg4NDE4OX0.Gh9zqse56qGXS6mE04zSFuiIs3s3URp7PGxRj9be4qA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDomains() {
    const { data, error } = await supabase
        .from('habits')
        .select('domain');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const domains = [...new Set(data.map(h => h.domain))];
    console.log('Unique domains in DB:', domains);
}

checkDomains();
