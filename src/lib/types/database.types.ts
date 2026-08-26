export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'phone_screen'
  | 'assessment'
  | 'take_home'
  | 'interviewing'
  | 'final_round'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted'

export interface Application {
  id: string
  user_id: string
  company_name: string
  company_id: string | null
  job_title: string
  job_url: string | null
  location: string | null
  salary_range: string | null
  job_description?: string | null
  company_logo_url?: string | null
  source?: string | null
  status: ApplicationStatus
  custom_column_id: string | null
  date_applied: string
  notes: string | null
  position: number
  created_at: string
  updated_at: string
}

export type ApplicationInsert = Omit<Application, 'id' | 'created_at' | 'updated_at' | 'user_id'>
export type ApplicationUpdate = Partial<Omit<Application, 'id' | 'user_id'>>

export interface CompanyDB {
  id: string
  user_id: string
  name: string
  website: string | null
  industry: string | null
  location: string | null
  linkedin_url: string | null
  github_url: string | null
  overview: string | null
  created_at: string
  updated_at: string
}

export type CompanyInsert = Omit<CompanyDB, 'id' | 'created_at' | 'updated_at' | 'user_id'>
export type CompanyUpdate = Partial<Omit<CompanyDB, 'id' | 'created_at' | 'updated_at' | 'user_id'>>

export interface CustomColumnDB {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string | null
  order: number
  created_at: string
  updated_at: string
}

export type CustomColumnInsert = Omit<
  CustomColumnDB,
  'id' | 'created_at' | 'updated_at' | 'user_id'
>
export type CustomColumnUpdate = Partial<
  Omit<CustomColumnDB, 'id' | 'created_at' | 'updated_at' | 'user_id'>
>
