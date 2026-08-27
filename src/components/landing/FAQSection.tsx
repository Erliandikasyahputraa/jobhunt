import { ChevronRight } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

/**
 * FAQ section with collapsible details
 * Uses HTML details/summary elements for accessibility
 */
export function FAQSection() {
  const faqs = [
    {
      question: 'Apakah aplikasi ini benar-benar gratis?',
      answer:
        'Ya! Anti-Nganggur berlisensi open-source MIT. Versi cloud dapat digunakan gratis tanpa biaya langganan. Kamu juga bisa melakukan self-host di infrastruktur sendiri kapan saja.',
    },
    {
      question: 'Bagaimana keamanan dan privasi data lamaran saya?',
      answer:
        'Sangat aman. Database kami dilindungi oleh PostgreSQL Row Level Security (RLS) di Supabase. Data lamaran kerja kamu hanya dapat diakses oleh akun kamu sendiri dan terisolasi dari pengguna lain.',
    },
    {
      question: 'Apakah saya bisa mengekspor data saya?',
      answer:
        'Tentu saja. Kamu dapat mengunduh seluruh data lamaran kerja kamu ke format CSV kapan saja melalui tombol ekspor di workspace.',
    },
    {
      question: 'Apakah ada fitur AI atau fitur lanjutan di masa depan?',
      answer:
        'Kami terus mengembangkan Anti-Nganggur secara bertahap, termasuk rencana fitur Focus Workspace, pengingat jadwal wawancara, dan integrasi bantuan resume.',
    },
    {
      question: 'Bagaimana cara berkontribusi ke proyek ini?',
      answer:
        'Kami menyambut baik segala bentuk kontribusi — mulai dari saran fitur, laporan bug, hingga pull request kode. Kunjungi repositori GitHub kami untuk panduan kontribusi.',
    },
  ]

  return (
    <AnimatedSection delay={500}>
      <section className="px-4 py-16 sm:py-24" aria-label="Frequently asked questions">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
              Pertanyaan yang Sering <span className="gradient-brand-text">Diajukan (FAQ)</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="glass group rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <summary className="cursor-pointer p-6 font-semibold text-foreground text-lg flex items-center justify-between hover:text-brand-primary">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-6 text-foreground/80 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
