const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true, // S3 object key
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [200, 'Lesson title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    chapter: {
      type: String,
      trim: true,
      default: 'General',
    },
    order: {
      type: Number,
      default: 1,
    },
    videoKey: {
      type: String,
      default: '', // Private S3 object key
    },
    videoDuration: {
      type: Number,
      default: 0, // In seconds
    },
    videoSize: {
      type: Number,
      default: 0, // In bytes
    },
    notes: [noteSchema],
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for course lessons ordering
lessonSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);

