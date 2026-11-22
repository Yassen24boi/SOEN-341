import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeedbackHistory from '../Components/FeedbackHistory';

// Fake the server, so these tests never call the backend
global.fetch = jest.fn();
console.error = jest.fn();

const HISTORY = [
  {
    _id: 'f2', kind: 'tailored', jobTitle: 'React Developer', resumeLabel: 'Main CV', createdAt: '2026-11-20T15:00:00.000Z',
    feedback: { matchedSkills: ['React'], missingSkills: ['SQL'], suggestions: ['Add SQL', 'Lead with React', 'List databases'] }
  },
  {
    _id: 'f1', kind: 'general', jobTitle: '', resumeLabel: 'Main CV', createdAt: '2026-11-19T10:00:00.000Z',
    feedback: { strengths: ['Clear layout'], weaknesses: ['Vague bullets'], suggestions: ['Add numbers', 'Name tools', 'Add a summary'] }
  }
];

describe('Sprint 4: US-36 - AI feedback history (FeedbackHistory.jsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock_jwt_token');
  });

  it('should list both earlier results with their dates and the job each was for (AT-36.2)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => HISTORY });

    render(<FeedbackHistory />);

    expect(await screen.findByText('For: React Developer')).toBeInTheDocument();
    expect(screen.getByText('General feedback')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(new Date(HISTORY[0].createdAt).toLocaleString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/resumes/feedback/history', {
      headers: { Authorization: 'Bearer mock_jwt_token' }
    });
  });

  it('should show the full feedback when View is clicked', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => HISTORY });
    render(<FeedbackHistory />);
    await screen.findByText('For: React Developer');

    fireEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);

    expect(screen.getByText('Missing skills')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('should say when there is no feedback yet', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<FeedbackHistory />);

    expect(await screen.findByText(/No AI feedback yet/)).toBeInTheDocument();
  });

  it('should reload when new feedback is requested', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => HISTORY });
    render(<FeedbackHistory />);
    await screen.findByText(/No AI feedback yet/);

    await act(async () => {
      window.dispatchEvent(new Event('feedback-history-updated'));
    });

    expect(await screen.findByText('For: React Developer')).toBeInTheDocument();
  });
});