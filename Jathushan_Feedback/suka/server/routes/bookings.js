const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Service = require('../models/Service');
const Notification = require('../models/Notification'); // Added Notification model
const Feedback = require('../models/Feedback'); // Added Feedback model

// Helper function to send booking cancellation notification
const sendBookingCancellationNotification = async (booking) => {
  try {
    // Populate booking details for notification
    await booking.populate([
      { path: 'houseOwner', select: 'username email mobile' },
      { path: 'service', select: 'name category basePrice' },
      { path: 'technician', select: 'username email mobile' }
    ]);

    // Create notification message
    let message = `A booking has been cancelled!\n\n`;
    message += `Service: ${booking.service.name}\n`;
    message += `Customer: ${booking.houseOwner.username}\n`;
    message += `Date: ${booking.scheduledDate.toLocaleDateString()}\n`;
    message += `Time: ${booking.scheduledTime}\n`;
    message += `Address: ${booking.address}\n`;
    
    if (booking.description) {
      message += `Description: ${booking.description}\n`;
    }
    
    message += `\nCancelled at: ${new Date().toLocaleString()}\n`;

    // Create notification
    const notification = await Notification.createNotification({
      recipient: booking.technician._id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: message,
      relatedEntity: 'booking',
      entityId: booking._id,
      priority: 'medium',
      actionRequired: false
    });

    console.log(`Cancellation notification sent to technician ${booking.technician.username}: ${notification._id}`);
    
    return notification;
  } catch (error) {
    console.error('Error creating cancellation notification:', error);
    throw error;
  }
};

// Helper function to create automatic feedback when booking is completed
const createAutoFeedback = async (booking, completionNotes = '') => {
  try {
    // Check if feedback already exists for this booking
    const existingFeedback = await Feedback.findOne({ booking: booking._id });
    if (existingFeedback) {
      console.log('Feedback already exists for booking:', booking._id);
      return existingFeedback;
    }

    // Create automatic feedback with default values
    const autoFeedback = new Feedback({
      houseOwner: booking.houseOwner,
      technician: booking.technician,
      service: booking.service,
      booking: booking._id,
      rating: 5, // Default 5-star rating for completed service
      comment: completionNotes || 'Service completed successfully. Thank you for choosing our service!',
      categories: [
        { category: 'quality', rating: 5 },
        { category: 'punctuality', rating: 5 },
        { category: 'communication', rating: 5 },
        { category: 'cleanliness', rating: 5 },
        { category: 'professionalism', rating: 5 },
        { category: 'value_for_money', rating: 5 }
      ],
      isAnonymous: false,
      isPublic: true,
      status: 'approved' // Auto-approve completed service feedback
    });

    await autoFeedback.save();

    // Populate feedback details
    await autoFeedback.populate([
      { path: 'houseOwner', select: 'username email' },
      { path: 'technician', select: 'username email' },
      { path: 'service', select: 'name category' },
      { path: 'booking', select: 'scheduledDate estimatedCost' }
    ]);

    console.log('Auto feedback created for booking:', booking._id);
    return autoFeedback;

  } catch (error) {
    console.error('Error creating auto feedback:', error);
    throw error;
  }
};

// Helper function to send technician assignment notification
const sendTechnicianAssignmentNotification = async (booking, technician) => {
  try {
    // Populate booking details for notification
    await booking.populate([
      { path: 'houseOwner', select: 'username email mobile' },
      { path: 'service', select: 'name category basePrice' }
    ]);

    // Create notification message
    let message = `You have been assigned to a new booking!\n\n`;
    message += `Service: ${booking.service.name}\n`;
    message += `Customer: ${booking.houseOwner.username}\n`;
    message += `Date: ${booking.scheduledDate.toLocaleDateString()}\n`;
    message += `Time: ${booking.scheduledTime}\n`;
    message += `Address: ${booking.address}\n`;
    
    if (booking.description) {
      message += `Description: ${booking.description}\n`;
    }
    
    if (booking.selectedInventory && booking.selectedInventory.length > 0) {
      message += `\nRequired Materials:\n`;
      booking.selectedInventory.forEach(item => {
        message += `• ${item.name} (${item.quantity} ${item.unit || 'pieces'}) - LKR ${item.totalPrice}\n`;
      });
      message += `\nTotal Materials Cost: LKR ${booking.selectedInventory.reduce((sum, item) => sum + item.totalPrice, 0)}\n`;
    }
    
    message += `\nService Cost: LKR ${booking.service.basePrice}\n`;
    message += `Total Cost: LKR ${booking.estimatedCost}\n`;
    message += `Payment Method: ${booking.paymentMethod.replace('_', ' ').toUpperCase()}\n`;
    
    if (booking.urgency !== 'normal') {
      message += `\nUrgency: ${booking.urgency.toUpperCase()}\n`;
    }

    // Create notification
    const notification = await Notification.createNotification({
      recipient: technician._id,
      type: 'booking_assigned',
      title: 'New Booking Assignment',
      message: message,
      relatedEntity: 'booking',
      entityId: booking._id,
      priority: booking.urgency === 'high' ? 'high' : 'medium',
      actionRequired: true,
      actionUrl: `/technician/bookings/${booking._id}`
    });

    console.log(`Notification sent to technician ${technician.username}: ${notification._id}`);
    
    // Note: Real-time notification via Socket.IO will be handled in the route handler
    // where req.app.get('io') is available

    return notification;
  } catch (error) {
    console.error('Error creating technician notification:', error);
    throw error;
  }
};

