import { Settings } from 'lucide-react'

export default function SettingsPage() {
	return (
		<div className="flex items-center justify-center h-full bg-white">
			<div className="text-center">
				<div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
					<Settings className="w-8 h-8 text-muted-foreground" />
				</div>
				<h2 className="text-lg font-semibold text-gray-900">ตั้งค่า</h2>
				<p className="text-sm text-muted-foreground mt-1">จัดการการตั้งค่าระบบและทีมงาน</p>
			</div>
		</div>
	)
}
