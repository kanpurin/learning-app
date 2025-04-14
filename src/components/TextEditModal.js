import React, { useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const TextEditModal = ({ show, title, placeholder = "", value, onChange, onClose, onSave, question }) => {
  const textareaRef = useRef(null);

  // 解説テンプレートを動的生成
  const generateDynamicTemplate = () => {
    if (!question || !Array.isArray(question.answer) || !Array.isArray(question.options)) return null;

    const corrects = question.answer
      .map((index, i) => {
        const optionText = question.options[index - 1];
        return optionText ? `- ${optionText}` : null;
      })
      .filter(Boolean)
      .join('\n');

    return {
      label: '解説テンプレート',
      value: `正解：\n${corrects}\n---\n`,
    };
  };

  const staticTemplates = [
    { label: '画像テンプレート', value: (
      `<div align="center">\n` + 
      `  <img src="https://sample/image.png" style="width: min(300px, 70%);"/>\n` +
      `</div>\n`
    ) },
  ];

  const dynamicTemplate = generateDynamicTemplate();
  const allTemplates = dynamicTemplate ? [dynamicTemplate, ...staticTemplates] : staticTemplates;

  const handleInsertTemplate = (e) => {
    const templateText = e.target.value;
    if (!templateText || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const newText = before + templateText + after;

    onChange(newText);

    setTimeout(() => {
      const pos = start + templateText.length;
      textarea.focus();
      textarea.setSelectionRange(pos, pos);
    }, 0);

    e.target.selectedIndex = 0;
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <textarea
          ref={textareaRef}
          className="form-control"
          placeholder={placeholder}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        <Form.Select style={{ maxWidth: '200px' }} onChange={handleInsertTemplate}>
          <option value="">テンプレートを選択</option>
          {allTemplates.map((t, index) => (
            <option key={index} value={t.value}>{t.label}</option>
          ))}
        </Form.Select>
        <div>
          <Button variant="secondary" onClick={onClose} className="me-2">
            キャンセル
          </Button>
          <Button variant="primary" onClick={onSave}>
            保存
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default TextEditModal;
