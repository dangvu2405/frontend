import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type SummaryStats = {
  totalRevenue?: number
  totalOrders?: number
  totalProducts?: number
  totalUsers?: number
  totalCategories?: number
}

type SectionCardsProps = {
  stats?: SummaryStats
  loading?: boolean
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("vi-VN")

function Value({
  loading,
  children,
}: {
  loading?: boolean
  children: React.ReactNode
}) {
  if (loading) {
    return <Skeleton className="h-8 w-24" />
  }
  return (
    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
      {children}
    </CardTitle>
  )
}

export function SectionCards({ stats, loading }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Doanh thu</CardDescription>
          <Value loading={loading}>
            {currencyFormatter.format(stats?.totalRevenue ?? 0)}
          </Value>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Tổng
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Doanh thu tích lũy <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Tổng doanh thu từ các đơn hàng
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Đơn hàng</CardDescription>
          <Value loading={loading}>
            {numberFormatter.format(stats?.totalOrders ?? 0)}
          </Value>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Tổng
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tất cả đơn hàng đã ghi nhận{" "}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Bao gồm cả đơn đang xử lý và đã hoàn tất
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Sản phẩm</CardDescription>
          <Value loading={loading}>
            {numberFormatter.format(stats?.totalProducts ?? 0)}
          </Value>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Kho
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Số lượng sản phẩm đang kinh doanh{" "}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Bao gồm tất cả biến thể đã được tạo
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Khách hàng</CardDescription>
          <Value loading={loading}>
            {numberFormatter.format(stats?.totalUsers ?? 0)}
          </Value>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              Tài khoản
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tổng số tài khoản đang hoạt động{" "}
            <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Dựa trên bảng người dùng hiện có
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
