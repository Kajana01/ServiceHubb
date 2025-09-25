const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Notification = require('../models/Notification');

// @route   POST /api/feedback
// @desc    Create new feedback
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      bookingId,
      technicianId,
      serviceId,
      rating,
      comment,
      categories,
      isAnonymous,
      isPublic
    } = req.body;

    // Validate required fields
    if (!bookingId || !serviceId || !rating) {
      return res.status(400).json({
        message: 'Booking ID, service ID, and rating are required'
      });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Allow feedback for any booking status
    // if (booking.status !== 'completed') {
    //   return res.status(400).json({ message: 'Can only provide feedback for completed bookings' });
    // }

    // Check if feedback already exists for this booking
    const existingFeedback = await Feedback.findOne({ booking: bookingId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already exists for this booking' });
    }

    // Create feedback
    const feedback = new Feedback({
      houseOwner: req.user.id,
      technician: technicianId || booking.technician, // Use booking's technician if technicianId is null
      service: serviceId,
      booking: bookingId,
      rating,
      comment: comment || '',
      categories: categories || [],
      isAnonymous: isAnonymous || false,
      isPublic: isPublic !== false,
      status: 'pending'
    });

    await feedback.save();

    // Populate feedback details
    await feedback.populate([
      { path: 'houseOwner', select: 'username email' },
      { path: 'technician', select: 'username email' },
      { path: 'service', select: 'name category' },
      { path: 'booking', select: 'scheduledDate estimatedCost' }
    ]);

    // Create notification for admin and announcement
    try {
      const Announcement = require('../models/Announcement');
      
      // Find admin users
      const adminUsers = await User.find({ role: 'admin' });
      
      for (const admin of adminUsers) {
        const technicianName = feedback.technician?.username || 'No technician assigned';
        const notification = new Notification({
          recipient: admin._id,
          type: 'feedback_received',
          title: 'New Customer Feedback',
          message: `${req.user.username} has submitted feedback for ${feedback.service.name} service (Technician: ${technicianName}). Rating: ${rating}/5 stars`,
          relatedEntity: 'feedback',
          entityId: feedback._id,
          priority: rating <= 2 ? 'high' : rating <= 3 ? 'medium' : 'low',
          actionRequired: true,
          actionUrl: `/admin/feedback/${feedback._id}`,
          isRead: false
        });
        
        await notification.save();

        // Emit real-time notification if socket.io is available
        if (req.app.get('io')) {
          const io = req.app.get('io');
          io.to(admin._id.toString()).emit('newNotification', {
            notification: await notification.populate('recipient', 'username email')
          });
        }
      }

      // Create announcement for feedback (admin can later send to technicians)
      const announcement = new Announcement({
        title: `New Feedback Received - ${feedback.service.name}`,
        content: `Feedback received from ${req.user.username} for ${feedback.service.name} service (Technician: ${technicianName}). Rating: ${rating}/5 stars${comment ? `. Comment: "${comment}"` : ''}`,
        type: 'feedback',
        targetAudience: 'admins', // Initially for admins only
        priority: rating <= 2 ? 'high' : rating <= 3 ? 'medium' : 'low',
        createdBy: req.user.id,
        relatedFeedback: feedback._id
      });

      await announcement.save();
      
    } catch (notificationError) {
      console.error('Error creating feedback notification:', notificationError);
      // Don't fail the feedback if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });

  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ message: 'Server error during feedback creation' });
  }
});

// @route   GET /api/feedback/user
// @desc    Get feedbacks for the authenticated user
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'house_owner') {
      query.houseOwner = req.user.id;
    } else if (req.user.role === 'technician') {
      query.technician = req.user.id;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const feedbacks = await Feedback.find(query)
      .populate('houseOwner', 'username email')
      .populate('technician', 'username email')
      .populate('service', 'name category')
      .populate('booking', 'scheduledDate estimatedCost')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      feedbacks
    });

  } catch (error) {
    console.error('Get user feedbacks error:', error);
    res.status(500).json({ message: 'Server error while fetching user feedbacks' });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedbacks with filters
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status, rating, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }

    const skip = (page - 1) * limit;
    
    const feedbacks = await Feedback.find(query)
      .populate('houseOwner', 'username email')
      .populate('technician', 'username email')
      .populate('service', 'name category')
      .populate('booking', 'scheduledDate estimatedCost')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      feedbacks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalFeedbacks: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ message: 'Server error while fetching feedbacks' });
  }
});

