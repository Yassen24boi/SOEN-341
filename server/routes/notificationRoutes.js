const express = require('express')
const mongoose = require('mongoose')
const Notification = require('../models/Notification')
const requireAuth = require('../middleware/auth')

const router = express.Router()

// Every notification endpoint requires a valid JWT.
router.use(requireAuth)

// GET /api/notifications?page=1
// Returns the user's notifications, newest first, plus unread count.
router.get('/', async (req, res) => {
  try {
    const requestedPage = Number(req.query.page || 1)

    if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
      return res.status(400).json({ message: 'Invalid page number' })
    }

    const limit = 20
    const filter = { recipient: req.userId }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((requestedPage - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, readAt: null })
    ])

    res.json({
      notifications,
      unreadCount,
      page: requestedPage,
      totalPages: Math.ceil(total / limit),
      total
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load notifications' })
  }
})

// PATCH /api/notifications/read-all
// Marks only this user's unread notifications as read.
router.patch('/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.userId, readAt: null },
      { $set: { readAt: new Date() } }
    )

    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not update notifications' })
  }
})

// PATCH /api/notifications/:id/read
// Marks one notification as read, preserving its first read time.
router.patch('/:id/read', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid notification ID' })
    }

    const filter = {
      _id: req.params.id,
      recipient: req.userId
    }

    let notification = await Notification.findOneAndUpdate(
      { ...filter, readAt: null },
      { $set: { readAt: new Date() } },
      { new: true }
    )

    // An already-read notification can still be returned successfully.
    if (!notification) {
      notification = await Notification.findOne(filter)
    }

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    res.json(notification)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not update notification' })
  }
})

module.exports = router