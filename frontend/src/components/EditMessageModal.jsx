import { useEffect, useRef } from 'react';

const EditMessageModal = ({ open, value, originalMessage, onChange, onCancel, onSave, maxLength = 5000 }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="message-modal-overlay edit-modal-overlay" onClick={onCancel} role="presentation">
      <div
        className="message-modal edit-message-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit message"
      >
        <div className="message-modal__header">
          <h3>Edit Message</h3>
          <p className="edit-message-original">Original: {originalMessage || 'No original text available.'}</p>
        </div>
        <div className="edit-message-body">
          <textarea
            ref={inputRef}
            value={value}
            maxLength={maxLength}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSave();
              }
            }}
            className="edit-message-textarea"
            placeholder="Update your message"
            rows={3}
          />
          <span className="edit-message-count">{value.length}/{maxLength}</span>
        </div>
        <div className="edit-message-actions">
          <button type="button" className="ghost edit-cancel-button" onClick={onCancel}>Cancel</button>
          <button type="button" className="edit-save-button" onClick={onSave} disabled={!value.trim()}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default EditMessageModal;