// @route   GET /api/feedback/stats
// @desc    Get feedback statistics
// @access  Private (Admin)
router.get('/stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const stats = await Feedback.getFeedbackStats();
    const result = stats[0] || {
      totalFeedbacks: 0,
      avgRating: 0,
      ratingDistribution: []
    };

    // Count by status
    const statusCounts = await Feedback.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      hidden: 0
    };

    statusCounts.forEach(item => {
      statusStats[item._id] = item.count;
    });

    res.json({
      success: true,
      stats: {
        total: result.totalFeedbacks,
        pending: statusStats.pending,
        approved: statusStats.approved,
        rejected: statusStats.rejected,
        hidden: statusStats.hidden,
        averageRating: result.avgRating || 0,
        ratingDistribution: result.ratingDistribution || []
      }
    });

  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ message: 'Server error while fetching feedback stats' });
  }
});

// @route   PUT /api/feedback/:id/status
// @desc    Update feedback status
// @access  Private (Admin)
router.put('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status } = req.body;
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'hidden'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status' 
      });
    }

    feedback.status = status;
    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      feedback
    });

  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({ message: 'Server error while updating feedback status' });
  }
});

// @route   POST /api/feedback/:id/reply
// @desc    Add admin reply to feedback
// @access  Private (Admin)
router.post('/:id/reply', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.adminResponse = {
      content: content.trim(),
      respondedBy: req.user.id,
      respondedAt: new Date()
    };

    await feedback.save();

    res.json({
      success: true,
      message: 'Reply added successfully',
      feedback
    });

  } catch (error) {
    console.error('Add feedback reply error:', error);
    res.status(500).json({ message: 'Server error while adding reply' });
  }
});

// @route   POST /api/feedback/:id/helpful
// @desc    Mark feedback as helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await feedback.markAsHelpful();

    res.json({
      success: true,
      message: 'Feedback marked as helpful',
      helpfulCount: feedback.helpfulCount
    });

  } catch (error) {
    console.error('Mark feedback helpful error:', error);
    res.status(500).json({ message: 'Server error while marking feedback as helpful' });
  }
});

// @route   POST /api/feedback/:id/report
// @desc    Report feedback
// @access  Private
router.post('/:id/report', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await feedback.report();

    res.json({
      success: true,
      message: 'Feedback reported successfully',
      reportedCount: feedback.reportedCount
    });

  } catch (error) {
    console.error('Report feedback error:', error);
    res.status(500).json({ message: 'Server error while reporting feedback' });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (owner or admin)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const isOwner = feedback.houseOwner?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error while deleting feedback' });
  }
});

// @route   PUT /api/feedback/:id
// @desc    Update feedback (owner or admin). Admin may set status.
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, comment, categories, isPublic, status } = req.body;
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const isOwner = feedback.houseOwner?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Owners can update rating/comment/categories/isPublic. Admin can also set status.
    if (rating !== undefined) feedback.rating = rating;
    if (comment !== undefined) feedback.comment = comment;
    if (categories !== undefined) feedback.categories = categories;
    if (isPublic !== undefined) feedback.isPublic = isPublic;
    if (isAdmin && status !== undefined) feedback.status = status;

    await feedback.save();

    // Populate feedback details
    await feedback.populate([
      { path: 'houseOwner', select: 'username email' },
      { path: 'technician', select: 'username email' },
      { path: 'service', select: 'name category' },
      { path: 'booking', select: 'scheduledDate estimatedCost' }
    ]);

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });

  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ message: 'Server error while updating feedback' });
  }
});

// @route   GET /api/feedback/export
// @desc    Export feedbacks to CSV
// @access  Private (Admin)
router.get('/export', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const feedbacks = await Feedback.find({})
      .populate('houseOwner', 'username email')
      .populate('technician', 'username email')
      .populate('service', 'name category')
      .sort({ createdAt: -1 });

    // Create CSV content
    let csvContent = 'Date,Customer,Technician,Service,Rating,Comment,Status,Helpful Count,Reported Count\n';
    
    feedbacks.forEach(feedback => {
      const date = new Date(feedback.createdAt).toLocaleDateString();
      const customer = feedback.isAnonymous ? 'Anonymous' : feedback.houseOwner?.username || 'N/A';
      const technician = feedback.technician?.username || 'N/A';
      const service = feedback.service?.name || 'N/A';
      const comment = (feedback.comment || '').replace(/"/g, '""');
      
      csvContent += `"${date}","${customer}","${technician}","${service}","${feedback.rating}","${comment}","${feedback.status}","${feedback.helpfulCount}","${feedback.reportedCount}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=feedbacks.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Export feedbacks error:', error);
    res.status(500).json({ message: 'Server error while exporting feedbacks' });
  }
});

module.exports = router;













