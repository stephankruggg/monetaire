import { Component, createSignal, Show } from 'solid-js';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

/**
 * InlineEdit component for editing text values inline
 *
 * Features:
 * - Click to edit mode
 * - Save on Enter or blur
 * - Cancel on Escape
 * - Loading state during save
 */
const InlineEdit: Component<InlineEditProps> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [editValue, setEditValue] = createSignal(props.value);
  const [isSaving, setIsSaving] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;

  const handleEdit = () => {
    setEditValue(props.value);
    setIsEditing(true);
    // Focus input after render
    setTimeout(() => {
      inputRef?.focus();
      inputRef?.select();
    }, 0);
  };

  const handleSave = async () => {
    const newValue = editValue().trim();

    // If value hasn't changed, just cancel
    if (newValue === props.value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await props.onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
      // Keep in edit mode on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(props.value);
    setIsEditing(false);
    props.onCancel?.();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events on buttons to fire
    setTimeout(() => {
      if (isEditing() && !isSaving()) {
        handleSave();
      }
    }, 100);
  };

  return (
    <div class="inline-edit-container">
      <style>{`
        .inline-edit-container {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }
        .inline-edit-display {
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          transition: background-color 0.15s;
          flex: 1;
          min-width: 0;
        }
        .inline-edit-display:hover {
          background-color: #f3f4f6;
        }
        .inline-edit-input {
          flex: 1;
          padding: 0.375rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .inline-edit-input:disabled {
          opacity: 0.6;
          cursor: wait;
          box-shadow: none;
        }
        .inline-edit-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .inline-edit-placeholder {
          color: #9ca3af;
        }
        .inline-edit-value {
          font-weight: 500;
        }
      `}</style>
      <Show
        when={isEditing()}
        fallback={
          <div
            class="inline-edit-display"
            onClick={handleEdit}
            title="Click to edit"
          >
            <Show
              when={props.value}
              fallback={<span class="inline-edit-placeholder">{props.placeholder || 'Click to edit'}</span>}
            >
              <span class="inline-edit-value">{props.value}</span>
            </Show>
          </div>
        }
      >
        <input
          ref={inputRef}
          type="text"
          class="inline-edit-input"
          value={editValue()}
          onInput={(e) => setEditValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving()}
          placeholder={props.placeholder}
        />
        <Show when={isSaving()}>
          <div class="inline-edit-spinner" />
        </Show>
      </Show>
    </div>
  );
};

export default InlineEdit;
