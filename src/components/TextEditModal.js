import React, { useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import ClearButton from './ClearButton';

const TextEditModal = ({ show, title, placeholder = "", value, onChange, onClose, onSave, question }) => {
  const textareaRef = useRef(null);

  // テキストエリアの内容をクリア
  const handleClear = () => {
    onChange('');
    textareaRef.current.focus();
  };

  // 解説テンプレートを動的生成
  const generateDynamicTemplate = () => {
    if (!question || !Array.isArray(question.answer) || !Array.isArray(question.options)) return null;

    const corrects = question.answer
      .map((index) => {
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
    {
      label: '画像テンプレート',
      value: (
        `<div align="center">\n` +
        `  <img src="https://sample/image.png" style="width: min(300px, 70%);"/>\n` +
        `</div>\n`
      ),
    },
    {
      label: 'インラインコードで囲む',
      value: { start: '`', end: '`' },
    },
    {
      label: 'コードブロックで囲む',
      value: { start: '```bash\n', end: '\n```' },
    },
  ];

  const dynamicTemplate = generateDynamicTemplate();
  const allTemplates = dynamicTemplate ? [dynamicTemplate, ...staticTemplates] : staticTemplates;

  // テンプレート挿入または囲む処理
  const handleInsertTemplate = (e) => {
    const selectedTemplate = allTemplates.find((t) => JSON.stringify(t.value) === e.target.value);
    if (!selectedTemplate || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);

    let newText;

    if (typeof selectedTemplate.value === 'string') {
      newText = value.slice(0, start) + selectedTemplate.value + value.slice(end);
    } else {
      const { start: startStr, end: endStr } = selectedTemplate.value;
      newText =
        value.slice(0, start) +
        startStr + selectedText + endStr +
        value.slice(end);
    }

    onChange(newText);

    setTimeout(() => {
      const pos = start + (typeof selectedTemplate.value === 'string' ? selectedTemplate.value.length : 2);
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
      <Modal.Body style={{ position: 'relative' }}>
        {/* クリアボタンをテキストエリア内に表示 */}
        <div style={{ position: 'relative' }}>
          <ClearButton onClear={handleClear} />
          <textarea
            ref={textareaRef}
            className="form-control"
            placeholder={placeholder}
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ paddingRight: '40px' }}  // クリアボタン分の余白
          />
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        <Form.Select style={{ maxWidth: '300px' }} onChange={handleInsertTemplate}>
          <option value="">テンプレートを選択</option>
          {allTemplates.map((t, index) => (
            <option key={index} value={JSON.stringify(t.value)}>{t.label}</option>
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
