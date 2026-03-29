const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSQL(sql) {
  try {
    // Use Supabase SQL endpoint
    const response = await fetch(`${SUPABASE_URL}/api/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'tx=commit'
      },
      body: sql
    });

    const text = await response.text();
    
    if (response.ok) {
      return { success: true, data: text };
    } else {
      return { success: false, error: text, status: response.status };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using Service Role Key\n`);

  // Read SQL file
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'supabase-setup.sql'),
    path.join(__dirname, 'supabase-setup.sql')
  ];

  let sqlFilePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      sqlFilePath = p;
      break;
    }
  }

  if (!sqlFilePath) {
    throw new Error('SQL file not found.');
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('📄 SQL file loaded from:', sqlFilePath);
  console.log('');
  console.log('⏳ Executing SQL...\n');

  const result = await executeSQL(sqlContent);

  if (result.success) {
    console.log('✅ SQL executed successfully!\n');
    console.log('🎉 Database setup completed!\n');
    console.log('📋 Default Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');
    console.log('🔗 Verify at:');
    console.log(`   ${SUPABASE_URL}/dashboard/project/_/editor\n`);
  } else {
    console.log('❌ SQL execution failed:\n');
    console.log('Status:', result.status);
    console.log('Error:', result.error);
    console.log('\n💡 Try running the SQL manually in Supabase SQL Editor:');
    console.log(`   ${SUPABASE_URL}/dashboard/project/_/sql/new\n`);
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
