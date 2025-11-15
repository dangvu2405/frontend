import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Users, Globe, Heart } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { value: '50+', label: 'Thương hiệu', icon: <Award className="w-8 h-8" /> },
    { value: '10K+', label: 'Khách hàng', icon: <Users className="w-8 h-8" /> },
    { value: '500+', label: 'Sản phẩm', icon: <Globe className="w-8 h-8" /> },
    { value: '99%', label: 'Hài lòng', icon: <Heart className="w-8 h-8" /> },
  ];

  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Về Perfume Shop
          </h1>
          <p className="text-xl text-muted-foreground">
            Chúng tôi mang đến những chai nước hoa chính hãng, cao cấp từ các thương hiệu hàng đầu thế giới
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-4">
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">Câu chuyện của chúng tôi</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Perfume Shop được thành lập với mục tiêu mang đến những chai nước hoa chính hãng, 
                chất lượng cao từ các thương hiệu hàng đầu thế giới đến tay người tiêu dùng Việt Nam.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                Chúng tôi hiểu rằng mỗi mùi hương đều mang một câu chuyện riêng, một cảm xúc đặc biệt. 
                Vì vậy, chúng tôi cam kết mang đến cho bạn những trải nghiệm mua sắm tốt nhất.
              </p>
              <p className="text-lg text-muted-foreground">
                Với đội ngũ tư vấn chuyên nghiệp và dịch vụ chăm sóc khách hàng tận tâm, 
                chúng tôi luôn sẵn sàng đồng hành cùng bạn trong hành trình tìm kiếm hương thơm hoàn hảo.
              </p>
            </div>
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground text-center mb-12">
            Giá trị cốt lõi
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-xl mb-3">Chất lượng</h3>
                <p className="text-muted-foreground">
                  100% sản phẩm chính hãng, có tem chống giả và được nhập khẩu trực tiếp từ các nhà phân phối uy tín.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-xl mb-3">Tận tâm</h3>
                <p className="text-muted-foreground">
                  Đội ngũ tư vấn nhiệt tình, chuyên nghiệp, luôn sẵn sàng hỗ trợ bạn tìm được mùi hương phù hợp nhất.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-xl mb-3">Uy tín</h3>
                <p className="text-muted-foreground">
                  Hơn 10,000 khách hàng tin tưởng và lựa chọn. Chúng tôi luôn đặt sự hài lòng của bạn lên hàng đầu.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

