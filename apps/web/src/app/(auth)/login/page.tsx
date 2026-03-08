'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const loginSchema = z.object({
	email: z.string().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
	password: z.string().min(1, 'กรุณากรอกรหัสผ่าน').min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
	const router = useRouter()
	const [showPassword, setShowPassword] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	})

	const onSubmit = async (_data: LoginFormValues) => {
		// TODO: Implement actual authentication via tRPC
		await new Promise((resolve) => setTimeout(resolve, 1000))
		router.push('/app')
	}

	return (
		<div className="w-full max-w-sm">
			{/* Mobile logo — hidden on desktop (shown in left panel) */}
			<div className="flex flex-col items-center mb-8 lg:hidden">
				<div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
					<MessageSquare className="w-6 h-6 text-primary-foreground" />
				</div>
				<h1 className="text-xl font-bold text-gray-900">OHO Chat</h1>
			</div>

			<Card className="border-0 shadow-md lg:shadow-lg">
				<CardHeader className="text-center pb-2">
					<h2 className="text-xl font-bold text-gray-900">เข้าสู่ระบบ</h2>
					<p className="text-sm text-muted-foreground mt-1">เข้าสู่ระบบเพื่อจัดการแชทของคุณ</p>
				</CardHeader>

				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{/* Email */}
						<div className="space-y-2">
							<Label htmlFor="email">อีเมล</Label>
							<Input
								id="email"
								type="email"
								placeholder="you@company.com"
								autoComplete="email"
								aria-invalid={!!errors.email}
								aria-describedby={errors.email ? 'email-error' : undefined}
								{...register('email')}
							/>
							{errors.email && (
								<p id="email-error" className="text-xs text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>

						{/* Password */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">รหัสผ่าน</Label>
								<Link href="/forgot-password" className="text-xs text-primary hover:underline">
									ลืมรหัสผ่าน?
								</Link>
							</div>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="••••••••"
									autoComplete="current-password"
									aria-invalid={!!errors.password}
									aria-describedby={errors.password ? 'password-error' : undefined}
									className="pr-10"
									{...register('password')}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-600 transition-colors"
									aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
								>
									{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
							{errors.password && (
								<p id="password-error" className="text-xs text-destructive">
									{errors.password.message}
								</p>
							)}
						</div>

						{/* Submit */}
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									กำลังเข้าสู่ระบบ...
								</>
							) : (
								'เข้าสู่ระบบ'
							)}
						</Button>
					</form>

					<div className="relative my-6">
						<Separator />
						<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-muted-foreground">
							หรือ
						</span>
					</div>

					{/* Social login */}
					<div className="space-y-2.5">
						<Button variant="outline" className="w-full" type="button">
							<svg className="w-4 h-4" viewBox="0 0 24 24">
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									fill="#EA4335"
								/>
							</svg>
							เข้าสู่ระบบด้วย Google
						</Button>
					</div>

					<p className="text-sm text-center text-muted-foreground mt-6">
						ยังไม่มีบัญชี?{' '}
						<Link href="/register" className="text-primary font-medium hover:underline">
							สมัครใช้งานฟรี
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
