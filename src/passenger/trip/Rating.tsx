import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  onSubmit?: (rating: number, comment: string) => void;
  title?: string;
}

export const Rating: React.FC<RatingProps> = ({ onSubmit, title = 'Évaluer ce voyage' }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h4 className="font-bold text-sm">{title}</h4>
      <div className="my-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="p-1 text-amber-400 transition hover:scale-110"
          >
            <Star className={`h-6 w-6 ${rating >= star ? 'fill-amber-400' : 'stroke-slate-300'}`} />
          </button>
        ))}
      </div>
      <textarea
        placeholder="Un commentaire sur la qualité du service ?"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full rounded-xl border p-2.5 text-xs bg-transparent dark:border-slate-800 focus:outline-none"
        rows={2}
      />
      <button
        onClick={() => onSubmit && onSubmit(rating, comment)}
        disabled={rating === 0}
        className="mt-2 w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        Envoyer l'avis
      </button>
    </div>
  );
};