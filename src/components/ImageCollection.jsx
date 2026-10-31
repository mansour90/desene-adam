import React from 'react';
import { Heart } from 'lucide-react';
import ImageCard from './ImageCard';

export default function ImageCollection({
  title,
  emptyText,
  items,
  favorites,
  queue,
  onSelectImage,
  onToggleFavorite,
  onToggleQueue,
  queueOnly = false
}) {
  return (
    <section className="collection-screen">
      <header className="collection-screen-header">
        <div>
          <h2>{title}</h2>
          <p>{items.length} {items.length === 1 ? 'poză' : 'poze'}</p>
        </div>
        {!queueOnly && <Heart size={25} className="collection-heading-icon" />}
      </header>

      {items.length === 0 ? (
        <div className="collection-empty-state">
          <Heart size={36} />
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="google-image-grid is-two-columns collection-image-grid">
          {items.map((item) => (
            <ImageCard
              key={item.key}
              image={item.image}
              imageMode={item.mode}
              onClick={(image) => onSelectImage(
                image,
                item.mode,
                items.filter((candidate) => candidate.mode === item.mode).map((candidate) => candidate.image)
              )}
              isFavorite={favorites.some((favorite) => favorite.key === item.key)}
              onToggleFavorite={(image) => onToggleFavorite(image, item.mode)}
              isQueued={queue.some((queued) => queued.key === item.key)}
              onToggleQueue={onToggleQueue}
            />
          ))}
        </div>
      )}
    </section>
  );
}