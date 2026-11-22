import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import JobFeedbackButton from '../Components/JobFeedbackButton.jsx';

// Fake the server, so these tests never call the backend or the AI
global.fetch = jest.fn();
console.error = jest.fn();

const TAILORED = {
  kind: 'tailored',
  jobTitle: 'React Developer',
  matchedSkills: ['React'],
  missingSkills: ['SQL'],
  suggestions: ['Add a project that uses SQL', 'Mention your React work first', 'List the databases you know']
};

function renderButton() {
  render(
    <MemoryRouter>
      <JobFeedbackButton jobId="job1" />
    </MemoryRouter>
  );
}

describe('Sprint 4: US-36 - AI feedback on the job details page (JobFeedbackButton.jsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock_jwt_token');
    localStorage.setItem('role', 'jobseeker');
  });

  it('should not show the button to recruiters or visitors', () => {
    localStorage.setItem('role', 'recruiter');
    renderButton();

    expect(screen.queryByRole('button', { name: 'Get AI feedback for this job' })).not.toBeInTheDocument();
  });

  it("should compare the default CV with this job and show matched and missing skills (Task 36.5, AT-36.1)", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => TAILORED });
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback for this job' }));

    expect(await screen.findByText('Skills your CV shows')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('SQL')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('http://localhost:5000/api/resumes/default/feedback');
    expect(JSON.parse(options.body)).toEqual({ jobId: 'job1' });
  });

  it('should send users without a CV to their profile', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ message: 'Upload a CV to your profile first' }) });
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback for this job' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Upload a CV to your profile first');
    expect(screen.getByRole('link', { name: 'Go to your profile' })).toHaveAttribute('href', '/profile');
  });

  it('should show "Feedback is unavailable, try again later" when the AI is down', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ message: 'Feedback is unavailable, try again later' }) });
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Get AI feedback for this job' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Feedback is unavailable, try again later');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});