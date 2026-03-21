const MessageActionModal = ({ open, title, actions, onClose, description = '' }) => {
  if (!open) return null;

  return (
    <div className="message-modal-overlay" onClick={onClose} role="presentation">
      <div className="message-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="message-modal__header">
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        <div className="message-modal__actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`message-modal__action ${action.tone || ''}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageActionModal;
