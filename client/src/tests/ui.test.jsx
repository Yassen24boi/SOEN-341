//import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import the components to test
import CreateAccount from '../CreateAccount';
import Login from '../Login';
import Profile from '../Profile';
import EditProfile from '../EditProfile';
import JobDetails from '../JobDetails';
import Applications from '../Applications';
import ApplicationDetails from '../ApplicationDetails';

// Mock the window.alert and fetch API globally
global.alert = jest.fn();
global.fetch = jest.fn();
global.confirm = jest.fn();

// Mock console.error to keep test output clean from intentional errors
console.error = jest.fn();

describe('CareerConnect Frontend UI Acceptance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Sprint 1: US-01 - Register (CreateAccount.jsx)', () => {
    it('should successfully register a user, save the token, and navigate to the correct dashboard', async () => {
      // Mock successful backend response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock_jwt_token', user: { fullName: 'Test User', role: 'jobseeker' } }),
      });

      render(
        <MemoryRouter>
          <CreateAccount />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name:/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/I am a:/i), { target: { value: 'jobseeker' } });

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('token')).toBe('mock_jwt_token');
        expect(global.alert).toHaveBeenCalledWith('Account created! Welcome, Test User');
      });
    });

    it('should display an alert error if registration fails due to an existing email or invalid data', async () => {
      // Mock failed backend response
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email already exists' }),
      });

      render(
        <MemoryRouter>
          <CreateAccount />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Full Name:/i), { target: { value: 'Duplicate User' } });
      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password123' } });

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Email already exists');
        expect(localStorage.getItem('token')).toBeNull(); // Token should not be set
      });
    });
  });

  describe('Sprint 1: US-02 - Login / Logout (Login.jsx)', () => {
    it('should successfully log in and redirect based on profile completion status', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'valid_token',
          user: { fullName: 'Test User', role: 'jobseeker', hasProfile: false },
        }),
      });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('valid_token');
        expect(global.alert).toHaveBeenCalledWith('Welcome, Test User! Please set up your professional profile.');
      });
    });

    it('should show a failure alert when provided with incorrect login credentials', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'wrong@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'wrongpass' } });
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Invalid credentials');
        expect(localStorage.getItem('token')).toBeNull();
      });
    });
  });

  describe('Sprint 2: US-04 & US-05 - Create & Edit Profile (EditProfile.jsx)', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock_token');
    });

    it('should pre-populate the form with existing user data on load', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fullName: 'Jane Doe',
          headline: 'Software Developer',
          experience: [],
          education: [],
        }),
      });

      render(
        <MemoryRouter>
          <EditProfile />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name:/i)).toHaveValue('Jane Doe');
        expect(screen.getByLabelText(/Headline:/i)).toHaveValue('Software Developer');
      });
    });

    it('should prevent form submission and alert the user if an experience end date is before the start date', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fullName: 'Jane Doe', email: 'jane@example.com', experience: [], education: [] }),      });

      render(
        <MemoryRouter>
          <EditProfile />
        </MemoryRouter>
      );

      // Wait for load to finish
      await waitFor(() => screen.getByLabelText(/Full Name:/i));

      // Click Add Experience
      fireEvent.click(screen.getByText('+ Add Experience'));

      // Find the newly rendered date inputs
      const startDates = screen.getAllByLabelText(/Start Date:/i);
      const endDates = screen.getAllByLabelText(/End Date:/i);

      // Set illogical dates
      fireEvent.change(startDates[0], { target: { value: '2023-01-01' } });
      fireEvent.change(endDates[0], { target: { value: '2022-01-01' } });

      fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Experience #1: End date cannot be before the start date.');
      });
    });
  });

  describe('Sprint 2: US-06 - View Full Profile Page (Profile.jsx)', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock_token');
    });

    it('AT-06.3: should render the empty state prompt if the user has not created a profile yet (missing user_id)', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fullName: 'New User', email: 'new@example.com' }), // Note: user_id is missing
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("You don't have a profile yet!")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Profile\/Login/i })).toBeInTheDocument();
      });
    });

    it('AT-06.1: should render all populated profile sections (Headline, Experience, Education) when data is present', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: '12345',
          fullName: 'Experienced Dev',
          headline: 'Senior Engineer',
          experience: [{ title: 'Frontend Lead', company: 'Tech Corp', from: '2020-01-01', current: true }],
          education: [{ school: 'Concordia', degree: 'BSc', fieldOfStudy: 'Computer Science' }],
        }),
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Experienced Dev')).toBeInTheDocument();
        expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
        expect(screen.getByText(/Frontend Lead/i)).toBeInTheDocument();
        expect(screen.getByText(/Tech Corp/i)).toBeInTheDocument();
        expect(screen.getByText('Concordia')).toBeInTheDocument();
      });
    });
  });

  describe('Sprint 2: US-03 & US-07 - Upload and Manage Multiple CVs (Profile.jsx)', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock_token');
    });

    it('AT-07.1: should render multiple CVs, display the Default badge, and trigger PATCH when Set as Default is clicked', async () => {
      // Mocking profile load with two CVs
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: '123',
          fullName: 'Test User',
          resumes: [
            { _id: 'cv1', filename: 'first.pdf', label: 'Backend CV', isDefault: true },
            { _id: 'cv2', filename: 'second.pdf', label: 'Frontend CV', isDefault: false },
          ],
        }),
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('first.pdf')).toBeInTheDocument();
        expect(screen.getByText('second.pdf')).toBeInTheDocument();
        // The default badge should be present
        expect(screen.getByText('Default CV')).toBeInTheDocument();
      });

      // Mock the PATCH request for setting default
      fetch.mockResolvedValueOnce({ ok: true });

      // Click "Set as Default" on the second CV
      const setDefaultButtons = screen.getAllByRole('button', { name: /Set as Default/i });
      fireEvent.click(setDefaultButtons[0]);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/profile/resume/cv2/default', expect.objectContaining({
          method: 'PATCH',
          headers: { Authorization: 'Bearer mock_token' }
        }));
      });
    });

    it('AT-07.2: should trigger a DELETE request when the Delete button is clicked and user confirms', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: '123',
          resumes: [
            { _id: 'cv1', filename: 'first.pdf', label: 'CV', isDefault: true }
          ],
        }),
      });

      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('first.pdf')).toBeInTheDocument();
      });

      // Mock window.confirm to return true
      global.confirm = jest.fn(() => true);
      fetch.mockResolvedValueOnce({ ok: true });

      fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this CV?');
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/profile/resume/cv1', expect.objectContaining({
          method: 'DELETE'
        }));
      });
    });
  });

  describe('Sprint 2: US-12 - Job Application Flow (JobDetails.jsx)', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock_token');
    });

    it('AT-12.2: should prompt the user with a link to upload a CV if their profile has no CVs', async () => {
      // Mock loading job details
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'job123',
          title: 'Software Engineer',
          company: 'Tech Inc',
          description: 'Build things',
          alreadyApplied: false
        }),
      });

      render(
        <MemoryRouter initialEntries={['/jobs/job123']}>
          <JobDetails />
        </MemoryRouter>
      );

      // Wait for job details to load and Apply button to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
      });

      // Mock profile fetch returning zero CVs
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resumes: [] }),
      });

      fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));

      await waitFor(() => {
        expect(screen.getByText('You do not have a CV uploaded to your profile.')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Go to your profile to upload a CV →/i })).toBeInTheDocument();
      });
    });

      it('AT-12.1: should render CV picker with default CV pre-selected and show inline confirmation on successful submit', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'job123',
          title: 'Software Engineer',
          company: 'Tech Inc',
          description: 'Build things',
          alreadyApplied: false
        }),
      });

      render(
        <MemoryRouter initialEntries={['/jobs/job123']}>
          <Routes>
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/applications" element={<div>My Applications Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const applyButton = await screen.findByRole('button', { name: /Apply Now/i });
      expect(applyButton).toBeInTheDocument();

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resumes: [
            { _id: 'cv1', filename: 'default.pdf', label: 'Default CV', isDefault: true },
            { _id: 'cv2', filename: 'other.pdf', label: 'Other CV', isDefault: false },
          ],
        }),
      });

      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Select CV for Application')).toBeInTheDocument();
        const select = screen.getByRole('combobox');
        expect(select.value).toBe('default.pdf');
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'app123',
          jobTitle: 'Software Engineer',
          createdAt: new Date().toISOString()
        }),
      });

      fireEvent.click(screen.getByRole('button', { name: /Confirm Application/i }));

      await waitFor(() => {
        expect(screen.getByText(/Application submitted/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Software Engineer/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByRole('link', { name: /View My Applications →/i })).toBeInTheDocument();
      });
    });
  });

  describe('Sprint 2: US-13 - Application Confirmation and Error Handling (JobDetails.jsx)', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock_token');
    });

      it('AT-13.1: should return and display created application details with job title and date on success', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'job123',
          title: 'Frontend Developer',
          company: 'Web Corp',
          description: 'React stuff',
          alreadyApplied: false
        }),
      });

      render(
        <MemoryRouter initialEntries={['/jobs/job123']}>
          <Routes>
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/applications" element={<div>Applications</div>} />
          </Routes>
        </MemoryRouter>
      );

      const applyButton = await screen.findByRole('button', { name: /Apply Now/i });
      expect(applyButton).toBeInTheDocument();   

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resumes: [{ _id: 'cv1', filename: 'resume.pdf', label: 'My CV', isDefault: true }]
        }),
      });
      
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Select CV for Application')).toBeInTheDocument();
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'app999',
          jobTitle: 'Frontend Developer',
          createdAt: '2026-06-01T00:00:00.000Z'
        }),
      });

      fireEvent.click(screen.getByRole('button', { name: /Confirm Application/i }));

      await waitFor(() => {
        expect(screen.getByText('Application submitted')).toBeInTheDocument();
        expect(screen.getAllByText('Frontend Developer').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('AT-13.2: should show an error message, hide confirmation, and keep form data intact when submission fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'job123',
          title: 'Software Engineer',
          company: 'Tech Inc',
          description: 'Build things',
          alreadyApplied: false
        }),
      });

      render(
        <MemoryRouter initialEntries={['/jobs/job123']}>
          <Routes>
            <Route path="/jobs/:id" element={<JobDetails />} />
          </Routes>
        </MemoryRouter>
      );

      const applyButton = await screen.findByRole('button', { name: /Apply Now/i });
      expect(applyButton).toBeInTheDocument();   

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          resumes: [{ _id: 'cv1', filename: 'default.pdf', label: 'Default CV', isDefault: true }]
        }),
      });

      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Select CV for Application')).toBeInTheDocument();
      });

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to submit application' }),
      });

      fireEvent.click(screen.getByRole('button', { name: /Confirm Application/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to submit application')).toBeInTheDocument();
        expect(screen.queryByText(/Application submitted/i)).not.toBeInTheDocument();
        expect(screen.getByText('Select CV for Application')).toBeInTheDocument();
      });
    });
  });

  describe('Sprint 2: US-14 - My Applications & Status Tracking (Applications.jsx)', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock_token');
      fetch.mockImplementation((url) => Promise.resolve({
        ok: true,
        json: async () => url === 'http://localhost:5000/api/applications/me/stats'
          ? {
              total: 0,
              pending: 0,
              responseRate: 0,
              weeklyApplications: [],
              statuses: {
                Applied: 0,
                'Under Review': 0,
                Interview: 0,
                Offered: 0,
                Rejected: 0,
                Withdrawn: 0
              }
            }
          : []
      }));
    });

    it('AT-14.1 & Task 14.2: should render all rows with job title, company, applied date, and status when applications are fetched', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            _id: 'app1',
            job: { title: 'Software Engineer', company: 'Tech Inc', location: 'Montreal, QC' },
            status: 'Applied',
            createdAt: '2026-06-01T00:00:00.000Z',
            resumeFilename: 'resume1.pdf'
          },
          {
            _id: 'app2',
            job: { title: 'Backend Developer', company: 'Data Corp', location: 'Remote' },
            status: 'Under Review',
            createdAt: '2026-06-02T00:00:00.000Z',
            resumeFilename: 'resume2.pdf'
          },
          {
            _id: 'app3',
            job: { title: 'Fullstack Dev', company: 'Web Solutions', location: 'Toronto, ON' },
            status: 'Interview',
            createdAt: '2026-06-03T00:00:00.000Z',
            resumeFilename: 'resume3.pdf'
          }
        ]),
      });

      render(
        <MemoryRouter>
          <Applications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText(/Tech Inc/i)).toBeInTheDocument();
        expect(screen.getByText('Backend Developer')).toBeInTheDocument();
        expect(screen.getByText('Fullstack Dev')).toBeInTheDocument();
        expect(screen.getAllByText('Interview').length).toBeGreaterThan(0);
      });
    });

    it('AT-14.3: should filter applications correctly when a specific status filter is selected', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            _id: 'app1',
            job: { title: 'Software Engineer', company: 'Tech Inc' },
            status: 'Applied',
            createdAt: '2026-06-01T00:00:00.000Z'
          },
          {
            _id: 'app2',
            job: { title: 'Data Scientist', company: 'AI Corp' },
            status: 'Rejected',
            createdAt: '2026-06-02T00:00:00.000Z'
          }
        ]),
      });

      render(
        <MemoryRouter>
          <Applications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Data Scientist')).toBeInTheDocument();
      });

      // Change filter to "Rejected"
      const filterSelect = screen.getByLabelText(/Filter by Status:/i);
      fireEvent.change(filterSelect, { target: { value: 'Rejected' } });

      await waitFor(() => {
        expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
        expect(screen.getByText('Data Scientist')).toBeInTheDocument();
        expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
      });
    });

    it('Task 14.4: should display the visual status timeline for active applications', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            _id: 'app1',
            job: { title: 'Frontend Developer', company: 'UI Co' },
            status: 'Under Review',
            createdAt: '2026-06-01T00:00:00.000Z'
          }
        ]),
      });

      render(
        <MemoryRouter>
          <Applications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
        expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Interview').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Offered').length).toBeGreaterThan(0);
      });
    });

    it('AT-25.2: should search application history by company', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            _id: 'google-app',
            job: { title: 'Software Engineer', company: 'Google' },
            status: 'Interview',
            createdAt: '2026-06-03T00:00:00.000Z'
          },
          {
            _id: 'microsoft-app',
            job: { title: 'Developer', company: 'Microsoft' },
            status: 'Applied',
            createdAt: '2026-06-02T00:00:00.000Z'
          }
        ]),
      });

      render(
        <MemoryRouter>
          <Applications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Developer')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Search/i), { target: { value: 'Google' } });

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.queryByText('Developer')).not.toBeInTheDocument();
      });
    });

    it('AT-26.1: shows application counts and filters the list when a stat tile is clicked', async () => {
      const applications = [
        ...Array.from({ length: 4 }, (_, index) => ({
          _id: `applied-${index}`,
          job: { title: `Applied Role ${index}`, company: 'Company' },
          status: 'Applied',
          createdAt: '2026-06-01T00:00:00.000Z'
        })),
        {
          _id: 'review',
          job: { title: 'Review Role', company: 'Company' },
          status: 'Under Review',
          createdAt: '2026-06-02T00:00:00.000Z'
        },
        ...Array.from({ length: 2 }, (_, index) => ({
          _id: `interview-${index}`,
          job: { title: `Interview Role ${index}`, company: 'Company' },
          status: 'Interview',
          createdAt: '2026-06-03T00:00:00.000Z'
        })),
        {
          _id: 'rejected',
          job: { title: 'Rejected Role', company: 'Company' },
          status: 'Rejected',
          createdAt: '2026-06-04T00:00:00.000Z'
        }
      ];
      const stats = {
        total: 8,
        pending: 5,
        statuses: {
          Applied: 4,
          'Under Review': 1,
          Interview: 2,
          Offered: 0,
          Rejected: 1,
          Withdrawn: 0
        }
      };
      fetch.mockImplementation((url) => Promise.resolve({
        ok: true,
        json: async () => url === 'http://localhost:5000/api/applications/me/stats' ? stats : applications
      }));

      render(
        <MemoryRouter>
          <Applications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Total 8/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Pending 5/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Interview 2/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Rejected 1/i })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Under Review: 1' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Pending 5/i }));

      expect(screen.getByText('Applied Role 0')).toBeInTheDocument();
      expect(screen.getByText('Review Role')).toBeInTheDocument();
      expect(screen.queryByText('Interview Role 0')).not.toBeInTheDocument();
      expect(screen.queryByText('Rejected Role')).not.toBeInTheDocument();
    });

    it('AT-26.2: shows an empty state and browse-jobs link for a seeker with no applications', async () => {
      render(
        <MemoryRouter>
          <Applications />
        </MemoryRouter>
      );

      expect(await screen.findByText('No applications yet')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Browse jobs' })).toHaveAttribute('href', '/jobs');
    });

    it('AT-27.1/27.2/27.3: shows weekly activity, response rate, this-week count, and range toggle', async () => {
      const currentWeek = new Date();
      currentWeek.setUTCHours(0, 0, 0, 0);
      currentWeek.setUTCDate(currentWeek.getUTCDate() - ((currentWeek.getUTCDay() + 6) % 7));
      currentWeek.setUTCDate(currentWeek.getUTCDate() - 11 * 7);
      const weeklyApplications = Array.from({ length: 12 }, (_, index) => {
        const weekStarting = new Date(currentWeek);
        weekStarting.setUTCDate(weekStarting.getUTCDate() + index * 7);
        return {
          weekStarting: weekStarting.toISOString().slice(0, 10),
          count: index === 10 ? 2 : index === 11 ? 3 : 0
        };
      });
      const stats = {
        total: 10,
        pending: 8,
        responseRate: 20,
        weeklyApplications,
        statuses: {
          Applied: 8,
          'Under Review': 0,
          Interview: 2,
          Offered: 0,
          Rejected: 0,
          Withdrawn: 0
        }
      };
      fetch.mockImplementation((url) => Promise.resolve({
        ok: true,
        json: async () => url === 'http://localhost:5000/api/applications/me/stats' ? stats : []
      }));

      render(
        <MemoryRouter>
          <Applications />
        </MemoryRouter>
      );

      expect(await screen.findByText(/Response rate:/)).toHaveTextContent('20%');
      expect(screen.getByText(/This week:/).parentElement).toHaveTextContent('3');
      const chart = screen.getByRole('img', { name: 'Applications per week, last 12 weeks' });
      expect(chart.querySelectorAll('.weekly-chart-column')).toHaveLength(12);
      expect(chart.querySelector('[aria-label$=": 2"]')).toBeInTheDocument();
      expect(chart.querySelector('[aria-label$=": 3"]')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '4 weeks' }));
      const fourWeekChart = screen.getByRole('img', { name: 'Applications per week, last 4 weeks' });
      expect(fourWeekChart.querySelectorAll('.weekly-chart-column')).toHaveLength(4);
      expect(fourWeekChart.querySelector('[aria-label$=": 2"]')).toBeInTheDocument();
      expect(fourWeekChart.querySelector('[aria-label$=": 3"]')).toBeInTheDocument();
    });

    it('should successfully trigger a PATCH request to withdraw an application when the Withdraw button is clicked and confirmed', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            _id: 'app123',
            job: { title: 'Cloud Engineer', company: 'Cloud Inc' },
            status: 'Applied',
            createdAt: '2026-06-01T00:00:00.000Z'
          }
        ]),
      });

      render(
        <MemoryRouter>
          <Applications />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Cloud Engineer')).toBeInTheDocument();
      });

      // Mock window.confirm to return true and mock PATCH response
      global.confirm = jest.fn(() => true);
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Application withdrawn successfully' })
      });

      const withdrawButton = screen.getByRole('button', { name: /Withdraw/i });
      fireEvent.click(withdrawButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to withdraw this application?');
        expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/applications/app123/withdraw', expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({ Authorization: 'Bearer mock_token' })
        }));
      });
    });
  });

  describe('Sprint 3: US-23 - Candidate Application Review (ApplicationDetails.jsx)', () => {
    const jsonHeaders = {get: () => 'application/json'};
    
    beforeEach(() => {
      localStorage.setItem('token', 'mock_token');
    });

    it('AT-23.1 & Task 23.2: should display candidate profile (excluding resumes JSON), CV iframe preview, and cover letter', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({
          _id: 'app1',
          status: 'Applied',
          createdAt: '2026-11-18T22:31:49.509Z',
          resumeFilename: 'resume.pdf',
          coverLetterFilename: 'cover_letter.pdf',
          job: { _id: 'job1', title: 'Software Developer' },
          applicant: {
            fullName: 'Jose JobSeeker',
            email: 'jose@gmail.com',
            headline: 'Full-Stack Developer',
            skills: ['React', 'Node.js'],
            resumes: [
              {
                filename: 'resume.pdf',
                label: 'Software CV',
                isDefault: true,
                _id: '6afe27559b53027e76cd377f',
                uploadedAt: '2026-11-18T22:31:49.509Z'
              }
            ]
          }
        }),
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/recruiter/applications/app1',
              state: { filteredIds: ['app1', 'app2'], jobId: 'job1' },
            },
          ]}
        >
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
        expect(screen.getByText('jose@gmail.com')).toBeInTheDocument();
        expect(screen.getByText('Full-Stack Developer')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Software CV/i)).not.toBeInTheDocument();

      const cvIframe = screen.getByTitle('Candidate CV Preview');
      expect(cvIframe).toHaveAttribute('src', 'http://localhost:5000/uploads/resume.pdf');
      expect(screen.getByRole('link', { name: /Download CV \(resume\.pdf\)/i })).toBeInTheDocument();

      const clIframe = screen.getByTitle('Candidate Cover Letter Preview');
      expect(clIframe).toHaveAttribute('src', 'http://localhost:5000/uploads/cover_letter.pdf');
      expect(screen.getByRole('link', { name: /Download Cover Letter \(cover_letter\.pdf\)/i })).toBeInTheDocument();
    });

    it('Task 23.3: should navigate between filtered applications using Next and Previous buttons', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: jsonHeaders,
          json: async () => ({
            _id: 'app1',
            status: 'Applied',
            createdAt: '2026-11-18T22:31:49.509Z',
            resumeFilename: 'resume.pdf',
            job: { _id: 'job1', title: 'Software Developer' },
            applicant: { fullName: 'Jose JobSeeker', email: 'jose@gmail.com' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: jsonHeaders,
          json: async () => ({
            _id: 'app2',
            status: 'Under Review',
            createdAt: '2026-11-19T14:00:00.000Z',
            resumeFilename: 'alex_cv.pdf',
            job: { _id: 'job1', title: 'Software Developer' },
            applicant: { fullName: 'Alex Rivera', email: 'alex@example.com' },
          }),
        });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/recruiter/applications/app1',
              state: { filteredIds: ['app1', 'app2'], jobId: 'job1' },
            },
          ]}
        >
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();

      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alex Rivera' })).toBeInTheDocument();
        expect(screen.getByText('2 of 2')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Previous/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
      });
    });

    it('AT-23.2 & Task 23.4: should display an error alert when the backend rejects access with 403', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: jsonHeaders,
        json: async () => ({ message: 'Not authorized to view this application' }),
      });

      render(
        <MemoryRouter initialEntries={['/recruiter/applications/forbidden-app']}>
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Not authorized to view this application/i);
      });
    });

    it('should close the interview form when another status is selected or when an invitation is sent', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status:200,
        headers: jsonHeaders,
        json: async () => ({
          _id: 'app1',
          status: 'Applied',
          createdAt: '2026-11-18T22:31:49.509Z',
          job: { _id: 'job1', title: 'Software Developer' },
          applicant: { fullName: 'Jose JobSeeker', email: 'jose@gmail.com' },
        }),
      });

      render(
        <MemoryRouter initialEntries={['/recruiter/applications/app1']}>
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/Status/i);

      fireEvent.change(statusSelect, { target: { value: 'Interview' } });
      expect(screen.getByText(/Invite Jose JobSeeker to an interview/i)).toBeInTheDocument();

      fetch.mockResolvedValueOnce({ 
        ok: true, 
        status: 200,
        headers: jsonHeaders,
        json: async () => ({ message: 'Updated' }) });
      fireEvent.change(statusSelect, { target: { value: 'Under Review' } });

      await waitFor(() => {
        expect(screen.queryByText(/Invite Jose JobSeeker to an interview/i)).not.toBeInTheDocument();
      });

      fireEvent.change(statusSelect, { target: { value: 'Interview' } });
      fireEvent.change(screen.getByLabelText(/^Date$/i), { target: { value: '2027-05-10' } });
      fireEvent.change(screen.getByLabelText(/^Time$/i), { target: { value: '10:30' } });
      fireEvent.change(screen.getByLabelText(/Location or meeting link/i), {
        target: { value: 'https://meet.google.com/test-link' },
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: jsonHeaders,
        json: async () => ({ message: 'Interview invitation sent', interview: { _id: 'int1' } }),
      });

      fireEvent.click(screen.getByRole('button', { name: /Send invitation/i }));

      await waitFor(() => {
        expect(screen.queryByText(/Invite Jose JobSeeker to an interview/i)).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent(/Interview invitation sent to Jose JobSeeker\./i);
      });
    });
  });

  describe('US-23 & US-24 - Candidate Application Review & Stage Controls (ApplicationDetails.jsx)', () => {
    const jsonHeaders = { get: () => 'application/json' };

    beforeEach(() => {
      localStorage.setItem('token', 'mock_token');
    });

    it('AT-23.1 & Task 23.2: should display candidate profile (excluding resumes JSON), CV iframe preview, and cover letter', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({
          _id: 'app1',
          status: 'Applied',
          createdAt: '2026-11-18T22:31:49.509Z',
          resumeFilename: 'resume.pdf',
          coverLetterFilename: 'cover_letter.pdf',
          job: { _id: 'job1', title: 'Software Developer' },
          applicant: {
            fullName: 'Jose JobSeeker',
            email: 'jose@gmail.com',
            headline: 'Full-Stack Developer',
            skills: ['React', 'Node.js'],
            resumes: [
              {
                filename: 'resume.pdf',
                label: 'Software CV',
                isDefault: true,
                _id: '6afe27559b53027e76cd377f',
                uploadedAt: '2026-11-18T22:31:49.509Z'
              }
            ]
          }
        }),
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/recruiter/applications/app1',
              state: { filteredIds: ['app1', 'app2'], jobId: 'job1' },
            },
          ]}
        >
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
        expect(screen.getByText('jose@gmail.com')).toBeInTheDocument();
        expect(screen.getByText('Full-Stack Developer')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Software CV/i)).not.toBeInTheDocument();

      const cvIframe = screen.getByTitle('Candidate CV Preview');
      expect(cvIframe).toHaveAttribute('src', 'http://localhost:5000/uploads/resume.pdf');
      expect(screen.getByRole('link', { name: /Download CV \(resume\.pdf\)/i })).toBeInTheDocument();

      const clIframe = screen.getByTitle('Candidate Cover Letter Preview');
      expect(clIframe).toHaveAttribute('src', 'http://localhost:5000/uploads/cover_letter.pdf');
      expect(screen.getByRole('link', { name: /Download Cover Letter \(cover_letter\.pdf\)/i })).toBeInTheDocument();
    });

    it('Task 23.3: should navigate between filtered applications using Next and Previous buttons', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: jsonHeaders,
          json: async () => ({
            _id: 'app1',
            status: 'Applied',
            createdAt: '2026-11-18T22:31:49.509Z',
            resumeFilename: 'resume.pdf',
            job: { _id: 'job1', title: 'Software Developer' },
            applicant: { fullName: 'Jose JobSeeker', email: 'jose@gmail.com' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: jsonHeaders,
          json: async () => ({
            _id: 'app2',
            status: 'Under Review',
            createdAt: '2026-11-19T14:00:00.000Z',
            resumeFilename: 'alex_cv.pdf',
            job: { _id: 'job1', title: 'Software Developer' },
            applicant: { fullName: 'Alex Rivera', email: 'alex@example.com' },
          }),
        });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/recruiter/applications/app1',
              state: { filteredIds: ['app1', 'app2'], jobId: 'job1' },
            },
          ]}
        >
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();

      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alex Rivera' })).toBeInTheDocument();
        expect(screen.getByText('2 of 2')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Previous/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
      });
    });

    it('AT-23.2 & Task 23.4: should display an error alert when the backend rejects access with 403', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: jsonHeaders,
        json: async () => ({ message: 'Not authorized to view this application' }),
      });

      render(
        <MemoryRouter initialEntries={['/recruiter/applications/forbidden-app']}>
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Not authorized to view this application/i);
      });
    });

    it('should close the interview form when another status is selected or when an invitation is sent', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({
          _id: 'app1',
          status: 'Applied',
          createdAt: '2026-11-18T22:31:49.509Z',
          job: { _id: 'job1', title: 'Software Developer' },
          applicant: { fullName: 'Jose JobSeeker', email: 'jose@gmail.com' },
        }),
      });

      render(
        <MemoryRouter initialEntries={['/recruiter/applications/app1']}>
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/Status/i);

      fireEvent.change(statusSelect, { target: { value: 'Interview' } });
      expect(screen.getByText(/Invite Jose JobSeeker to an interview/i)).toBeInTheDocument();

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({ message: 'Updated' }),
      });
      fireEvent.change(statusSelect, { target: { value: 'Under Review' } });

      await waitFor(() => {
        expect(screen.queryByText(/Invite Jose JobSeeker to an interview/i)).not.toBeInTheDocument();
      });

      fireEvent.change(statusSelect, { target: { value: 'Interview' } });
      fireEvent.change(screen.getByLabelText(/^Date$/i), { target: { value: '2027-05-10' } });
      fireEvent.change(screen.getByLabelText(/^Time$/i), { target: { value: '10:30' } });
      fireEvent.change(screen.getByLabelText(/Location or meeting link/i), {
        target: { value: 'https://meet.google.com/test-link' },
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: jsonHeaders,
        json: async () => ({ message: 'Interview invitation sent', interview: { _id: 'int1' } }),
      });

      fireEvent.click(screen.getByRole('button', { name: /Send invitation/i }));

      await waitFor(() => {
        expect(screen.queryByText(/Invite Jose JobSeeker to an interview/i)).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent(/Interview invitation sent to Jose JobSeeker\./i);
      });
    });

    it('AT-24.1 & confirm prompt: updates status to Under Review when confirmed and cancels when declined', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({
          _id: 'app1',
          status: 'Applied',
          createdAt: '2026-11-18T22:31:49.509Z',
          job: { _id: 'job1', title: 'Software Developer' },
          applicant: { fullName: 'Jose JobSeeker', email: 'jose@gmail.com' },
        }),
      });

      render(
        <MemoryRouter initialEntries={['/recruiter/applications/app1']}>
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
      });

      const callsAfterLoad = fetch.mock.calls.length
      const statusSelect = screen.getByLabelText(/Status/i);

      // Declining confirmation should not call PATCH
      fireEvent.change(statusSelect, { target: { value: 'Under Review' } });
      expect(window.confirm).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(callsAfterLoad);
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/status'),
        expect.anything()
      );

      // Confirming should send PATCH /api/applications/app1/status
      window.confirm.mockReturnValue(true);
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({ message: 'Application status updated successfully' }),
      });

      fireEvent.change(statusSelect, { target: { value: 'Under Review' } });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:5000/api/applications/app1/status',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ status: 'Under Review' }),
          })
        );
      });
    });

    it('blocks forbidden status transitions without showing window.confirm', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({
          _id: 'app-offered',
          status: 'Offered',
          createdAt: '2026-11-18T22:31:49.509Z',
          job: { _id: 'job1', title: 'Software Developer' },
          applicant: { fullName: 'Jose JobSeeker', email: 'jose@gmail.com' },
        }),
      });

      render(
        <MemoryRouter initialEntries={['/recruiter/applications/app-offered']}>
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
      });

      const callsAfterLoad = fetch.mock.calls.length;
      fireEvent.change(screen.getByLabelText(/Status/i), { target: { value: 'Interview' } });

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Cannot move application from Offered to Interview.');
      expect(fetch).toHaveBeenCalledTimes(callsAfterLoad);
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/status'),
        expect.anything()
      );
    });

    it('AT-24.2: disables the status dropdown when application status is Withdrawn', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({
          _id: 'app-withdrawn',
          status: 'Withdrawn',
          createdAt: '2026-11-18T22:31:49.509Z',
          job: { _id: 'job1', title: 'Software Developer' },
          applicant: { fullName: 'Jose JobSeeker', email: 'jose@gmail.com' },
        }),
      });

      render(
        <MemoryRouter initialEntries={['/recruiter/applications/app-withdrawn']}>
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Status/i)).toBeDisabled();
    });

    it('AT-24.2: disables the status dropdown when application status is Withdrawn', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: jsonHeaders,
        json: async () => ({
          _id: 'app-withdrawn',
          status: 'Withdrawn',
          createdAt: '2026-11-18T22:31:49.509Z',
          job: { _id: 'job1', title: 'Software Developer' },
          applicant: { fullName: 'Jose JobSeeker', email: 'jose@gmail.com' },
        }),
      });

      render(
        <MemoryRouter initialEntries={['/recruiter/applications/app-withdrawn']}>
          <Routes>
            <Route path="/recruiter/applications/:applicationId" element={<ApplicationDetails />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Jose JobSeeker' })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Status/i)).toBeDisabled();
    });
  });
});
