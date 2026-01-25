import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listFiles() {
  console.log('Listing files in "labels" bucket...\n');
  
  // List root
  const { data, error } = await supabase.storage
    .from('labels')
    .list('', { limit: 100 });
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Root contents:');
  data?.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.name} (${item.id ? 'file' : 'folder'})`);
  });
  
  // List contents of each folder
  for (const folder of data || []) {
    if (!folder.id) { // It's a folder
      console.log(`\nContents of "${folder.name}":`);
      const { data: files, error: folderError } = await supabase.storage
        .from('labels')
        .list(folder.name, { limit: 100 });
      
      if (folderError) {
        console.error('  Error:', folderError.message);
        continue;
      }
      
      files?.forEach((file, i) => {
        console.log(`  ${i + 1}. ${file.name}`);
      });
      
      // Try to get signed URL for first file in folder
      if (files && files.length > 0 && files[0].id) {
        const fullPath = `${folder.name}/${files[0].name}`;
        console.log(`\n  Trying signed URL for: ${fullPath}`);
        
        const { data: urlData, error: urlError } = await supabase.storage
          .from('labels')
          .createSignedUrl(fullPath, 3600);
        
        if (urlError) {
          console.error('  Signed URL error:', urlError);
        } else {
          console.log('  Signed URL:', urlData?.signedUrl?.substring(0, 100) + '...');
        }
      }
    }
  }
}

listFiles();
