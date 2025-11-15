import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">Liên hệ với chúng tôi</h1>
          <p className="text-xl text-muted-foreground">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
          </p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Thông tin liên hệ
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Hãy liên hệ với chúng tôi qua các kênh dưới đây hoặc điền vào form bên cạnh
              </p>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Địa chỉ</h3>
                        <p className="text-muted-foreground">
                          123 Đường ABC, Quận 1, TP. Hồ Chí Minh, Việt Nam
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Điện thoại</h3>
                        <p className="text-muted-foreground">0123 456 789</p>
                        <p className="text-muted-foreground">0987 654 321</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Email</h3>
                        <p className="text-muted-foreground">contact@perfumeshop.com</p>
                        <p className="text-muted-foreground">support@perfumeshop.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1">Giờ làm việc</h3>
                        <p className="text-muted-foreground">Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                        <p className="text-muted-foreground">Thứ 7 - CN: 9:00 - 17:00</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Gửi tin nhắn cho chúng tôi
                  </h2>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="name">Họ và tên</Label>
                      <Input
                        id="name"
                        placeholder="Nguyễn Văn A"
                        className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        placeholder="0123 456 789"
                        className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Tiêu đề</Label>
                      <Input
                        id="subject"
                        placeholder="Tôi cần hỗ trợ về..."
                        className="bg-background border-input h-12 rounded-xl px-4 placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Nội dung</Label>
                      <textarea
                        id="message"
                        rows={5}
                        placeholder="Nhập nội dung tin nhắn..."
                        className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition"
                      />
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
                      Gửi tin nhắn
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">
            Tìm chúng tôi trên bản đồ
          </h2>
          <div className="w-full h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl flex items-center justify-center">
            <p className="text-muted-foreground">Google Maps sẽ được tích hợp tại đây</p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

