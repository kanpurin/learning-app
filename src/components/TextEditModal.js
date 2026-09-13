import React, { useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaste } from '@fortawesome/free-solid-svg-icons';
import { faCopy } from '@fortawesome/free-regular-svg-icons';
import ClearButton from './ClearButton';

const TextEditModal = ({ show, title, placeholder = "", value, onChange, onClose, onSave, question }) => {
  const textareaRef = useRef(null);

  // テキストエリアの内容をクリア
  const handleClear = () => {
    onChange('');
    textareaRef.current.focus();
  };

  const insertTextAtCursor = (text) => {
    const currentValue = value || '';
    const textarea = textareaRef.current;

    if (!textarea) {
      onChange(`${currentValue}${text}`);
      return;
    }

    const start = textarea.selectionStart ?? currentValue.length;
    const end = textarea.selectionEnd ?? start;
    const newText = currentValue.slice(0, start) + text + currentValue.slice(end);

    onChange(newText);

    setTimeout(() => {
      const position = start + text.length;
      textarea.focus();
      textarea.setSelectionRange(position, position);
    }, 0);
  };

  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) {
      alert('このブラウザではコピー機能を利用できません。');
      return;
    }

    try {
      await navigator.clipboard.writeText(value || '');
      textareaRef.current?.focus();
    } catch (error) {
      alert('コピーできませんでした。ブラウザの権限設定を確認してください。');
    }
  };

  const handlePaste = async () => {
    if (!navigator.clipboard?.readText) {
      alert('このブラウザでは貼り付け機能を利用できません。');
      return;
    }

    try {
      const pastedText = await navigator.clipboard.readText();
      insertTextAtCursor(pastedText);
    } catch (error) {
      alert('貼り付けできませんでした。ブラウザの権限設定を確認してください。');
    }
  };

  // 解説テンプレートを動的生成
  const generateDynamicTemplate = () => {
    if (question && Array.isArray(question.answer) && Array.isArray(question.options)) {
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
    }
    else if (question && !Array.isArray(question.answer)) {
      return {
        label: '解説テンプレート',
        value: `正解：\n- ${question.answer}\n---\n`,
      };
    }
    else {
      return null;
    }
  };

  const staticTemplates = [
    {
      label: '画像テンプレート',
      value: '![画像の説明](https://sample/image.png)\n',
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
        <div className="d-flex flex-wrap gap-2 mb-2">
          <Button type="button" variant="outline-secondary" size="sm" onClick={handleCopy}>
            <FontAwesomeIcon icon={faCopy} className="me-1" />
            コピー
          </Button>
          <Button type="button" variant="outline-secondary" size="sm" onClick={handlePaste}>
            <FontAwesomeIcon icon={faPaste} className="me-1" />
            貼り付け
          </Button>
        </div>
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