// Helper function to find available technician
const findAvailableTechnician = async (scheduledDate, scheduledTime) => {
  try {
    console.log('Finding available technician for:', { scheduledDate, scheduledTime });
    
    // Find technicians who are not assigned to any booking at the specified time
    const conflictingBookings = await Booking.find({
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime,
      status: { $in: ['accepted', 'in_progress'] }
    }).select('technician');

    console.log('Conflicting bookings found:', conflictingBookings.length);

    const assignedTechnicianIds = conflictingBookings
      .map(booking => booking.technician)
      .filter(id => id);

    console.log('Assigned technician IDs:', assignedTechnicianIds);

    // Get all active technicians who are not assigned
    const availableTechnician = await User.findOne({
      role: 'technician',
      isActive: true,
      _id: { $nin: assignedTechnicianIds }
    }).select('username email mobile specialties rating');

    console.log('Available technician found:', availableTechnician ? availableTechnician.username : 'None');

    return availableTechnician;
  } catch (error) {
    console.error('Error finding available technician:', error);
    console.error('Error details:', error.message);
    return null;
  }
};

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      serviceId,
      scheduledDate,
      scheduledTime,
      address,
      description,
      urgency,
      paymentMethod,
      selectedInventory
    } = req.body;

    // Validate required fields
    if (!serviceId || !scheduledDate || !scheduledTime || !address || !paymentMethod) {
      return res.status(400).json({
        message: 'Service, date, time, address, and payment method are required'
      });
    }

    // Check if service exists and is active
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if service is active - house owners cannot book inactive services
    if (!service.isActive) {
      return res.status(400).json({ message: 'This service is currently unavailable' });
    }

    // Calculate total cost including materials
    let materialsCost = 0;
    if (selectedInventory && selectedInventory.length > 0) {
      materialsCost = selectedInventory.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    }
    const totalCost = service.basePrice + materialsCost;

    // Create booking
    const booking = new Booking({
      houseOwner: req.user.id,
      service: serviceId,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      address,
      description: description || '',
      urgency: urgency || 'normal',
      paymentMethod,
      status: 'pending',
      estimatedCost: totalCost,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      selectedInventory: selectedInventory || []
    });

    await booking.save();

    // Populate service details
    await booking.populate('service', 'name category basePrice');

    // Create notification for admin
    try {
      // Find admin users
      const adminUsers = await User.find({ role: 'admin' });
      
      for (const admin of adminUsers) {
        const notification = new Notification({
          recipient: admin._id,
          type: 'booking_created',
          title: 'New Service Booking',
          message: `${req.user.username} has booked ${service.name} for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}. Urgency: ${urgency}`,
          relatedEntity: 'booking',
          entityId: booking._id,
          priority: urgency === 'high' ? 'high' : urgency === 'medium' ? 'medium' : 'low',
          actionRequired: true,
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
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error during booking creation' });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings for the authenticated user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Filter by user role
    if (req.user.role === 'house_owner') {
      query.houseOwner = req.user.id;
    } else if (req.user.role === 'technician') {
      query.technician = req.user.id;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const bookings = await Booking.find(query)
      .populate('service', 'name category basePrice')
      .populate('houseOwner', 'username email mobile')
      .populate('technician', 'username email mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get a specific booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name category basePrice description')
      .populate('houseOwner', 'username email mobile address')
      .populate('technician', 'username email mobile specialties rating');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (req.user.role === 'house_owner' && booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'technician' && booking.technician && booking.technician.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error while fetching booking' });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update a booking
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can update this booking
    if (req.user.role === 'house_owner' && booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates if booking is not completed or cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Cannot update completed or cancelled bookings' 
      });
    }

    const {
      scheduledDate,
      scheduledTime,
      address,
      description,
      urgency
    } = req.body;

    // Update fields
    if (scheduledDate) booking.scheduledDate = new Date(scheduledDate);
    if (scheduledTime) booking.scheduledTime = scheduledTime;
    if (address) booking.address = address;
    if (description !== undefined) booking.description = description;
    if (urgency) booking.urgency = urgency;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });

  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error while updating booking' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, technicianNotes, completionNotes, rating, feedback } = req.body;
    
    console.log('Status update request:', {
      bookingId: req.params.id,
      newStatus: status,
      userRole: req.user.role,
      userId: req.user.id
    });
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    console.log('Current booking status:', booking.status);

    // Validate status transition
    const validTransitions = {
      pending: ['accepted', 'rejected', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      rejected: [],
      cancelled: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${booking.status} to ${status}` 
      });
    }

    // Update status and related fields
    booking.status = status;
    
    if (status === 'accepted') {
      // Only admin can accept bookings
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'Only admin can accept bookings' 
        });
      }
      
      try {
        // Auto-assign an available technician
        const availableTechnician = await findAvailableTechnician(booking.scheduledDate, booking.scheduledTime);
        
        if (availableTechnician) {
          booking.technician = availableTechnician._id;
          console.log(`Auto-assigned technician: ${availableTechnician.username} to booking ${booking._id}`);
          
          // Send notification to technician
          try {
            await sendTechnicianAssignmentNotification(booking, availableTechnician);
            
            // Send real-time notification via Socket.IO
            const io = req.app.get('io');
            if (io) {
              io.to(availableTechnician._id.toString()).emit('notification', {
                type: 'booking_assigned',
                title: 'New Booking Assignment',
                message: `You have been assigned to ${booking.service?.name || 'a service'} on ${booking.scheduledDate.toLocaleDateString()}`,
                bookingId: booking._id,
                priority: booking.urgency === 'high' ? 'high' : 'medium'
              });
            }
          } catch (notificationError) {
            console.error('Failed to send technician notification:', notificationError);
            // Don't fail the booking acceptance if notification fails
          }
        } else {
          console.log(`No available technician found for booking ${booking._id}`);
          // Still accept the booking but without technician assignment
          // Admin can manually assign later
        }
      } catch (error) {
        console.error('Error in technician assignment:', error);
        // Continue with booking acceptance even if technician assignment fails
      }
      
      booking.acceptedAt = new Date();
    }
    
    if (status === 'in_progress') {
      booking.startedAt = new Date();
    }
    
    if (status === 'completed') {
      booking.completedAt = new Date();
      if (completionNotes) booking.completionNotes = completionNotes;
      if (rating) booking.rating = rating;
      if (feedback) booking.feedback = feedback;
      
      // Automatically create feedback for completed booking
      try {
        await createAutoFeedback(booking, completionNotes);
      } catch (error) {
        console.error('Error creating auto feedback:', error);
        // Don't fail the booking completion if feedback creation fails
      }
    }
    
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user.id;
      
      // Send notification to technician if they were assigned
      if (booking.technician) {
        try {
          await sendBookingCancellationNotification(booking);
          
          // Send real-time notification via Socket.IO
          const io = req.app.get('io');
          if (io) {
            io.to(booking.technician.toString()).emit('notification', {
              type: 'booking_cancelled',
              title: 'Booking Cancelled',
              message: `A booking has been cancelled for ${booking.service?.name || 'a service'}`,
              bookingId: booking._id,
              priority: 'medium'
            });
          }
        } catch (notificationError) {
          console.error('Failed to send cancellation notification:', notificationError);
          // Don't fail the cancellation if notification fails
        }
      }
    }
    
    if (technicianNotes) booking.technicianNotes = technicianNotes;

    await booking.save();

    // Populate technician details if assigned
    if (booking.technician) {
      await booking.populate('technician', 'username email mobile');
    }

    console.log('Booking status updated successfully:', booking.status);

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });

  } catch (error) {
    console.error('Update status error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Server error while updating status',
      error: error.message 
    });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel a booking
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can cancel this booking
    if (req.user.role === 'house_owner' && booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation if booking is pending or accepted
    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking in current status' 
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
});

// @route   GET /api/bookings/available
// @desc    Get available bookings for technicians
// @access  Private (Technicians only)
router.get('/available', protect, async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const { category, page = 1, limit = 10 } = req.query;
    
    let query = { status: 'pending' };
    
    if (category) {
      query['service.category'] = category;
    }

    const skip = (page - 1) * limit;
    
    const bookings = await Booking.find(query)
      .populate('service', 'name category basePrice description')
      .populate('houseOwner', 'username email mobile')
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookings: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get available bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching available bookings' });
  }
});

// @route   POST /api/bookings/:id/accept
// @desc    Accept a booking (for technicians)
// @access  Private (Technicians only)
router.post('/:id/accept', protect, async (req, res) => {
  try {
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Access denied. Technicians only.' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not available for acceptance' });
    }

    // Check if technician is already assigned to another booking at the same time
    const conflictingBooking = await Booking.findOne({
      technician: req.user.id,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      status: { $in: ['accepted', 'in_progress'] }
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        message: 'You have another booking at the same time' 
      });
    }

    booking.status = 'accepted';
    booking.technician = req.user.id;
    booking.acceptedAt = new Date();

    await booking.save();

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      booking
    });

  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({ message: 'Server error while accepting booking' });
  }
});

// @route   PUT /api/bookings/:id/assign-technician
// @desc    Assign technician to a booking (Admin only)
// @access  Private (Admin only)
router.put('/:id/assign-technician', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { technicianId } = req.body;
    
    if (!technicianId) {
      return res.status(400).json({ message: 'Technician ID is required' });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if technician exists and has technician role
    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(400).json({ message: 'Invalid technician' });
    }

    // Check if technician is already assigned to another booking at the same time
    const conflictingBooking = await Booking.findOne({
      technician: technicianId,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      status: { $in: ['accepted', 'in_progress'] },
      _id: { $ne: booking._id }
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        message: 'Technician is already assigned to another booking at the same time' 
      });
    }

    // Assign technician and update status
    booking.technician = technicianId;
    if (booking.status === 'pending') {
      booking.status = 'accepted';
      booking.acceptedAt = new Date();
    }

    await booking.save();

    // Create notification for assigned technician
    try {
      const notification = new Notification({
        recipient: technicianId,
        type: 'booking_assigned',
        title: 'New Service Assignment',
        message: `You have been assigned to ${booking.service.name} on ${booking.scheduledDate.toLocaleDateString()} at ${booking.scheduledTime}. Address: ${booking.address}`,
        relatedEntity: 'booking',
        entityId: booking._id,
        priority: booking.urgency === 'high' ? 'high' : booking.urgency === 'medium' ? 'medium' : 'low',
        actionRequired: true,
        isRead: false
      });
      
      await notification.save();

      // Emit real-time notification if socket.io is available
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(technicianId.toString()).emit('newNotification', {
          notification: await notification.populate('recipient', 'username email')
        });
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the assignment if notification fails
    }

    // Populate the updated booking
    await booking.populate('technician', 'username email mobile');

    res.json({
      success: true,
      message: 'Technician assigned successfully',
      booking
    });

  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({ message: 'Server error while assigning technician' });
  }
});

// @route   PUT /api/bookings/:id/payment-status
// @desc    Update payment status for a booking
// @access  Private
router.put('/:id/payment-status', protect, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to update this booking's payment status
    if (req.user.role === 'house_owner' && booking.houseOwner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate payment status
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        message: 'Invalid payment status' 
      });
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      booking
    });

  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error while updating payment status' });
  }
});

// @route   GET /api/bookings/technicians/available
// @desc    Get available technicians for a specific date and time
// @access  Private (Admin only)
router.get('/technicians/available', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { date, time } = req.query;
    
    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    // Find technicians who are not assigned to any booking at the specified time
    const conflictingBookings = await Booking.find({
      scheduledDate: new Date(date),
      scheduledTime: time,
      status: { $in: ['accepted', 'in_progress'] }
    }).select('technician');

    const assignedTechnicianIds = conflictingBookings
      .map(booking => booking.technician)
      .filter(id => id);

    // Get all active technicians who are not assigned
    const availableTechnicians = await User.find({
      role: 'technician',
      isActive: true,
      _id: { $nin: assignedTechnicianIds }
    }).select('username email mobile specialties rating');

    res.json({
      success: true,
      technicians: availableTechnicians
    });

  } catch (error) {
    console.error('Get available technicians error:', error);
    res.status(500).json({ message: 'Server error while fetching available technicians' });
  }
});

module.exports = router;
