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
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
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
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('ℹ️  exec_sql function not found, using alternative method...')
        console.log('⚠️  Please run this SQL manually in your Supabase SQL Editor:')
        console.log('─'.repeat(80))
        console.log(sql)
        console.log('─'.repeat(80))
        console.log('\n✅ Copy the SQL above and run it in:')
        console.log(`   ${supabaseUrl}/project/_/sql`)
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
