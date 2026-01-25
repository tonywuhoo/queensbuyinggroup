import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listBuckets() {
  console.log('Listing all storage buckets...\n');
  
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No buckets found!');
    return;
  }
  
  console.log('Found buckets:');
  data.forEach((bucket, i) => {
    console.log(`${i + 1}. "${bucket.name}" (id: ${bucket.id}, public: ${bucket.public})`);
  });
}

listBuckets();
