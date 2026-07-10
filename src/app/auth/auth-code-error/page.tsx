import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Lỗi xác thực · MochiPet",
}

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Không thể xác thực</CardTitle>
            <CardDescription>
              Liên kết xác thực không hợp lệ hoặc đã hết hạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Quay lại đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
