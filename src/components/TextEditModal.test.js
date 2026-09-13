import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextEditModal from './TextEditModal';

const renderTextEditModal = (overrides = {}) => {
  const props = {
    show: true,
    title: '問題文の編集',
    placeholder: '本文',
    value: 'before',
    onChange: jest.fn(),
    onClose: jest.fn(),
    onSave: jest.fn(),
    ...overrides,
  };

  render(<TextEditModal {...props} />);
  return props;
};

describe('TextEditModal', () => {
  let writeText;
  let readText;

  beforeEach(() => {
    writeText = jest.fn().mockResolvedValue(undefined);
    readText = jest.fn().mockResolvedValue('追加');

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText,
        readText,
      },
      configurable: true,
    });
  });

  test('copies the current text to the clipboard', async () => {
    renderTextEditModal({ value: 'コピーする本文' });

    userEvent.click(screen.getByRole('button', { name: 'コピー' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('コピーする本文'));
  });

  test('pastes clipboard text at the cursor position', async () => {
    const { onChange } = renderTextEditModal({ value: 'before' });
    const textarea = screen.getByRole('textbox');
    textarea.focus();
    textarea.setSelectionRange(2, 2);

    userEvent.click(screen.getByRole('button', { name: '貼り付け' }));

    await waitFor(() => expect(readText).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledWith('be追加fore');
  });

  test('clears the current text', () => {
    const { onChange } = renderTextEditModal({ value: '消したい本文' });

    userEvent.click(screen.getByRole('button', { name: '入力内容をクリア' }));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
