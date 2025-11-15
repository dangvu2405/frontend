import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { reviewService, type Review, type RatingStats } from '@/services/reviewService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch reviews and stats
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [reviewsData, statsData, myReviewData] = await Promise.all([
          reviewService.getProductReviews(productId, { limit: 10 }),
          reviewService.getProductRatingStats(productId),
          isAuthenticated ? reviewService.getMyReview(productId) : Promise.resolve(null)
        ]);

        if (!isMounted) return;

        const reviewsArray = reviewsData.reviews || [];
        
        setReviews(reviewsArray);
        setStats(statsData);
        setMyReview(myReviewData);
      } catch (error: any) {
        if (!isMounted) return;
        toast.error(error?.message || 'Không thể tải đánh giá');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [productId, isAuthenticated]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }

    if (reviewText.trim().length < 10) {
      toast.error('Đánh giá phải có ít nhất 10 ký tự');
      return;
    }

    try {
      setSubmitting(true);
      
      const newReview = await reviewService.createReview({
        IdSanPham: productId,
        NoiDung: reviewText.trim(),
        SoSao: rating
      });

      setMyReview(newReview);
      setReviews([newReview, ...reviews]);
      setReviewText('');
      setRating(5);
      setShowReviewForm(false);
      toast.success('Đánh giá thành công!');

      // Update stats locally thay vì gọi API lại
      if (stats) {
        const newTotalReviews = stats.totalReviews + 1;
        const newAvgRating = ((stats.avgRating * stats.totalReviews) + rating) / newTotalReviews;
        const newStats = {
          ...stats,
          totalReviews: newTotalReviews,
          avgRating: newAvgRating,
          [`star${rating}`]: ((stats as any)[`star${rating}`] || 0) + 1,
        };
        setStats(newStats);
      } else {
        // Nếu chưa có stats, mới gọi API
        const newStats = await reviewService.getProductRatingStats(productId);
        setStats(newStats);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= (interactive ? (hoverRating || rating) : count)
                ? 'fill-yellow-500 text-yellow-500'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer transition-colors' : ''}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-muted-foreground mt-2">Đang tải đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {stats.avgRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.avgRating))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.totalReviews} đánh giá
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = (stats as any)[`star${star}`] || 0;
                  const percentage = stats.totalReviews > 0 
                    ? (count / stats.totalReviews) * 100 
                    : 0;
                  
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{star} ⭐</span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Write Review Button */}
      {isAuthenticated && !myReview && (
        <div>
          {!showReviewForm ? (
            <Button onClick={() => setShowReviewForm(true)} className="w-full md:w-auto">
              Viết đánh giá
            </Button>
          ) : (
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Đánh giá của bạn
                    </label>
                    {renderStars(rating, true)}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nội dung đánh giá
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full min-h-[120px] p-3 border-2 border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này... (tối thiểu 10 ký tự)"
                      required
                      minLength={10}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {reviewText.length}/1000 ký tự
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={submitting || reviewText.trim().length < 10}
                      className="flex-1 md:flex-initial"
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewText('');
                        setRating(5);
                      }}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* My Review */}
      {myReview && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary">
                  {myReview.IdKhachHang.HoTen.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{myReview.IdKhachHang.HoTen}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(myReview.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Đánh giá của bạn
                  </span>
                </div>
                {renderStars(myReview.SoSao)}
                <p className="mt-3 text-foreground">{myReview.NoiDung}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">
          Đánh giá từ khách hàng ({reviews.length})
        </h3>
        
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              if (!review || !review._id) {
                return null;
              }
              
              const customerName = review.IdKhachHang?.HoTen || 'Khách hàng';
              const reviewDate = review.createdAt || new Date().toISOString();
              const stars = review.SoSao || 5;
              const content = review.NoiDung || '';
              
              return (
              <Card key={review._id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-foreground">
                        {customerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(reviewDate).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      {renderStars(stars)}
                      <p className="mt-3 text-foreground">{content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

