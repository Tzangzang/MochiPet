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
import { CoParentPanel } from "@/features/coop/components/co-parent-panel"
import { JoinByCode } from "@/features/coop/components/join-by-code"

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
    return (
      <div className="space-y-6">
        <HomeRoom pet={data.pet} />
        <CoParentPanel petId={data.pet.id} />
      </div>
    )
  }
  if (data.viewState === "egg_incubating" && data.egg) {
    return (
      <div className="space-y-6">
        <EggIncubatingCard egg={data.egg} />
        <JoinCard />
      </div>
    )
  }
  if (data.viewState === "egg_unhatched" && data.egg) {
    return (
      <div className="space-y-6">
        <EggUnhatchedCard egg={data.egg} />
        <JoinCard />
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <CreateEggCard />
      <JoinCard />
    </div>
  )
}

function JoinCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuôi cùng</CardTitle>
        <CardDescription>Có mã mời từ chủ nuôi? Nhập để cùng chăm Mochi.</CardDescription>
      </CardHeader>
      <CardContent>
        <JoinByCode />
      </CardContent>
    </Card>
  )
}
