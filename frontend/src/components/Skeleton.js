import React from 'react';
import './Skeleton.css';

export const TournamentSkeleton = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-pulse skeleton-image"></div>
      <div className="skeleton-body">
        <div className="skeleton-pulse skeleton-title"></div>
        <div className="skeleton-pulse skeleton-text"></div>
        <div className="skeleton-pulse skeleton-text short"></div>
        
        <div className="skeleton-footer">
          <div className="skeleton-pulse skeleton-button"></div>
          <div className="skeleton-pulse skeleton-button"></div>
        </div>
      </div>
    </div>
  );
};

// Reusable wrapper to map multiple skeletons easily
export const SkeletonGrid = ({ count = 4 }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      width: '100%'
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <TournamentSkeleton key={i} />
      ))}
    </div>
  );
};