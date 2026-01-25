import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPolicies() {
  console.log('Setting up storage policies for "labels" bucket...\n');

  // The policies need to be created via SQL since the JS client doesn't support it directly
  // We'll use the Supabase SQL editor approach
  
  const policies = [
    {
      name: 'Allow authenticated uploads',
      sql: `
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'labels');
      `
    },
    {
      name: 'Allow public downloads',
      sql: `
        CREATE POLICY "Allow public downloads" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'labels');
      `
    },
    {
      name: 'Allow authenticated deletes',
      sql: `
        CREATE POLICY "Allow authenticated deletes" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'labels');
      `
    }
  ];

  console.log('Please run these SQL commands in your Supabase SQL Editor:');
  console.log('(Dashboard → SQL Editor → New Query)\n');
  console.log('='.repeat(60));
  
  for (const policy of policies) {
    console.log(`\n-- ${policy.name}`);
    console.log(policy.sql.trim());
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\nAlternatively, go to Storage → labels → Policies and create:');
  console.log('1. INSERT policy for "authenticated" role');
  console.log('2. SELECT policy for "public" (or "authenticated")');
  console.log('3. DELETE policy for "authenticated" role');
}

setupPolicies();
