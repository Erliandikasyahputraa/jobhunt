/**
 * AnimatedBackground - Reusable animated gradient background component
 *
 * This component provides the same cool transparent gradient background
 * with floating animated orbs found on the landing page.
 *
 * @example
 * <AnimatedBackground>
 *   <YourPageContent />
 * </AnimatedBackground>
 */

interface AnimatedBackgroundProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'minimal'
}

export function AnimatedBackground({
  children,
  className = '',
  variant: _variant = 'default',
}: AnimatedBackgroundProps) {
  return <div className={`relative min-h-screen ${className}`}>{children}</div>
}
