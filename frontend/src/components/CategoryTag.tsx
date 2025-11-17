import { Component } from 'solid-js';
import type { Category } from '../../../shared/types';

interface CategoryTagProps {
  category?: Category;
}

const CategoryTag: Component<CategoryTagProps> = (props) => {
  return (
    <span
      classList={{
        'tag': true,
        'tag-category': !!props.category,
        'tag-uncategorized': !props.category,
      }}
    >
      {props.category?.name || 'Uncategorized'}
      <style>{`
        .tag {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .tag-category {
          background-color: #dbeafe;
          color: #1e40af;
        }
        .tag-uncategorized {
          background-color: #e5e7eb;
          color: #6b7280;
        }
      `}</style>
    </span>
  );
};

export default CategoryTag;
