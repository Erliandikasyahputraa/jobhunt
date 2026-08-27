import { Briefcase, Code, Users, CheckCircle2 } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

/**
 * Three-column value propositions section
 * Highlights benefits for job seekers, developers, and teams
 */
export function ValuePropositionsSection() {
  return (
    <AnimatedSection>
      <section className="px-4 py-16 sm:py-24" aria-label="Value propositions">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {/* For Job Seekers */}
            <div className="glass rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-brand text-white">
                <Briefcase className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">Untuk Job Seeker</h3>
              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Papan Kanban visual yang simpel & jelas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Responsif di ponsel maupun laptop</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Data pribadi aman dan terisolasi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Ekspor data kapan saja tanpa batasan</span>
                </li>
              </ul>
            </div>

            {/* For Developers */}
            <div className="glass rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-brand text-white">
                <Code className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">Untuk Developer</h3>
              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Source code 100% terbuka & modular</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Next.js 15 App Router & Server Actions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Supabase PostgreSQL dengan Row Level Security</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>600+ automated test suite terintegrasi</span>
                </li>
              </ul>
            </div>

            {/* For Community */}
            <div className="glass rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-brand text-white">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">Bebas & Terbuka</h3>
              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Bisa di-self-host secara mandiri</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Lisensi MIT bebas digunakan siapa saja</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Tanpa langganan tersembunyi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Didukung komunitas dan feedback aktif</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
