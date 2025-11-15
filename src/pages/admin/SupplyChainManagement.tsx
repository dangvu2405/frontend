import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  Plus, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  Package,
  ExternalLink,
  Loader2,
  Search
} from "lucide-react"
import adminService from "@/services/adminService"
import { 
  supplyChainService, 
  type ProductTraceData,
  type RecordEventPayload,
  type IssueCertificatePayload 
} from "@/services/supplyChainService"

type Product = {
  _id: string
  TenSanPham: string
  MoTa?: string
  Gia: number
  SoLuong: number
  MaSanPham?: string
  LoSanXuat?: string
  MaLoaiSanPham?: { _id: string; TenLoaiSanPham: string } | string
}

const EVENT_TYPES = [
  { value: "harvest", label: "Thu hoạch" },
  { value: "manufacturing", label: "Sản xuất" },
  { value: "quality_control", label: "Kiểm soát chất lượng" },
  { value: "distribution", label: "Phân phối" },
  { value: "retail", label: "Bán lẻ" },
  { value: "transport", label: "Vận chuyển" },
  { value: "storage", label: "Lưu kho" },
]

export default function SupplyChainManagement() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [traceData, setTraceData] = useState<ProductTraceData | null>(null)
  const [loadingTrace, setLoadingTrace] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [isInitDialogOpen, setIsInitDialogOpen] = useState(false)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false)

  // Form states
  const [initForm, setInitForm] = useState({ batchId: "", sku: "" })
  const [eventForm, setEventForm] = useState<RecordEventPayload>({
    eventType: "",
    description: "",
    location: "",
    ipfsHash: "",
  })
  const [certificateForm, setCertificateForm] = useState<IssueCertificatePayload>({
    name: "",
    issuer: "",
    ipfsHash: "",
    expiresAt: undefined,
  })

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await adminService.getProducts()
      const productsData = (response as any)?.data ?? []
      setProducts(productsData)
    } catch (err: any) {
      console.error("Error fetching products:", err)
      toast.error("Không thể tải danh sách sản phẩm")
    } finally {
      setLoading(false)
    }
  }

  const fetchTrace = async (productId: string) => {
    try {
      setLoadingTrace(true)
      const data = await supplyChainService.getProductTrace(productId)
      setTraceData(data)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setTraceData(null)
      } else {
        console.error("Error fetching trace:", err)
        toast.error(err?.response?.data?.message || "Không thể tải dữ liệu truy vết")
      }
    } finally {
      setLoadingTrace(false)
    }
  }

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    fetchTrace(product._id)
  }

  const handleInitProduct = async () => {
    if (!selectedProduct) return

    try {
      setSubmitting(true)
      const response = await supplyChainService.initProduct(selectedProduct._id, {
        batchId: initForm.batchId || undefined,
        sku: initForm.sku || undefined,
      })
      toast.success(response.message || "Khởi tạo sản phẩm thành công")
      setIsInitDialogOpen(false)
      setInitForm({ batchId: "", sku: "" })
      fetchTrace(selectedProduct._id)
    } catch (err: any) {
      console.error("Error initializing product:", err)
      toast.error(err?.response?.data?.message || "Không thể khởi tạo sản phẩm")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordEvent = async () => {
    if (!selectedProduct || !eventForm.eventType || !eventForm.description) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    try {
      setSubmitting(true)
      const response = await supplyChainService.recordEvent(selectedProduct._id, eventForm)
      toast.success(response.message || "Ghi sự kiện thành công")
      setIsEventDialogOpen(false)
      setEventForm({ eventType: "", description: "", location: "", ipfsHash: "" })
      fetchTrace(selectedProduct._id)
    } catch (err: any) {
      console.error("Error recording event:", err)
      toast.error(err?.response?.data?.message || "Không thể ghi sự kiện")
    } finally {
      setSubmitting(false)
    }
  }

  const handleIssueCertificate = async () => {
    if (!selectedProduct || !certificateForm.name || !certificateForm.issuer) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    try {
      setSubmitting(true)
      const payload: IssueCertificatePayload = {
        ...certificateForm,
        expiresAt: certificateForm.expiresAt 
          ? certificateForm.expiresAt 
          : Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // Default 1 year
      }
      const response = await supplyChainService.issueCertificate(selectedProduct._id, payload)
      toast.success(response.message || "Cấp chứng nhận thành công")
      setIsCertificateDialogOpen(false)
      setCertificateForm({ name: "", issuer: "", ipfsHash: "", expiresAt: undefined })
      fetchTrace(selectedProduct._id)
    } catch (err: any) {
      console.error("Error issuing certificate:", err)
      toast.error(err?.response?.data?.message || "Không thể cấp chứng nhận")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.TenSanPham.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.MaSanPham?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isProductInitialized = traceData !== null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý chuỗi cung ứng Blockchain</h1>
        <p className="text-muted-foreground">
          Quản lý và chứng nhận sản phẩm trên hợp đồng thông minh
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Products List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Danh sách sản phẩm</CardTitle>
            <CardDescription>Chọn sản phẩm để quản lý truy vết</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-[600px] overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Không tìm thấy sản phẩm
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProduct?._id === product._id
                  return (
                    <button
                      key={product._id}
                      onClick={() => handleSelectProduct(product)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-medium">{product.TenSanPham}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {product.MaSanPham && `SKU: ${product.MaSanPham}`}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trace Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedProduct ? selectedProduct.TenSanPham : "Chọn sản phẩm"}
                </CardTitle>
                <CardDescription>
                  {selectedProduct
                    ? isProductInitialized
                      ? "Dữ liệu truy vết trên blockchain"
                      : "Sản phẩm chưa được khởi tạo trên blockchain"
                    : "Vui lòng chọn một sản phẩm từ danh sách"}
                </CardDescription>
              </div>
              {selectedProduct && !isProductInitialized && (
                <Button onClick={() => setIsInitDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Khởi tạo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedProduct ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>Chọn sản phẩm để xem chi tiết</p>
              </div>
            ) : loadingTrace ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !traceData ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Sản phẩm chưa có dữ liệu truy vết trên blockchain
                  </p>
                  <Button onClick={() => setIsInitDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Khởi tạo sản phẩm
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                  <TabsTrigger value="events">Sự kiện</TabsTrigger>
                  <TabsTrigger value="certificates">Chứng nhận</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Mã sản phẩm</div>
                      <div className="font-medium">{traceData.product.id}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">SKU</div>
                      <div className="font-medium">{traceData.product.sku || "N/A"}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Mã lô</div>
                      <div className="font-medium">{traceData.product.batchId || "N/A"}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Blockchain Explorer</div>
                      {traceData.onChainProof.explorerUrl ? (
                        <a
                          href={traceData.onChainProof.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Xem trên explorer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <div className="text-muted-foreground">N/A</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEventDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm sự kiện
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCertificateDialogOpen(true)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Cấp chứng nhận
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="events" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {traceData.events.length} sự kiện
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEventDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm sự kiện
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {traceData.events.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Chưa có sự kiện nào
                      </div>
                    ) : (
                      traceData.events.map((event, index) => (
                        <div key={event.id || index} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{event.type}</Badge>
                                {event.timestamp && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(event.timestamp).toLocaleString("vi-VN")}
                                  </span>
                                )}
                              </div>
                              <div className="font-medium mb-1">{event.title}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {event.description}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="certificates" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {traceData.certificates.length} chứng nhận
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCertificateDialogOpen(true)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Cấp chứng nhận
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {traceData.certificates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Chưa có chứng nhận nào
                      </div>
                    ) : (
                      traceData.certificates.map((cert, index) => {
                        const isExpired = cert.expiresAt
                          ? new Date(cert.expiresAt) < new Date()
                          : false
                        return (
                          <div key={cert.id || index} className="rounded-lg border p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <div className="font-medium">{cert.name}</div>
                                  {isExpired ? (
                                    <Badge variant="destructive">Hết hạn</Badge>
                                  ) : (
                                    <Badge variant="default">Còn hiệu lực</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  Tổ chức cấp: {cert.issuer}
                                </div>
                                {cert.issuedAt && (
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Cấp ngày: {new Date(cert.issuedAt).toLocaleDateString("vi-VN")}
                                  </div>
                                )}
                                {cert.expiresAt && (
                                  <div className="text-xs text-muted-foreground">
                                    Hết hạn: {new Date(cert.expiresAt).toLocaleDateString("vi-VN")}
                                  </div>
                                )}
                                {cert.verificationUrl && (
                                  <a
                                    href={cert.verificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                                  >
                                    Xác minh
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Init Product Dialog */}
      <Dialog open={isInitDialogOpen} onOpenChange={setIsInitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khởi tạo sản phẩm trên blockchain</DialogTitle>
            <DialogDescription>
              Khởi tạo trace cho sản phẩm {selectedProduct?.TenSanPham}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="batchId">Mã lô (Batch ID)</Label>
              <Input
                id="batchId"
                value={initForm.batchId}
                onChange={(e) =>
                  setInitForm({ ...initForm, batchId: e.target.value })
                }
                placeholder={selectedProduct?.LoSanXuat || "BATCH-XXXXXX"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Để trống để sử dụng mã lô từ sản phẩm hoặc tự động tạo
              </p>
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={initForm.sku}
                onChange={(e) => setInitForm({ ...initForm, sku: e.target.value })}
                placeholder={selectedProduct?.MaSanPham || "SKU-XXXXXX"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Để trống để sử dụng SKU từ sản phẩm hoặc tự động tạo
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInitDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleInitProduct} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Khởi tạo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi sự kiện</DialogTitle>
            <DialogDescription>
              Ghi sự kiện mới cho sản phẩm {selectedProduct?.TenSanPham}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventType">Loại sự kiện *</Label>
              <Select
                value={eventForm.eventType}
                onValueChange={(value) =>
                  setEventForm({ ...eventForm, eventType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại sự kiện" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm({ ...eventForm, description: e.target.value })
                }
                placeholder="Mô tả chi tiết sự kiện..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="location">Địa điểm</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) =>
                  setEventForm({ ...eventForm, location: e.target.value })
                }
                placeholder="Nhập địa điểm..."
              />
            </div>
            <div>
              <Label htmlFor="ipfsHash">IPFS Hash (tùy chọn)</Label>
              <Input
                id="ipfsHash"
                value={eventForm.ipfsHash}
                onChange={(e) =>
                  setEventForm({ ...eventForm, ipfsHash: e.target.value })
                }
                placeholder="QmHash..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEventDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleRecordEvent} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Ghi sự kiện"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Certificate Dialog */}
      <Dialog open={isCertificateDialogOpen} onOpenChange={setIsCertificateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cấp chứng nhận</DialogTitle>
            <DialogDescription>
              Cấp chứng nhận mới cho sản phẩm {selectedProduct?.TenSanPham}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="certName">Tên chứng nhận *</Label>
              <Input
                id="certName"
                value={certificateForm.name}
                onChange={(e) =>
                  setCertificateForm({ ...certificateForm, name: e.target.value })
                }
                placeholder="Ví dụ: Chứng nhận nguồn gốc (CoO)"
              />
            </div>
            <div>
              <Label htmlFor="issuer">Tổ chức cấp *</Label>
              <Input
                id="issuer"
                value={certificateForm.issuer}
                onChange={(e) =>
                  setCertificateForm({ ...certificateForm, issuer: e.target.value })
                }
                placeholder="Ví dụ: Global Origin Council"
              />
            </div>
            <div>
              <Label htmlFor="certExpiresAt">Ngày hết hạn</Label>
              <Input
                id="certExpiresAt"
                type="date"
                onChange={(e) => {
                  const timestamp = e.target.value
                    ? Math.floor(new Date(e.target.value).getTime() / 1000)
                    : undefined
                  setCertificateForm({ ...certificateForm, expiresAt: timestamp })
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Để trống để mặc định 1 năm từ bây giờ
              </p>
            </div>
            <div>
              <Label htmlFor="certIpfsHash">IPFS Hash (tùy chọn)</Label>
              <Input
                id="certIpfsHash"
                value={certificateForm.ipfsHash}
                onChange={(e) =>
                  setCertificateForm({ ...certificateForm, ipfsHash: e.target.value })
                }
                placeholder="QmHash..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCertificateDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleIssueCertificate} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Cấp chứng nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

