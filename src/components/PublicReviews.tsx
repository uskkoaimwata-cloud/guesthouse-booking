import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Calendar, User, MessageSquare } from 'lucide-react';
import ReviewForm from './ReviewForm';

interface Review {
  id: string;
  guest_name: string;
  is_anonymous: boolean;
  rating: number;
  comment: string;
  status: string;
  is_explicit: boolean;
  created_at: string;
  review_photos?: { id: string; photo_url: string }[];
}

export default function PublicReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
    const channel = supabase
      .channel('public-reviews-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => { loadReviews(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(`*, review_photos (id, photo_url)`)
      .eq('status', 'approved')
      .eq('is_explicit', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
      const avg = data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length;
      setAverageRating(Math.round(avg * 10) / 10);
      setTotalCount(data.length);
    }
    setLoading(false);
  };

  const renderStars = (rating: number, size: number = 20) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={size} className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <section id="reviews" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Guest Reviews</h2>
          <p className="text-gray-600 mb-6">See what our guests have to say about their stay</p>
          {!loading && totalCount > 0 && (
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex">{renderStars(Math.round(averageRating), 24)}</div>
              <span className="text-2xl font-bold text-gray-800">{averageRating}</span>
              <span className="text-gray-500">/ 5</span>
            </div>
          )}
          <p className="text-sm text-gray-500">Based on {totalCount} review{totalCount !== 1 ? 's' : ''}</p>
        </div>

        <div className="text-center mb-8">
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors">
            <MessageSquare size={20} />
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {showForm && (
          <div className="max-w-2xl mx-auto mb-12">
            <ReviewForm onSuccess={() => { setShowForm(false); loadReviews(); }} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No reviews yet. Be the first to leave a review!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-amber-600" />
                    </div>
                    <span className="font-semibold text-gray-800">{review.is_anonymous ? 'Anonymous' : review.guest_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar size={14} /><span>{formatDate(review.created_at)}</span>
                  </div>
                </div>
                <div className="flex mb-3">{renderStars(review.rating)}</div>
                <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                {review.review_photos && review.review_photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {review.review_photos.map((photo) => (
                      <img key={photo.id} src={photo.photo_url} alt="Review photo"
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedPhoto(photo.photo_url)} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="Review photo" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </section>
  );
}
