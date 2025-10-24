#!/usr/bin/env tsx
/**
 * Migration runner script
 * Runs SQL migration files against the Supabase database
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
// Try multiple locations for .env file
const possibleEnvPaths = [
  resolve(__dirname, '../.env'),
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../../apps/web/.env.local'),
  resolve(__dirname, '../../../apps/web/.env.local'),
]

let envLoaded = false
for (const envPath of possibleEnvPaths) {
  const result = dotenv.config({ path: envPath })
  if (!result.error) {
    console.log(`✅ Loaded environment from: ${envPath}`)
    envLoaded = true
    break
  }
}

if (!envLoaded) {
  console.log('⚠️  No .env file found in expected locations')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file')
  process.exit(1)
}

// Get migration file from command line argument
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('Usage: npm run migrate -- <migration-file>')
  console.error('Example: npm run migrate -- migrations/003_auto_create_user_on_signup.sql')
  process.exit(1)
}

async function runMigration() {
  console.log('🔄 Starting migration...')
  console.log(`📄 Migration file: ${migrationFile}`)

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Read migration file
    const migrationPath = resolve(__dirname, '..', migrationFile)
    console.log(`📂 Reading from: ${migrationPath}`)

    const sql = readFileSync(migrationPath, 'utf-8')

    // Execute the SQL
    console.log('⚙️  Executing SQL...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // If exec_sql function doesn't exist, try direct query
      if (error.code === 'PGRST202' || (error.message && (error.message.includes('function') || error.message.includes('exec_sql')))) {
        console.log('\n❌ The exec_sql RPC function is not available.')
        console.log('ℹ️  This is expected - Supabase no longer supports direct SQL execution via RPC.\n')
        console.log('📋 Please run this SQL manually in your Supabase SQL Editor:\n')
        console.log('─'.repeat(80))
        console.log(sql)
        console.log('─'.repeat(80))
        console.log('\n✅ To run this migration:')
        console.log(`   1. Go to: ${supabaseUrl}/project/_/sql`)
        console.log('   2. Copy the SQL above')
        console.log('   3. Paste it into the SQL Editor')
        console.log('   4. Click "Run"\n')
        process.exit(0)
      }
      throw error
    }

    console.log('✅ Migration completed successfully!')
    if (data) {
      console.log('📊 Result:', data)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
