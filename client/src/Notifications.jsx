import { useEffect, useState } from 'react'

const API = 'http://localhost:5000/api/notifications'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch(API, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.message || 'Could not load notifications')
        }

        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [token])

  async function markAsRead(id) {
    setError('')

    try {
      const res = await fetch(`${API}/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })

      const updated = await res.json()
      if (!res.ok) {
        throw new Error(updated.message || 'Could not update notification')
      }

      setNotifications(current =>
        current.map(item => item._id === id ? updated : item)
      )

      // Reload the count so repeated clicks cannot decrement it incorrectly.
      const countRes = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (countRes.ok) {
        const data = await countRes.json()
        setUnreadCount(data.unreadCount)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function markAllAsRead() {
    setError('')

    try {
      const res = await fetch(`${API}/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Could not update notifications')
      }

      const now = new Date().toISOString()
      setNotifications(current =>
        current.map(item => ({
          ...item,
          readAt: item.readAt || now
        }))
      )
      setUnreadCount(0)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page narrow">
      <span className="eyebrow">Stay updated</span>
      <h1>Notifications</h1>

      {error && <p role="alert">{error}</p>}

      {loading ? (
        <p className="muted">Loading notifications...</p>
      ) : (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <p className="muted">{unreadCount} unread</p>

            <button
              className="btn small"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          {!error && notifications.length === 0 && (
            <div className="card" style={{ padding: 24 }}>
              <p className="muted">No notifications yet.</p>
            </div>
          )}

          {notifications.map(item => (
            <article
              key={item._id}
              className="card"
              style={{
                padding: 20,
                marginBottom: 12,
                borderLeft: !item.readAt
                  ? '4px solid var(--accent)'
                  : undefined
              }}
            >
              <p style={{ fontWeight: item.readAt ? 400 : 700 }}>
                {!item.readAt && <span aria-label="Unread">● </span>}
                {item.message}
              </p>

              <p className="muted">
                {new Date(item.createdAt).toLocaleString()}
              </p>

              {!item.readAt && (
                <button
                  className="btn small"
                  onClick={() => markAsRead(item._id)}
                >
                  Mark as read
                </button>
              )}
            </article>
          ))}
        </>
      )}
    </div>
  )
}

export default Notifications