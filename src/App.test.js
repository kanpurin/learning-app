import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

jest.mock('./hooks/useQuizPersistence', () => ({
  clearQuizPersistence: jest.fn(),
  useQuizPersistence: () => ({
    questions: [],
    setQuestions: jest.fn(),
    fileName: 'questions_data',
    setFileName: jest.fn(),
    activeTab: 'quiz',
    setActiveTab: jest.fn(),
    savedFlags: [],
    setSavedFlags: jest.fn(),
  }),
}));

jest.mock('./components/GoogleLogin', () => ({ onUserChange }) => (
  <button onClick={() => onUserChange?.({ uid: 'test-user' })}>Google login mock</button>
));

jest.mock('./components/JSONReader', () => () => <div>JSON reader mock</div>);
jest.mock('./components/JSONWriter', () => () => <div>JSON writer mock</div>);
jest.mock('./components/Question', () => () => <div>Question mock</div>);
jest.mock('./components/CreateQuestion', () => () => <div>Create question mock</div>);
jest.mock('./components/EditQuestion', () => () => <div>Edit question mock</div>);

test('renders the quiz app shell', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'クイズアプリ' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '問題を解く' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '問題を作る' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '問題を編集する' })).toBeInTheDocument();
  expect(screen.getByText('JSON reader mock')).toBeInTheDocument();
});

test('closes the data menu from inside the sidebar', () => {
  render(<App />);

  const menuButton = screen.getByRole('button', { name: '問題データメニューを開く' });
  userEvent.click(menuButton);

  const closeButton = screen.getByRole('button', { name: 'サイドメニューを閉じる' });
  expect(closeButton).toBeInTheDocument();
  expect(menuButton).toHaveAttribute('aria-expanded', 'true');

  userEvent.click(closeButton);

  expect(screen.queryByRole('button', { name: 'サイドメニューを閉じる' })).not.toBeInTheDocument();
  expect(menuButton).toHaveAttribute('aria-expanded', 'false');
});
