import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconLink,
  IconMail,
  IconStar,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { storage } from "@/utils/storage"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const sidebarData = {
  navMain: [
    {
      title: "Thống kê và báo cáo",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Quản lý đơn hàng",
      url: "/admin/orders",
      icon: IconListDetails,
    },
    {
      title: "Quản lý sản phẩm",
      url: "/admin/products",
      icon: IconChartBar,
    },
    {
      title: "Quản lý khách hàng",
      url: "/admin/customers",
      icon: IconFolder,
    },
    {
      title: "Quản lý tài khoản",
      url: "/admin/accounts",
      icon: IconUsers,
    },
    {
      title: "Quản lý đánh giá",
      url: "/admin/reviews",
      icon: IconStar,
    },
    {
      title: "Chuỗi cung ứng Blockchain",
      url: "/admin/supply-chain",
      icon: IconLink,
    },
    {
      title: "Quản lý Chat",
      url: "/admin/chat",
      icon: IconMail,
    },
  ],
  navClouds: [
    {
      title: "Quản lý đối tác",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Cài đặt",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Hỗ trợ",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Tìm kiếm",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

const DEFAULT_USER = {
  name: "Khách",
  email: "guest@example.com",
  avatar: "/avatars/shadcn.jpg",
}

type TokenPayload = {
  HoTen?: string
  TenDangNhap?: string
  Email?: string
  [key: string]: unknown
}

function decodeAccessToken(token: string | null): TokenPayload | null {
  if (!token || typeof window === "undefined") {
    return null
  }

  try {
    const parts = token.split(".")
    if (parts.length < 2) {
      return null
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=")
    const binary = window.atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const decoded = new TextDecoder("utf-8").decode(bytes)
    return JSON.parse(decoded)
  } catch (error) {
    console.warn("Không thể giải mã access token:", error)
    return null
  }
}

function resolveUser() {
  if (typeof window === "undefined") {
    return DEFAULT_USER
  }

  const storedUser = storage.getUser()
  const tokenPayload = decodeAccessToken(storage.getToken())

  const name =
    storedUser?.hoten ??
    storedUser?.HoTen ??
    storedUser?.fullName ??
    storedUser?.TenDangNhap ??
    storedUser?.username ??
    tokenPayload?.HoTen ??
    tokenPayload?.TenDangNhap ??
    DEFAULT_USER.name

  const email =
    storedUser?.email ??
    storedUser?.Email ??
    tokenPayload?.Email ??
    DEFAULT_USER.email

  const avatar = storedUser?.avatar ?? DEFAULT_USER.avatar

  return {
    name,
    email,
    avatar,
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState(() => resolveUser())

  React.useEffect(() => {
    const refreshUser = () => setUser(resolveUser())

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "access_token" || event.key === "user") {
        refreshUser()
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("auth:updated", refreshUser)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("auth:updated", refreshUser)
    }
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavDocuments items={sidebarData.documents} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
