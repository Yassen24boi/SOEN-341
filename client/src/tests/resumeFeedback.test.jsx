import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResumeFeedback from '../Components/ResumeFeedback';

// Fake the server, so these tests never call the backend or the AI
global.fetch = jest.fn();
console.error = jest.fn();

const FEEDBACK = {
  kind: 'general',
  strengths: ['Clear education section'],
  weaknesses: ['Vague project descriptions'],
  suggestions: ['Add numbers to your results', 'Name the technologies used', 'Add a short summary'],
  aiGenerated: true
};
const TAILORED = {
  kind: 'tailored',
  jobTitle: 'React Developer',
  matchedSkills: ['React'],
  missingSkills: ['SQL'],
  suggestions: ['Add a project that uses SQL', 'Mention your React work first', 'List the databases you know'],
  aiGenerated: true
};

describe('Sprint 3-4: US-33 / US-36 - AI resume feedback panel (ResumeFeedback.jsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock_jwt_token');
  });

  it('should ask the server for general feedback on this CV with the login token', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => FEEDBACK });

    render(<ResumeFeedback resumeId="cv123" />);
    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }));

    await screen.findByText('Clear education section');
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/resumes/cv123/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock_jwt_token' },
      body: '{}'
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

  it('should let the user pick a job and get feedback tailored to it (Task 36.2, AT-36.1)', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jobs: [{ _id: 'job1', title: 'React Developer', company: 'Maple Tech' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => TAILORED });

    render(<ResumeFeedback resumeId="cv123" />);
    fireEvent.change(screen.getByLabelText('Tailor the feedback to a job (optional)'), { target: { value: 'react' } });
    const picker = await screen.findByLabelText('Job to tailor the feedback to');
    fireEvent.change(picker, { target: { value: 'job1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback for this job' }));

    expect(await screen.findByText('Skills your CV shows')).toBeInTheDocument();
    expect(screen.getByText('Missing skills')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getByText(/Tailored to React Developer/)).toBeInTheDocument();
    expect(fetch.mock.calls[0][0]).toBe('http://localhost:5000/api/jobs?q=react');
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ jobId: 'job1' });
  });

  it('should tell the feedback history to reload after new feedback', async () => {
    const listener = jest.fn();
    window.addEventListener('feedback-history-updated', listener);
    fetch.mockResolvedValueOnce({ ok: true, json: async () => FEEDBACK });

    render(<ResumeFeedback resumeId="cv123" />);
    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }));

    await waitFor(() => expect(listener).toHaveBeenCalled());
    window.removeEventListener('feedback-history-updated', listener);
  });
});