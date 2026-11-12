const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['application_status', 'new_application'],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

// Supports listing a user's notifications and finding unread ones.
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, readAt: 1 })

module.exports = mongoose.model('Notification', notificationSchema)