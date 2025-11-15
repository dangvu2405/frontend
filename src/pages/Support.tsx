import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, HelpCircle, MessageCircle, Phone, Mail } from 'lucide-react';
import { useState } from 'react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Làm thế nào để biết sản phẩm là hàng chính hãng?',
      answer:
        'Tất cả sản phẩm tại Perfume Shop đều được nhập khẩu trực tiếp từ các nhà phân phối ủy quyền chính thức. Mỗi sản phẩm đều có tem chống giả và giấy tờ chứng nhận nguồn gốc xuất xứ.',
    },
    {
      question: 'Chính sách đổi trả như thế nào?',
      answer:
        'Chúng tôi chấp nhận đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên seal, chưa qua sử dụng. Vui lòng liên hệ hotline để được hỗ trợ.',
    },
    {
      question: 'Thời gian giao hàng mất bao lâu?',
      answer:
        'Đơn hàng nội thành TP.HCM: 1-2 ngày. Đơn hàng tỉnh thành khác: 2-3 ngày. Chúng tôi hỗ trợ giao hàng nhanh trong ngày với phí tăng thêm.',
    },
    {
      question: 'Có thể thanh toán bằng hình thức nào?',
      answer:
        'Chúng tôi hỗ trợ nhiều hình thức thanh toán: COD (thanh toán khi nhận hàng), chuyển khoản ngân hàng, thẻ tín dụng/ghi nợ, ví điện tử (Momo, ZaloPay).',
    },
    {
      question: 'Làm sao để bảo quản nước hoa đúng cách?',
      answer:
        'Nên bảo quản nước hoa ở nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp. Nhiệt độ lý tưởng là 15-25°C. Tránh để nước hoa trong xe hơi hoặc phòng tắm.',
    },
    {
      question: 'Có chương trình ưu đãi cho khách hàng thân thiết không?',
      answer:
        'Có! Chúng tôi có chương trình tích điểm cho mỗi đơn hàng. Khách hàng sẽ nhận được voucher giảm giá, quà tặng đặc biệt vào các dịp lễ tết.',
    },
  ];

  const supportOptions = [
    {
      icon: <Phone className="w-8 h-8" />,
      title: 'Hotline',
      description: '0123 456 789',
      subtitle: 'Hỗ trợ 24/7',
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: 'Email',
      description: 'support@perfumeshop.com',
      subtitle: 'Phản hồi trong 24h',
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Live Chat',
      description: 'Chat trực tuyến',
      subtitle: '8:00 - 22:00 hàng ngày',
    },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Trung tâm hỗ trợ
          </h1>
          <p className="text-xl text-muted-foreground">
            Chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Liên hệ với chúng tôi
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {supportOptions.map((option, index) => (
              <Card
                key={index}
                className="hover:shadow-xl transition-shadow cursor-pointer"
              >
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-4">
                    {option.icon}
                  </div>
                  <h3 className="font-bold text-foreground text-xl mb-2">
                    {option.title}
                  </h3>
                  <p className="text-primary font-semibold mb-1">
                    {option.description}
                  </p>
                  <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl text-primary mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Câu hỏi thường gặp
            </h2>
            <p className="text-lg text-muted-foreground">
              Tìm câu trả lời nhanh cho những thắc mắc phổ biến
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-muted transition-colors"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-bold text-foreground pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Không tìm thấy câu trả lời?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn
          </p>
          <button className="bg-background text-primary px-8 py-4 rounded-xl font-bold hover:bg-muted transition-colors">
            Liên hệ ngay
          </button>
        </div>
      </section>
    </MainLayout>
  );
}

