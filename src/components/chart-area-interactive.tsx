"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

type TopProductChartItem = {
  name: string
  sold: number
  revenue?: number
}

type ChartAreaInteractiveProps = {
  data?: TopProductChartItem[]
  loading?: boolean
  title?: string
  description?: string
}

const defaultChartConfig = {
  sold: {
    label: "Số lượng bán",
    color: "var(--primary)",
  },
  revenue: {
    label: "Doanh thu",
    color: "var(--secondary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({
  data = [],
  loading,
  title = "Top sản phẩm bán chạy",
  description = "Dựa trên số lượng sản phẩm đã bán",
}: ChartAreaInteractiveProps) {
  const chartData = React.useMemo(() => {
    if (!data?.length) {
      return Array.from({ length: 5 }).map((_, index) => ({
        name: `Sản phẩm ${index + 1}`,
        sold: 0,
        revenue: 0,
      }))
    }

    return data.map((item) => ({
      name: item.name,
      sold: item.sold,
      revenue: item.revenue ?? 0,
    }))
  }, [data])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[250px] w-full rounded-xl" />
        ) : (
          <ChartContainer
            config={defaultChartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillSold" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sold)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sold)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => value.toString()}
                  />
                }
              />
              <Area
                dataKey="sold"
                type="natural"
                fill="url(#fillSold)"
                stroke="var(--color-sold)"
                stackId="a"
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillRevenue)"
                stroke="var(--color-revenue)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
