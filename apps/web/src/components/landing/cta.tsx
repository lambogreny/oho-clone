import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function CTA() {
	return (
		<section className="py-20 lg:py-28 bg-primary">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
				<h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">พร้อมเปลี่ยนวิธีจัดการแชท?</h2>
				<p className="text-lg text-primary-100 mb-8 max-w-[50ch] mx-auto">
					เริ่มต้นใช้งานฟรี 14 วัน ไม่ต้องผูกบัตร ไม่มีข้อผูกมัด ทีมงานพร้อมช่วยเหลือคุณทุกขั้นตอน
				</p>
				<div className="flex flex-wrap justify-center gap-4">
					<Link href="/register">
						<Button
							variant="secondary"
							size="lg"
							className="bg-white text-primary hover:bg-gray-50 active:bg-gray-100 shadow-md"
						>
							เริ่มใช้งานฟรี
							<ArrowRight className="w-4 h-4 ml-2" />
						</Button>
					</Link>
					<Link href="/contact">
						<Button
							variant="ghost"
							size="lg"
							className="text-white border border-white/30 hover:bg-white/10"
						>
							ติดต่อทีมขาย
						</Button>
					</Link>
				</div>
			</div>
		</section>
	)
}
