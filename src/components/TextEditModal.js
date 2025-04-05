import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const TextEditModal = ({ show, title, value, onChange, onClose, onSave }) => {
  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <textarea
          className="form-control"
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          キャンセル
        </Button>
        <Button variant="primary" onClick={onSave}>
          保存
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TextEditModal;