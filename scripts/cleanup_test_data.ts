import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function cleanupTestData() {
  console.log('Cleaning up [TEST] applications and custom columns from live database...')

  const { data: delApps, error: errApps } = await supabase
    .from('applications')
    .delete()
    .like('company_name', '[TEST]%')
    .select()

  const { data: delCols, error: errCols } = await supabase
    .from('custom_columns')
    .delete()
    .like('name', '[TEST]%')
    .select()

  console.log(
    `Deleted ${delApps?.length ?? 0} test applications (Error: ${errApps?.message ?? 'none'})`
  )
  console.log(
    `Deleted ${delCols?.length ?? 0} test custom columns (Error: ${errCols?.message ?? 'none'})`
  )
}

cleanupTestData()
