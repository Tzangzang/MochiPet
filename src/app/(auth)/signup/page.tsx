import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SignupForm } from "@/features/auth/components/signup-form"
import { getAuthMessage } from "@/features/auth/messages"

export const metadata: Metadata = {
  title: "Đăng ký · MochiPet",
  description: "Tạo tài khoản MochiPet và bắt đầu nuôi thú ảo đồng hành.",
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  const status = getAuthMessage(message)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo tài khoản</CardTitle>
        <CardDescription>Bắt đầu hành trình cùng MochiPet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status ? (
          <Alert>
            <AlertDescription>{status.text}</AlertDescription>
          </Alert>
        ) : null}
        <SignupForm />
      </CardContent>
    </Card>
  )
}
