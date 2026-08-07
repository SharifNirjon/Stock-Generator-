import Modal from './Modal';

export default function ConfirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} width={380}>
      <p className="muted">{message}</p>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
