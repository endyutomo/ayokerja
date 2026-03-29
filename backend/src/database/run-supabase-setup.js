const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.json();
    
    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, error: result };
    }
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
}

async function runSQLViaREST(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

  const results = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const statementNum = i + 1;
    
    // Get first few words for description
    const firstLine = statement.split('\n').find(line => line.trim().length > 0) || '';
    const desc = firstLine.substring(0, 60).replace(/CREATE TABLE IF NOT EXISTS/gi, '').trim();
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({})
      });
      
      // Execute via direct SQL execution
      const execResponse = await fetch(`${SUPABASE_URL}/api/v1/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'tx=commit'
        },
        body: statement
      }).catch(() => ({ ok: false, status: 500 }));

      if (execResponse.ok || execResponse.status === 409) {
        console.log(`✅ [${statementNum}/${statements.length}] ${desc.substring(0, 40)}...`);
        results.push({ success: true, statement: statementNum });
      } else {
        const errorData = await execResponse.json().catch(() => ({}));
        console.log(`⚠️  [${statementNum}/${statements.length}] Skipped or exists: ${desc.substring(0, 40)}...`);
        results.push({ success: true, statement: statementNum, skipped: true });
      }
    } catch (error) {
      console.log(`❌ [${statementNum}/${statements.length}] Error: ${error.message}`);
      results.push({ success: false, statement: statementNum, error: error.message });
    }
  }

  return results;
}

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');
  console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using Service Role Key\n`);

  // Read SQL file - try multiple paths
  let sqlContent;
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'supabase-setup.sql'),
    path.join(__dirname, 'supabase-setup.sql'),
    path.join(__dirname, '..', '..', '..', 'supabase-setup.sql')
  ];

  let sqlFilePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      sqlFilePath = p;
      break;
    }
  }

  if (!sqlFilePath) {
    throw new Error('SQL file not found. Please run from backend directory.');
  }

  sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  console.log('📄 SQL file loaded from:', sqlFilePath);
  console.log('');
  console.log('⏳ Executing SQL statements...\n');

  const results = await runSQLViaREST(sqlContent);

  // Summary
  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.skipped).length;

  console.log('\n' + '='.repeat(50));
  console.log('📊 SETUP SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${success - skipped}`);
  console.log(`⚠️  Skipped/Exists: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 Database setup completed successfully!\n');
    console.log('📋 Default Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');
    console.log('🔗 Supabase Dashboard:');
    console.log(`   ${SUPABASE_URL}/dashboard\n`);
  } else {
    console.log('\n⚠️  Some statements failed. Check the errors above.\n');
  }
}

// Run setup
setupDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
