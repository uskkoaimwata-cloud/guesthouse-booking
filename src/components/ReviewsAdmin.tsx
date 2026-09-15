import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Calendar, Trash2, Check, X, AlertTriangle } from 'lucide-react';

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

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);

  useEffect(() => {
    loadReviews();
    const channel = supabase
      .channel('reviews-admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => { loadReviews(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const loadReviews = async () => {
    setLoading(true);
    let query = supabase.from('reviews').select(`*, review_photos (id, photo_url)`).order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error } = await query;
    if (!error && data) setReviews(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    await supabase.from('reviews').update({ status: 'approved' }).eq('id', id);
    loadReviews();
  };

  const handleReject = async (id: string) => {
    await supabase.from('reviews').update({ status: 'rejected' }).eq('id', id);
    loadReviews();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    const review = reviews.find(r => r.id === id);
    if (review?.review_photos) {
      for (const photo of review.review_photos) {
        const fileName = photo.photo_url.split('/').pop();
        if (fileName) await supabase.storage.from('review-photos').remove([fileName]);
      }
    }
    await supabase.from('reviews').delete().eq('id', id);
    loadReviews();
  };

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('Delete this photo?')) return;
    const fileName = photoUrl.split('/').pop();
    if (fileName) await supabase.storage.from('review-photos').remove([fileName]);
    await supabase.from('review_photos').delete().eq('id', photoId);
    loadReviews();
  };

  const handleMarkExplicit = async (id: string, isExplicit: boolean) => {
    await supabase.from('reviews').update({ is_explicit: isExplicit }).eq('id', id);
    loadReviews();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} className={i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Reviews Management</h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && <span className="ml-2 text-xs">({reviews.filter(r => r.status === f).length})</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center"><p className="text-gray-600">No reviews found</p></div>
      ) : (
        <div className="divide-y divide-gray-200">
          {reviews.map((review) => (
            <div key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-800">{review.is_anonymous ? 'Anonymous' : review.guest_name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${review.status === 'approved' ? 'bg-green-100 text-green-700' : review.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {review.status.toUpperCase()}
                    </span>
                    {review.is_explicit && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertTriangle size={12} /> EXPLICIT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div class="flex">{renderStars(review.rating)}</div>
                    <div class="flex items-center gap-1"><Calendar size={14} /><span>{formatDate(review.created_at)}</span></div>
                  </div>
                </div>
              </div>

              <p class="text-gray-700 mb-4">{review.comment}</p>

              {review.review_photos && review.review_photos.length > 0 && (
                <div class="mb-4">
                  <div class="grid grid-cols-4 gap-2">
                    {review.review_photos.map((photo) => (
                      <div key={photo.id} class="relative group">
                        <img src={photo.photo_url} alt="Review photo" class="w-full h-24 object-cover rounded-lg cursor-pointer"
                          onClick={() => setSelectedPhotos(review.review_photos!.map(p => p.photo_url))} />
                        <button onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                          class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div class="flex gap-2">
                {review.status === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(review.id)} class="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                      <Check size={16} /> Approve
                    </button>
                    <button onClick={() => handleReject(review.id)} class="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                      <X size={16} /> Reject
                    </button>
                  </>
                )}
                {review.status === 'rejected' && (
                  <button onClick={() => handleApprove(review.id)} class="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                    <Check size={16} /> Approve
                  </button>
                )}
                <button onClick={() => handleMarkExplicit(review.id, !review.is_explicit)}
                  class={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${review.is_explicit ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                  <AlertTriangle size={16} /> {review.is_explicit ? 'Unmark Explicit' : 'Mark Explicit'}
                </button>
                <button onClick={() => handleDelete(review.id)} class="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhotos && (
        <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhotos(null)}>
          <div class="max-w-4xl max-h-full overflow-auto">
            {selectedPhotos.map((photo, index) => (
              <img key={index} src={photo} alt={`Photo ${index + 1}`} class="max-w-full max-h-full" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
