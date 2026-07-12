"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePetCore } from "../hooks/use-pet-core"
import { CreateEggCard } from "./create-egg-card"
import { EggUnhatchedCard } from "./egg-unhatched-card"
import { EggIncubatingCard } from "./egg-incubating-card"
import { HomeRoom } from "./home-room"
import { ErrorNotice } from "./error-notice"

function StatusCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children ? <CardContent>{children}</CardContent> : null}
    </Card>
  )
}

export function PetCorePanel() {
  const { data, isPending, isError } = usePetCore()

  if (isPending) {
    return (
      <StatusCard title="MochiPet" description="Đang tải trạng thái của bạn...">
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      </StatusCard>
    )
  }

  if (isError || !data) {
    return (
      <StatusCard title="MochiPet" description="Không tải được dữ liệu.">
        <ErrorNotice message="Không thể tải trạng thái Pet Core. Vui lòng tải lại trang." />
      </StatusCard>
    )
  }

  if (data.viewState === "pet" && data.pet) {
    return <HomeRoom pet={data.pet} />
  }
  if (data.viewState === "egg_incubating" && data.egg) {
    return <EggIncubatingCard egg={data.egg} />
  }
  if (data.viewState === "egg_unhatched" && data.egg) {
    return <EggUnhatchedCard egg={data.egg} />
  }
  return <CreateEggCard />
}
