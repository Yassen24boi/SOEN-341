import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import RecommendedJobs from '../Components/RecommendedJobs';

// Fake the server, so these tests never call the backend or the AI
global.fetch = jest.fn();
console.error = jest.fn();

const RECOMMENDATIONS = [
  { job: { _id: 'j1', title: 'Java Developer', company: 'Maple Tech', location: 'Toronto', category: 'Software' }, matchScore: 95, reason: 'Uses Java and Spring, which you know' },
  { job: { _id: 'j2', title: 'Backend Intern', company: 'Harbour', location: 'Montreal', category: 'Software' }, matchScore: 80, reason: 'Backend role matching your SQL skills' }
];

function renderSection() {
  render(
    <MemoryRouter>
      <RecommendedJobs />
    </MemoryRouter>
  );
}

describe('Sprint 3: US-34 - Recommended for you (RecommendedJobs.jsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock_jwt_token');
    localStorage.setItem('role', 'jobseeker');
  });

  it('should not show the section to visitors who are not logged in', () => {
    localStorage.clear();
    renderSection();

    expect(screen.queryByText('Recommended for you')).not.toBeInTheDocument();
  });

  it('should not show the section to recruiters', () => {
    localStorage.setItem('role', 'recruiter');
    renderSection();

    expect(screen.queryByText('Recommended for you')).not.toBeInTheDocument();
  });

  it('should show matching jobs with a score, a reason and an AI-generated label (AT-34.1)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ recommendations: RECOMMENDATIONS }) });
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Show my matches' }));

    expect(await screen.findByText('Java Developer')).toBeInTheDocument();
    expect(screen.getByText('95% match')).toBeInTheDocument();
    expect(screen.getByText('Uses Java and Spring, which you know')).toBeInTheDocument();
    expect(screen.getByText('AI-generated')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Java Developer/ })).toHaveAttribute('href', '/jobs/j1');
    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/jobs/recommended', {
      headers: { Authorization: 'Bearer mock_jwt_token' }
    });
  });

  it('should show a loading message while the AI is working', async () => {
    let finish;
    fetch.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Show my matches' }));

    expect(screen.getByRole('status')).toHaveTextContent('This can take up to 30 seconds');
    expect(screen.getByRole('button', { name: 'Finding matches...' })).toBeDisabled();

    finish({ ok: true, json: async () => ({ recommendations: RECOMMENDATIONS }) });
    await screen.findByText('Java Developer');
  });

  it('should ask the user to complete their profile when they have no skills and no CV (AT-34.2)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ needsProfile: true, message: 'Add your skills to your profile or upload a CV to get job recommendations.' })
    });
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Show my matches' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Add your skills to your profile');
    expect(screen.getByRole('link', { name: 'Complete your profile' })).toHaveAttribute('href', '/profile/edit');
  });

  it('should show "Recommendations are unavailable, try again later" when the AI is down', async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Recommendations are unavailable, try again later' }) });
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Show my matches' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Recommendations are unavailable, try again later');
  });
  
  it('should say there are no strong matches when nothing fits well', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ recommendations: [] }) });
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Show my matches' }));

    expect(await screen.findByText(/No strong matches right now/)).toBeInTheDocument();
    expect(screen.queryByText('AI-generated')).not.toBeInTheDocument();
  });
});