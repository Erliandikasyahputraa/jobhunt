import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function runLiveVerification() {
  console.log('====================================================')
  console.log('  JOBHUNT — LIVE SUPABASE STATUS & TIMELINE TEST   ')
  console.log('====================================================\n')

  // 1. Identify User ID from existing applications
  const { data: existingApps, error: fetchErr } = await supabase
    .from('applications')
    .select('user_id')
    .limit(1)

  if (fetchErr || !existingApps || existingApps.length === 0) {
    console.error('Could not find user_id from existing applications:', fetchErr)
    return
  }

  const userId = existingApps[0].user_id
  console.log(`[Target User ID]: ${userId}\n`)

  // 2. Create Isolated Custom Columns for Test
  console.log('Step 1: Setting up isolated test custom columns...')
  const colAlphaData = {
    user_id: userId,
    name: '[TEST] Column Alpha',
    description: 'Test workflow stage Alpha',
    icon: 'briefcase',
    order: 10,
  }
  const colBetaData = {
    user_id: userId,
    name: '[TEST] Column Beta',
    description: 'Test workflow stage Beta',
    icon: 'user-check',
    order: 11,
  }
  const colGammaData = {
    user_id: userId,
    name: '[TEST] Column Gamma',
    description: 'Test workflow stage Gamma',
    icon: 'award',
    order: 12,
  }

  // Clean up any old test columns first
  await supabase.from('custom_columns').delete().eq('user_id', userId).like('name', '[TEST]%')

  const { data: colA, error: errA } = await supabase
    .from('custom_columns')
    .insert(colAlphaData)
    .select()
    .single()
  const { data: colB, error: errB } = await supabase
    .from('custom_columns')
    .insert(colBetaData)
    .select()
    .single()
  const { data: colC, error: errC } = await supabase
    .from('custom_columns')
    .insert(colGammaData)
    .select()
    .single()

  if (errA || errB || errC || !colA || !colB || !colC) {
    console.error('Failed to create test custom columns:', { errA, errB, errC })
    return
  }
  console.log(`✓ Created test columns: Alpha (${colA.id}), Beta (${colB.id}), Gamma (${colC.id})\n`)

  // Clean up any old test applications
  await supabase.from('applications').delete().eq('user_id', userId).like('company_name', '[TEST]%')

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Status Lifecycle (Applied -> Phone Screen -> Interview -> Final Round)
  // ---------------------------------------------------------------------------
  console.log('Step 2: Testing Scenario 1 — Pure Status Lifecycle...')
  const { data: app1, error: app1Err } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      company_name: '[TEST] Acme Corp',
      job_title: 'Lead Software Architect',
      status: 'applied',
      date_applied: '2026-08-01',
      location: 'Remote',
      salary_range: '$200k - $250k',
    })
    .select()
    .single()

  if (app1Err || !app1) {
    console.error('Failed to create test app 1:', app1Err)
    return
  }
  console.log(
    `✓ Created Application: "${app1.job_title}" (ID: ${app1.id}) with initial status: "applied"`
  )

  await sleep(1000)
  console.log('  -> Transition 1: applied -> phone_screen')
  await supabase
    .from('applications')
    .update({ status: 'phone_screen', updated_at: new Date().toISOString() })
    .eq('id', app1.id)

  await sleep(1000)
  console.log('  -> Transition 2: phone_screen -> interviewing (Interview)')
  await supabase
    .from('applications')
    .update({ status: 'interviewing', updated_at: new Date().toISOString() })
    .eq('id', app1.id)

  await sleep(1000)
  console.log('  -> Transition 3: interviewing -> final_round')
  await supabase
    .from('applications')
    .update({ status: 'final_round', updated_at: new Date().toISOString() })
    .eq('id', app1.id)

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Custom Column Movement (Column Alpha -> Column Beta -> Column Gamma)
  // ---------------------------------------------------------------------------
  console.log('\nStep 3: Testing Scenario 2 — Custom Column Movement...')
  const { data: app2, error: app2Err } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      company_name: '[TEST] Stripe Labs',
      job_title: 'Staff Systems Engineer',
      status: 'phone_screen',
      custom_column_id: colA.id,
      date_applied: '2026-08-05',
    })
    .select()
    .single()

  if (app2Err || !app2) {
    console.error('Failed to create test app 2:', app2Err)
    return
  }
  console.log(
    `✓ Created Application: "${app2.job_title}" (ID: ${app2.id}) in column: "${colA.name}"`
  )

  await sleep(1000)
  console.log('  -> Move 1: Column Alpha -> Column Beta')
  await supabase
    .from('applications')
    .update({ custom_column_id: colB.id, updated_at: new Date().toISOString() })
    .eq('id', app2.id)

  await sleep(1000)
  console.log('  -> Move 2: Column Beta -> Column Gamma')
  await supabase
    .from('applications')
    .update({ custom_column_id: colC.id, updated_at: new Date().toISOString() })
    .eq('id', app2.id)

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Simultaneous Status & Column Change
  // ---------------------------------------------------------------------------
  console.log('\nStep 4: Testing Scenario 3 — Combined Status & Column Movement...')
  const { data: app3, error: app3Err } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      company_name: '[TEST] Anthropic AI',
      job_title: 'Principal Research Scientist',
      status: 'applied',
      custom_column_id: colA.id,
      date_applied: '2026-08-10',
    })
    .select()
    .single()

  if (app3Err || !app3) {
    console.error('Failed to create test app 3:', app3Err)
    return
  }
  console.log(`✓ Created Application: "${app3.job_title}" (ID: ${app3.id})`)

  await sleep(1000)
  console.log('  -> Combined: (applied, Column Alpha) -> (interviewing, Column Beta)')
  await supabase
    .from('applications')
    .update({
      status: 'interviewing',
      custom_column_id: colB.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', app3.id)

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Unrelated Field Update (Must NOT trigger status history)
  // ---------------------------------------------------------------------------
  console.log('\nStep 5: Testing Scenario 4 — Unrelated Field Updates...')
  await sleep(1000)
  console.log('  -> Updating notes and salary_range on App 1 without changing status/column...')
  await supabase
    .from('applications')
    .update({
      notes: 'Reviewed recruiter notes. Impressed by infrastructure scale.',
      salary_range: '$220k - $270k',
      updated_at: new Date().toISOString(),
    })
    .eq('id', app1.id)

  // ---------------------------------------------------------------------------
  // FORENSIC ASSERTIONS & VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n====================================================')
  console.log('  FORENSIC ASSERTIONS ON LIVE application_status_history ')
  console.log('====================================================\n')

  // Query status history for App 1
  const { data: hist1 } = await supabase
    .from('application_status_history')
    .select('*')
    .eq('application_id', app1.id)
    .order('created_at', { ascending: true })

  console.log(`App 1 History Events (${hist1?.length} rows):`)
  hist1?.forEach((h, i) => {
    console.log(
      `  [${i + 1}] ${h.from_status ?? 'NULL (Created)'} -> ${h.to_status} (at: ${h.created_at})`
    )
  })

  // Assertions for App 1:
  // Expected: 4 rows (1 creation + 3 status transitions)
  // Unrelated notes update must NOT have added a 5th row!
  console.log('\nAsserting App 1 Status Flow:')
  console.log(
    '  ✓ Initial Baseline Row exists:',
    hist1?.[0]?.from_status === null && hist1?.[0]?.to_status === 'applied'
  )
  console.log(
    '  ✓ Transition 1 (applied -> phone_screen):',
    hist1?.[1]?.from_status === 'applied' && hist1?.[1]?.to_status === 'phone_screen'
  )
  console.log(
    '  ✓ Transition 2 (phone_screen -> interviewing):',
    hist1?.[2]?.from_status === 'phone_screen' && hist1?.[2]?.to_status === 'interviewing'
  )
  console.log(
    '  ✓ Transition 3 (interviewing -> final_round):',
    hist1?.[3]?.from_status === 'interviewing' && hist1?.[3]?.to_status === 'final_round'
  )
  console.log(
    '  ✓ Unrelated notes update did NOT create extra event (Total is 4):',
    hist1?.length === 4
  )

  // Query status history for App 2 (Column moves)
  const { data: hist2 } = await supabase
    .from('application_status_history')
    .select('*')
    .eq('application_id', app2.id)
    .order('created_at', { ascending: true })

  console.log(`\nApp 2 History Events (${hist2?.length} rows):`)
  hist2?.forEach((h, i) => {
    console.log(
      `  [${i + 1}] Column: ${h.from_custom_column_id ?? 'NULL'} -> ${h.to_custom_column_id} (Status: ${h.from_status ?? 'NULL'} -> ${h.to_status}, at: ${h.created_at})`
    )
  })

  console.log('\nAsserting App 2 Custom Column Flow:')
  console.log('  ✓ Initial Baseline in Column Alpha:', hist2?.[0]?.to_custom_column_id === colA.id)
  console.log(
    '  ✓ Move 1 (Alpha -> Beta):',
    hist2?.[1]?.from_custom_column_id === colA.id && hist2?.[1]?.to_custom_column_id === colB.id
  )
  console.log(
    '  ✓ Move 2 (Beta -> Gamma):',
    hist2?.[2]?.from_custom_column_id === colB.id && hist2?.[2]?.to_custom_column_id === colC.id
  )

  // Query status history for App 3 (Combined status + column)
  const { data: hist3 } = await supabase
    .from('application_status_history')
    .select('*')
    .eq('application_id', app3.id)
    .order('created_at', { ascending: true })

  console.log(`\nApp 3 History Events (${hist3?.length} rows):`)
  hist3?.forEach((h, i) => {
    console.log(
      `  [${i + 1}] Status: ${h.from_status ?? 'NULL'} -> ${h.to_status} | Column: ${h.from_custom_column_id ?? 'NULL'} -> ${h.to_custom_column_id}`
    )
  })

  console.log('\nAsserting App 3 Combined Flow:')
  console.log(
    '  ✓ Combined Transition:',
    hist3?.[1]?.from_status === 'applied' &&
      hist3?.[1]?.to_status === 'interviewing' &&
      hist3?.[1]?.from_custom_column_id === colA.id &&
      hist3?.[1]?.to_custom_column_id === colB.id
  )

  console.log('\n====================================================')
  console.log('  TEST DATA READY FOR BROWSER INSPECTION')
  console.log('====================================================')
  console.log(`1. [TEST] Acme Corp (ID: ${app1.id}) - Final Round`)
  console.log(`2. [TEST] Stripe Labs (ID: ${app2.id}) - Phone Screen in [TEST] Column Gamma`)
  console.log(`3. [TEST] Anthropic AI (ID: ${app3.id}) - Interview in [TEST] Column Beta`)
}

runLiveVerification()
