import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Save, RefreshCw } from "lucide-react"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    siteName: "Acme Inc.",
    siteDescription: "Hệ thống quản lý bán hàng",
    email: "",
    phone: "",
    address: "",
    paginationLimit: 10,
    maxUploadSize: 5, // MB
  })

  useEffect(() => {
    // Load settings from localStorage hoặc API
    const savedSettings = localStorage.getItem("adminSettings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Error loading settings:", e)
      }
    }
  }, [])

  const handleSave = async () => {
    try {
      setLoading(true)
      // Lưu vào localStorage (có thể thay bằng API call)
      localStorage.setItem("adminSettings", JSON.stringify(settings))
      toast.success("Đã lưu cài đặt thành công")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Không thể lưu cài đặt")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSettings({
      siteName: "Acme Inc.",
      siteDescription: "Hệ thống quản lý bán hàng",
      email: "",
      phone: "",
      address: "",
      paginationLimit: 10,
      maxUploadSize: 5,
    })
    localStorage.removeItem("adminSettings")
    toast.success("Đã reset cài đặt về mặc định")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">
            Quản lý các cài đặt chung của hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Thông tin chung */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
            <CardDescription>Cài đặt thông tin cơ bản của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Tên hệ thống</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                placeholder="Nhập tên hệ thống"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Mô tả hệ thống</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                placeholder="Nhập mô tả"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email liên hệ</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="0123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Nhập địa chỉ"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cài đặt hệ thống */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt hệ thống</CardTitle>
            <CardDescription>Các tham số kỹ thuật của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paginationLimit">Số lượng mục mỗi trang</Label>
              <Input
                id="paginationLimit"
                type="number"
                min="5"
                max="100"
                value={settings.paginationLimit}
                onChange={(e) => setSettings({ ...settings, paginationLimit: Number(e.target.value) || 10 })}
              />
              <p className="text-xs text-muted-foreground">
                Số lượng mục hiển thị trên mỗi trang (5-100)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUploadSize">Kích thước upload tối đa (MB)</Label>
              <Input
                id="maxUploadSize"
                type="number"
                min="1"
                max="50"
                value={settings.maxUploadSize}
                onChange={(e) => setSettings({ ...settings, maxUploadSize: Number(e.target.value) || 5 })}
              />
              <p className="text-xs text-muted-foreground">
                Kích thước file upload tối đa (1-50 MB)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thông tin hệ thống */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hệ thống</CardTitle>
          <CardDescription>Thông tin về phiên bản và trạng thái hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Phiên bản</Label>
              <p className="text-sm font-medium">1.0.0</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Trạng thái</Label>
              <p className="text-sm font-medium text-green-600">Hoạt động bình thường</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

