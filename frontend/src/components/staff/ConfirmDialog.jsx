import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";

/**
 * Small destructive-action confirmation used by staff screens.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-mist-300">
        This action cannot be undone. Content inside a deleted course or
        module is removed with it.
      </p>
    </Modal>
  );
}
