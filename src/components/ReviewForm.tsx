import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Upload, X, Send } from 'lucide-react';

interface ReviewFormProps {
  onSuccess: () => void;
}

export default function ReviewForm({ onSuccess }: ReviewFormProps) {
  const [formData, setFormData] = useState({
    guest_name: '',
    is_anonymous: false,
    rating: 0,
    comment: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      alert('Maximum 3 photos allowed');
      return;
    }
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Each photo must be less than 5MB');
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Only JPG, PNG, and WEBP images are allowed');
        return;
      }
    }
    setPhotos(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) { alert('Please select a rating'); return; }
    if (!formData.guest_name.trim() && !formData.is_anonymous) { alert('Please enter your name or post as anonymous'); return; }
    if (!formData.comment.trim()) { alert('Please write a review'); return; }

    setLoading(true);
    setUploadProgress(10);

    try {
      const {  reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert([{
          guest_name: formData.is_anonymous ? 'Anonymous' : formData.guest_name,
          is_anonymous: formData.is_anonymous,
          rating: formData.rating,
          comment: formData.comment,
          status: 'pending',
        }])
        .select()
        .single();

      if (reviewError) throw reviewError;
      setUploadProgress(40);

      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const fileExt = photo.name.split('.').pop();
          const fileName = `${reviewData.id}-${Date.now()}-${i}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('review-photos').upload(fileName, photo);
          if (uploadError) { console.error('Upload error:', uploadError); continue; }
          const {  urlData } = supabase.storage.from('review-photos').getPublicUrl(fileName);
          await supabase.from('review_photos').insert([{ review_id: reviewData.id, photo_url: urlData.publicUrl }]);
          setUploadProgress(40 + ((i + 1) / photos.length) * 50);
        }
      }

      setUploadProgress(100);
      setFormData({ guest_name: '', is_anonymous: false, rating: 0, comment: '' });
      setPhotos([]);
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
      setPhotoPreviews([]);
      setUploadProgress(0);
      alert('Thank you for your review! It will be published after approval.');
      onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Leave a Review</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })}
              onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110">
              <Star size={32} className={star <= (hoverRating || formData.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name {!formData.is_anonymous && '*'}</label>
        <input type="text" value={formData.guest_name} onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
          required={!formData.is_anonymous} disabled={formData.is_anonymous}
          placeholder={formData.is_anonymous ? 'Anonymous' : 'Your name'}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100" />
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={formData.is_anonymous} onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })} className="rounded accent-amber-500" />
          <span className="text-sm text-gray-600">Post as Anonymous</span>
        </label>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
        <textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          required maxLength={500} rows={4} placeholder="Tell us about your experience..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none" />
        <p className="text-xs text-gray-500 mt-1">{formData.comment.length}/500 characters</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Optional - Max 3, max 5MB each)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-amber-400 transition-colors">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoChange} className="hidden" id="photo-upload" disabled={photos.length >= 3} />
          <label htmlFor="photo-upload" className={`cursor-pointer flex flex-col items-center ${photos.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload size={24} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">{photos.length >= 3 ? 'Maximum photos reached' : 'Click to upload photos'}</span>
            <span className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP</span>
          </label>
        </div>
        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {photoPreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span><span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Submitting...</>) : (<><Send size={20} />Submit Review</>)}
      </button>
      <p className="text-xs text-gray-500 mt-3 text-center">Your review will be published after admin approval</p>
    </form>
  );
}
