import { Outlet, useLocation } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider } from "@/components/ui/sidebar"

const TITLES: Record<string, string> = {
  "/admin": "Thống kê và báo cáo",
  "/admin/orders": "Quản lý đơn hàng",
  "/admin/products": "Quản lý sản phẩm",
  "/admin/customers": "Quản lý khách hàng",
  "/admin/accounts": "Quản lý tài khoản",
  "/admin/reviews": "Quản lý đánh giá",
  "/admin/supply-chain": "Chuỗi cung ứng Blockchain",
  "/admin/chat": "Quản lý Chat",
  "/admin/settings": "Cài đặt hệ thống",
}

function getTitle(pathname: string) {
  if (pathname === "/admin") {
    return TITLES["/admin"]
  }

  const matched = Object.keys(TITLES)
    .filter((key) => key !== "/admin")
    .find((key) => pathname.startsWith(key))

  return matched ? TITLES[matched] : "Bảng điều khiển"
}

export default function AdminLayout() {
  const location = useLocation()
  const title = getTitle(location.pathname)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <SiteHeader title={title} />
          <main className="flex-1 space-y-6 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

