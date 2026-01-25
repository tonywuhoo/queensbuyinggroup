import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  console.log('Creating "labels" storage bucket...');
  
  const { data, error } = await supabase.storage.createBucket('labels', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✓ Bucket "labels" already exists');
    } else {
      console.error('Error creating bucket:', error.message);
    }
  } else {
    console.log('✓ Bucket "labels" created successfully!');
  }
}

createBucket().catch(console.error);
