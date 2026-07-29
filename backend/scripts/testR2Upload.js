import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { processAndUploadMedia } from '../src/utils/mediaOptimizer.js';
import { isR2Configured } from '../src/services/r2Service.js';

async function runTest() {
  console.log('--- TESTING CLOUDFLARE R2 INTEGRATION ---');
  console.log('Is R2 Configured:', isR2Configured());
  console.log('Endpoint:', process.env.R2_ENDPOINT);
  console.log('Bucket:', process.env.R2_BUCKET_NAME);
  console.log('Public URL:', process.env.R2_PUBLIC_URL);

  // 1x1 transparent PNG buffer
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  try {
    const result = await processAndUploadMedia({
      buffer: samplePngBuffer,
      originalname: 'test_product.png',
      folder: 'products',
      entityId: 'test_item_101',
    });

    console.log('\n✅ Upload Success!');
    console.log('Returned URL:', result.url);
    console.log('Key:', result.key);
  } catch (err) {
    console.error('\n❌ Upload Failed:', err);
    process.exit(1);
  }
}

runTest();
