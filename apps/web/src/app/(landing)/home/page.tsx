import { Channels } from '@/components/landing/channels'
import { CTA } from '@/components/landing/cta'
import { Features } from '@/components/landing/features'
import { Hero } from '@/components/landing/hero'
import { Pricing } from '@/components/landing/pricing'
import { Stats } from '@/components/landing/stats'

export default function LandingPage() {
	return (
		<>
			<Hero />
			<Channels />
			<Stats />
			<Features />
			<Pricing />
			<CTA />
		</>
	)
}
