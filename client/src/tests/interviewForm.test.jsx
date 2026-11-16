import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InterviewForm from '../Components/InterviewForm';

// Fake the server, so these tests never call the backend
global.fetch = jest.fn();
console.error = jest.fn();

// "YYYY-MM-DD" for a day `days` from today
function dayFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderForm(props = {}) {
  const onSent = jest.fn();
  const onCancel = jest.fn();
  render(<InterviewForm applicationId="app123" candidateName="Jane Doe" onSent={onSent} onCancel={onCancel} {...props} />);
  return { onSent, onCancel };
}

function fillForm({ date, time = '14:30', where = 'https://meet.example.com/abc', message = '' }) {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } });
  fireEvent.change(screen.getByLabelText('Time'), { target: { value: time } });
  fireEvent.change(screen.getByLabelText('Location or meeting link'), { target: { value: where } });
  fireEvent.change(screen.getByLabelText('Message (optional)'), { target: { value: message } });
}

describe('Sprint 3: US-30 - Interview invitation form (InterviewForm.jsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock_jwt_token');
  });

  it('should send the date, time, link and message for this application (AT-30.1)', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ interview: { locationOrLink: 'https://meet.example.com/abc' } }) });
    const { onSent } = renderForm();
    const date = dayFromToday(3);

    fillForm({ date, message: 'See you soon!' });
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    await screen.findByRole('button', { name: 'Send invitation' });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('http://localhost:5000/api/applications/app123/interview');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer mock_jwt_token');
    expect(JSON.parse(options.body)).toEqual({
      scheduledAt: new Date(`${date}T14:30`).toISOString(),
      locationOrLink: 'https://meet.example.com/abc',
      message: 'See you soon!'
    });
    expect(onSent).toHaveBeenCalledWith({ locationOrLink: 'https://meet.example.com/abc' });
  });

  it('should show "Interview date must be in the future" for a past date and send nothing (AT-30.2)', () => {
    const { onSent } = renderForm();

    fillForm({ date: dayFromToday(-1) });
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Interview date must be in the future');
    expect(fetch).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  it('should ask for a location or meeting link', () => {
    renderForm();

    fillForm({ date: dayFromToday(3), where: '  ' });
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please add a location or meeting link');
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should show the server's message when the invitation is rejected", async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Interview date must be in the future' }) });
    const { onSent } = renderForm();

    fillForm({ date: dayFromToday(3) });
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Interview date must be in the future');
    expect(onSent).not.toHaveBeenCalled();
  });

  it('should close without sending when Cancel is clicked', () => {
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
