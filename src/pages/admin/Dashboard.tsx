import { useEffect, useMemo, useState } from "react"

import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import adminService from "@/services/adminService"

type SummaryStats = {
  totalRevenue?: number
  totalOrders?: number
  totalProducts?: number
  totalUsers?: number
  totalCategories?: number
}

type ChartItem = {
  name: string
  sold: number
  revenue?: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null)
  const [topProductsChart, setTopProductsChart] = useState<ChartItem[]>([])
  const [monthlyOrdersChart, setMonthlyOrdersChart] = useState<ChartItem[]>([])
  const [topCustomersChart, setTopCustomersChart] = useState<ChartItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)

        const [
          summaryRes,
          topProductsRes,
          monthlyOrdersRes,
          topCustomersRes,
        ] =
          await Promise.all([
            adminService.getSummaryStats(),
            adminService.getTopProducts({ limit: 8 }),
            adminService.getMonthlyOrdersStats({ months: 6 }),
            adminService.getTopCustomersByOrders({ limit: 6 }),
          ])

        if (!isMounted) return

        const summaryData =
          (summaryRes as any)?.data ?? (summaryRes as SummaryStats) ?? {}

        setSummaryStats({
          totalProducts: summaryData.totalProducts,
          totalCategories: summaryData.totalCategories,
          totalUsers: summaryData.totalUsers,
          totalOrders: summaryData.totalOrders || 0,
          totalRevenue: summaryData.totalRevenue || 0,
        })

        const topProductData =
          ((topProductsRes as any)?.data ?? topProductsRes) || []
        setTopProductsChart(
          topProductData.map((product: any) => ({
            name: product?.TenSanPham ?? "Không tên",
            sold: Number(product?.DaBan ?? 0),
            revenue:
              typeof product?.Gia === "number" && typeof product?.DaBan === "number"
                ? product.Gia * product.DaBan
                : undefined,
          }))
        )

        const monthlyOrdersData =
          ((monthlyOrdersRes as any)?.data ?? monthlyOrdersRes) || []
        setMonthlyOrdersChart(
          monthlyOrdersData.map((item: any) => ({
            name: item?.month && item?.year
              ? `Tháng ${String(item.month).padStart(2, "0")}/${item.year}`
              : "Không xác định",
            sold: Number(item?.totalOrders ?? 0),
            revenue: Number(item?.totalRevenue ?? 0),
          }))
        )

        const topCustomersData =
          ((topCustomersRes as any)?.data ?? topCustomersRes) || []
        setTopCustomersChart(
          topCustomersData.map((customer: any, index: number) => ({
            name:
              customer?.name ||
              customer?.email ||
              `Khách hàng ${index + 1}`,
            sold: Number(customer?.orderCount ?? 0),
            revenue: Number(customer?.totalRevenue ?? 0),
          }))
        )
      } catch (err: any) {
        if (!isMounted) return
        console.error("Lỗi khi tải dữ liệu admin:", err)
        setError(err?.message ?? "Không thể tải dữ liệu admin")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const summaryForCards = useMemo(
    () => summaryStats ?? {},
    [summaryStats]
  )

  return (
    <>
      <div className="@container/main">
        <SectionCards stats={summaryForCards} loading={loading} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartAreaInteractive
          data={topProductsChart}
          loading={loading}
          title="Top sản phẩm bán chạy"
          description="Dựa trên số lượng sản phẩm đã bán"
        />
        <ChartAreaInteractive
          data={monthlyOrdersChart}
          loading={loading}
          title="Đơn hàng theo tháng"
          description="Tổng số đơn hàng và doanh thu mỗi tháng gần đây"
        />
        <ChartAreaInteractive
          data={topCustomersChart}
          loading={loading}
          title="Khách hàng nhiều đơn nhất"
          description="Những khách hàng có nhiều đơn hàng nhất"
        />
      </div>
      {error && (
        <div className="px-4 text-sm text-destructive lg:px-0">{error}</div>
      )}
    </>
  )
}

