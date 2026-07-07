import React from 'react';
import { useHistory } from 'react-router-dom';
import { useFocusable } from '../lib/focus/FocusContext';
import '../css/categories.css';

const CategoryGridCard: React.FC<{ name: string; grad: string; onSelect: () => void }> = ({ name, grad, onSelect }) => {
  const { ref, isFocused } = useFocusable(`cat-card-${name.toLowerCase().replace(/\s/g, '-')}`);
  return (
    <div
      ref={ref as any}
      onClick={onSelect}
      className={`category-card ${grad} ${isFocused ? 'focused tv-focus-outline' : ''}`}
    >
      <div className="category-card-overlay" />
      <span className="category-card-name">{name}</span>
    </div>
  );
};

const CategoriesPage: React.FC = () => {
  const history = useHistory();
  const catItems = [
    { name: 'Action', grad: 'grad-action' },
    { name: 'Documentaries', grad: 'grad-docs' },
    { name: 'Black Voices', grad: 'grad-black' },
    { name: 'Comedy', grad: 'grad-comedy' },
    { name: 'Nature', grad: 'grad-nature' },
    { name: 'Fantasy', grad: 'grad-fantasy' },
    { name: 'Foreign', grad: 'grad-foreign' },
    { name: 'Horror', grad: 'grad-horror' },
    { name: 'LGBTQ', grad: 'grad-lgbtq' },
    { name: 'War & Military', grad: 'grad-war' },
    { name: 'Musicals', grad: 'grad-musicals' },
  ];

  return (
    <div className="categories-container tv-scroll-hide">
      <div className="categories-grid">
        {catItems.map((cat, i) => (
          <CategoryGridCard key={i} name={cat.name} grad={cat.grad} onSelect={() => history.push(`/category/${encodeURIComponent(cat.name.toLowerCase())}`)} />
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
