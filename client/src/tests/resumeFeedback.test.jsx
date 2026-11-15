import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeFeedback from '../Components/ResumeFeedback';

// Fake the server, so these tests never call the backend or the AI
global.fetch = jest.fn();
console.error = jest.fn();

const FEEDBACK = {
  strengths: ['Clear education section'],
  weaknesses: ['Vague project descriptions'],
  suggestions: ['Add numbers to your results', 'Name the technologies used', 'Add a short summary'],
  aiGenerated: true
};

describe('Sprint 3: US-33 - AI resume feedback panel (ResumeFeedback.jsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock_jwt_token');
  });

  it('should ask the server for feedback on this CV with the login token', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => FEEDBACK });

    render(<ResumeFeedback resumeId="cv123" />);
    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }));

    await screen.findByText('Clear education section');
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/resumes/cv123/feedback', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock_jwt_token' }
    });
  });

  it('should show a loading message while waiting for the AI', async () => {
    let finish;
    fetch.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));

    render(<ResumeFeedback resumeId="cv123" />);
    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }));

    expect(screen.getByRole('status')).toHaveTextContent('This can take up to 30 seconds');
    expect(screen.getByRole('button', { name: 'Getting feedback...' })).toBeDisabled();

    finish({ ok: true, json: async () => FEEDBACK });
    await screen.findByText('Clear education section');
  });

  it('should show strengths, weaknesses, at least 3 suggestions and an AI-generated label (AT-33.1)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => FEEDBACK });

    render(<ResumeFeedback resumeId="cv123" />);
    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }));

    expect(await screen.findByText('AI-generated')).toBeInTheDocument();
    expect(screen.getByText('Strengths')).toBeInTheDocument();
    expect(screen.getByText('Vague project descriptions')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Get new AI feedback' })).toBeEnabled();
  });

  it('should show "Feedback is unavailable, try again later" when the AI is down (AT-33.2)', async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Feedback is unavailable, try again later' }) });

    render(<ResumeFeedback resumeId="cv123" />);
    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Feedback is unavailable, try again later');
    expect(screen.queryByText('AI-generated')).not.toBeInTheDocument();
  });

  it('should show the same message when the server cannot be reached', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ResumeFeedback resumeId="cv123" />);
    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Feedback is unavailable, try again later');
  });
});
