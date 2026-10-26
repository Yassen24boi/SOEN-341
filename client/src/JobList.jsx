import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const API = 'http://localhost:5000/api/jobs'

// App.css makes every button full width, so the buttons on this page undo that
const buttonStyle = { width: 'auto', padding: '6px 14px' }
const fieldStyle = { padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 }

// "full-time" -> "Full-time"
function formatType(type) {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : ''
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

  function clearSearch() {
    setSearchText('')
    updateParams({ q: '' })
  }

  function resetFilters() {
    setSearchText('')
    setSearchParams({})
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, textAlign: 'left' }}>
      <h1>Find a job</h1>

      {/* Search bar (US-09) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          aria-label="Search jobs"
          placeholder="Search by title, company or keyword"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ ...fieldStyle, flex: 1 }}
        />
        <button type="button" onClick={clearSearch} disabled={!searchText} style={buttonStyle}>
          Clear
        </button>
      </div>

      {/* Filter panel (US-10) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <select aria-label="Location" value={location} onChange={(e) => updateParams({ location: e.target.value })} style={fieldStyle}>
          <option value="">All locations</option>
          {filterOptions.locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select aria-label="Category" value={category} onChange={(e) => updateParams({ category: e.target.value })} style={fieldStyle}>
          <option value="">All categories</option>
          {filterOptions.categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select aria-label="Job type" value={type} onChange={(e) => updateParams({ type: e.target.value })} style={fieldStyle}>
          <option value="">All job types</option>
          {filterOptions.types.map((t) => (
            <option key={t} value={t}>{formatType(t)}</option>
          ))}
        </select>
        <button type="button" onClick={resetFilters} disabled={!hasSearchOrFilters} style={buttonStyle}>
          Reset filters
        </button>
      </div>

      {loading && <p>Loading jobs...</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {/* Empty states (AT-08.3, AT-09.2) */}
      {!loading && !error && result.jobs.length === 0 && (
        <p>{hasSearchOrFilters ? 'No jobs match your search.' : 'No jobs available right now.'}</p>
      )}

      {!loading && result.total > 0 && (
        <p style={{ fontSize: 14 }}>{result.total} job{result.total === 1 ? '' : 's'} found</p>
      )}

      {/* Job cards (Task 8.4). Clicking a card opens the job details page (US-11). */}
      {result.jobs.map((job) => (
        <Link
          key={job._id}
          to={`/jobs/${job._id}`}
          style={{ display: 'block', border: '1px solid #888', borderRadius: 6, padding: 12, marginBottom: 10, color: 'inherit', textDecoration: 'none' }}
        >
          <strong style={{ fontSize: 18 }}>{job.title}</strong>
          <div>{job.company}{job.location && ` · ${job.location}`}</div>
          <div style={{ fontSize: 14 }}>
            {formatType(job.type)} · {job.category} · Posted {new Date(job.createdAt).toLocaleDateString()}
          </div>
        </Link>
      ))}

      {/* Pagination (AT-08.1) */}
      {result.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          <button type="button" style={buttonStyle} disabled={result.page <= 1} onClick={() => updateParams({ page: result.page - 1 })}>
            Previous
          </button>
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              aria-current={pageNumber === result.page ? 'page' : undefined}
              style={{ ...buttonStyle, fontWeight: pageNumber === result.page ? 'bold' : 'normal' }}
              onClick={() => updateParams({ page: pageNumber })}
            >
              {pageNumber}
            </button>
          ))}
          <button type="button" style={buttonStyle} disabled={result.page >= result.totalPages} onClick={() => updateParams({ page: result.page + 1 })}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default JobList
