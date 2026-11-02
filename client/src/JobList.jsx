import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'

// "full-time" -> "Full-time"
function formatType(type) {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : ''
}

// Shows pay, e.g. "$60,000 - $80,000/year" or "$25 - $32/hour"
function salaryText(job) {
  const money = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  const unit = job.salaryPeriod === 'hourly' ? '/hour' : '/year'
  if (job.salaryMin && job.salaryMax) return `${money(job.salaryMin)} - ${money(job.salaryMax)}${unit}`
  if (job.salaryMin) return `From ${money(job.salaryMin)}${unit}`
  return `Up to ${money(job.salaryMax)}${unit}`
}

function JobList() {
  // The search, filters and page live in the URL (e.g. /jobs?q=java&page=2),
  // so they survive a page refresh and can be shared as a link (Task 9.3)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchText, setSearchText] = useState(searchParams.get('q') || '')
  const [result, setResult] = useState({ jobs: [], page: 1, totalPages: 0, total: 0 })
  const [filterOptions, setFilterOptions] = useState({ locations: [], categories: [], types: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const location = searchParams.get('location') || ''
  const category = searchParams.get('category') || ''
  const type = searchParams.get('type') || ''
  const hasSearchOrFilters = Boolean(searchParams.get('q') || location || category || type)
  const queryString = searchParams.toString()

  // Changes some values in the URL. Any change other than the page goes back to page 1.
  function updateParams(changes) {
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      Object.entries(changes).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
      if (!('page' in changes)) next.delete('page')
      return next
    })
  }

  // Load the options for the filter dropdowns once (US-10)
  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetch(`${API}/filters`)
        if (res.ok) setFilterOptions(await res.json())
      } catch (err) {
        console.error(err)
      }
    }
    loadFilters()
  }, [])

  // Load the jobs every time the search, filters or page in the URL change (US-08)
  useEffect(() => {
    let ignore = false
    async function loadJobs() {
      try {
        const res = await fetch(`${API}?${queryString}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        if (!ignore) {
          setResult(data)
          setError('')
        }
      } catch (err) {
        console.error(err)
        if (!ignore) setError('Could not load jobs. Is the server running?')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    loadJobs()
    // If the user changes the search again before this answer arrives, ignore the old answer
    return () => {
      ignore = true
    }
  }, [queryString])

  // Wait until the user stops typing for 300 ms before searching (Task 9.2)
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchText.trim()
      if (q !== (searchParams.get('q') || '')) {
        setSearchParams((params) => {
          const next = new URLSearchParams(params)
          if (q) next.set('q', q)
          else next.delete('q')
          next.delete('page')
          return next
        })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText, searchParams, setSearchParams])

  function resetFilters() {
    setSearchText('')
    setSearchParams({})
  }

  return (
    <div className="page">
      <span className="eyebrow">Browse openings</span>
      <h1>Find a job</h1>

      {/* Search bar (US-09) and filter panel (US-10) */}
      <div className="card toolbar">
        <input
          type="text"
          aria-label="Search jobs"
          placeholder="Search by title, company or keyword"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select aria-label="Location" value={location} onChange={(e) => updateParams({ location: e.target.value })}>
          <option value="">All locations</option>
          {filterOptions.locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select aria-label="Category" value={category} onChange={(e) => updateParams({ category: e.target.value })}>
          <option value="">All categories</option>
          {filterOptions.categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select aria-label="Job type" value={type} onChange={(e) => updateParams({ type: e.target.value })}>
          <option value="">All job types</option>
          {filterOptions.types.map((t) => (
            <option key={t} value={t}>{formatType(t)}</option>
          ))}
        </select>
        <button type="button" onClick={resetFilters} disabled={!hasSearchOrFilters}>
          Reset
        </button>
      </div>

      {loading && <p className="muted">Loading jobs...</p>}
      {error && <p className="error">{error}</p>}

      {/* Empty states (AT-08.3, AT-09.2) */}
      {!loading && !error && result.jobs.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <p className="muted">{hasSearchOrFilters ? 'No jobs match your search. Try a different keyword or reset the filters.' : 'No jobs available right now.'}</p>
        </div>
      )}

      {!loading && result.total > 0 && (
        <p className="muted" style={{ fontSize: 14, margin: '4px 0 12px' }}>{result.total} job{result.total === 1 ? '' : 's'} found</p>
      )}

      {/* Job cards (Task 8.4). Clicking a card opens the job details page (US-11). */}
      {result.jobs.map((job) => (
        <Link key={job._id} to={`/jobs/${job._id}`} className="card job-card">
          <div>
            <h3>{job.title}</h3>
            <div className="job-co">{job.company}{job.location && ` · ${job.location}`}</div>
          </div>
          <div className="job-meta">
            <span className="pill good">{formatType(job.type)}</span>
            {job.category && <span className="tag">{job.category}</span>}
            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </Link>
      ))}

      {/* Pagination (AT-08.1) */}
      {result.totalPages > 1 && (
        <div className="pager">
          <button type="button" disabled={result.page <= 1} onClick={() => updateParams({ page: result.page - 1 })}>
            Previous
          </button>
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              aria-current={pageNumber === result.page ? 'page' : undefined}
              onClick={() => updateParams({ page: pageNumber })}
            >
              {pageNumber}
            </button>
          ))}
          <button type="button" disabled={result.page >= result.totalPages} onClick={() => updateParams({ page: result.page + 1 })}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default JobList