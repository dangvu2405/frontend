import { MainLayout } from '@/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: '10 Mùi hương nước hoa nam được yêu thích nhất năm 2024',
      excerpt: 'Khám phá những mùi hương nam tính, quyến rũ và đầy cuốn hút trong năm nay...',
      image: 'https://placehold.co/600x400/007AFF/FFF?text=Blog+1',
      author: 'Admin',
      date: '15/11/2024',
      category: 'Xu hướng',
    },
    {
      id: 2,
      title: 'Cách chọn nước hoa phù hợp với tính cách của bạn',
      excerpt: 'Mỗi người đều có một mùi hương riêng biệt. Hãy tìm hiểu cách chọn nước hoa phù hợp...',
      image: 'https://placehold.co/600x400/5AC8FA/FFF?text=Blog+2',
      author: 'Admin',
      date: '12/11/2024',
      category: 'Hướng dẫn',
    },
    {
      id: 3,
      title: 'Bí quyết giữ hương thơm lâu hơn cả ngày',
      excerpt: 'Những mẹo nhỏ giúp bạn giữ hương thơm nước hoa bền lâu suốt cả ngày dài...',
      image: 'https://placehold.co/600x400/AF52DE/FFF?text=Blog+3',
      author: 'Admin',
      date: '10/11/2024',
      category: 'Mẹo hay',
    },
    {
      id: 4,
      title: 'Top 5 thương hiệu nước hoa cao cấp đáng đầu tư',
      excerpt: 'Những thương hiệu nước hoa xa xỉ, đẳng cấp mà bạn nên biết...',
      image: 'https://placehold.co/600x400/FF9500/FFF?text=Blog+4',
      author: 'Admin',
      date: '08/11/2024',
      category: 'Thương hiệu',
    },
    {
      id: 5,
      title: 'Phân biệt nước hoa chính hãng và hàng giả',
      excerpt: 'Cách nhận biết nước hoa chính hãng để tránh mua phải hàng fake...',
      image: 'https://placehold.co/600x400/34C759/FFF?text=Blog+5',
      author: 'Admin',
      date: '05/11/2024',
      category: 'Kiến thức',
    },
    {
      id: 6,
      title: 'Nước hoa nữ ngọt ngào cho mùa hè',
      excerpt: 'Những mùi hương nhẹ nhàng, tươi mát phù hợp cho mùa hè nóng bức...',
      image: 'https://placehold.co/600x400/FF2D55/FFF?text=Blog+6',
      author: 'Admin',
      date: '01/11/2024',
      category: 'Xu hướng',
    },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">Blog</h1>
          <p className="text-xl text-muted-foreground">
            Khám phá kiến thức, xu hướng và mẹo hay về nước hoa
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter */}
          <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
            {['Tất cả', 'Xu hướng', 'Hướng dẫn', 'Mẹo hay', 'Thương hiệu', 'Kiến thức'].map(
              (category) => (
                <button
                  key={category}
                  className={`px-6 py-2 rounded-full whitespace-nowrap border transition-colors ${
                    category === 'Tất cả'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-foreground hover:bg-accent border-border'
                  }`}
                >
                  {category}
                </button>
              )
            )}
          </div>

          {/* Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                <CardContent className="p-0">
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-foreground text-lg mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-12 gap-2">
            <button className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors">
              Trước
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">1</button>
            <button className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors">
              2
            </button>
            <button className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors">
              3
            </button>
            <button className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors">
              Sau
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

