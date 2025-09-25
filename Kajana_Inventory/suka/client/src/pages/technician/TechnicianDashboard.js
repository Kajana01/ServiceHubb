import React, { useState, useEffect } from 'react';
import { FaTools, FaClipboardList, FaClock, FaStar, FaBox, FaCheckCircle, FaPlay, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaSpinner } from 'react-icons/fa';
import InventoryViewer from '../../components/InventoryViewer';
import axios from 'axios';
import toast from 'react-hot-toast';

const TechnicianDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus, completionNotes = '') => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, {
        status: newStatus,
        completionNotes
      });
      toast.success(`Booking ${newStatus.replace('_', ' ')} successfully`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Technician Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage your assigned tasks and service requests
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('bookings')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'bookings'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaClipboardList className="inline mr-2" />
            My Bookings
          </button>
          <button
            onClick={() => handleTabChange('inventory')}
            className={`px-6 py-3 mx-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'inventory'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaBox className="inline mr-2" />
            Materials
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="card text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTools className="text-4xl text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to Technician Panel
            </h2>
            <p className="text-gray-600 mb-6">
              Manage your assigned tasks and service requests efficiently
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaClipboardList className="text-2xl text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">View Tasks</h3>
                <p className="text-sm text-gray-600">See assigned service requests</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaTools className="text-2xl text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Perform Service</h3>
                <p className="text-sm text-gray-600">Execute assigned tasks</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaClock className="text-2xl text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Update Status</h3>
                <p className="text-sm text-gray-600">Track task progress</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaStar className="text-2xl text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">View Feedback</h3>
                <p className="text-sm text-gray-600">See customer reviews</p>
              </div>
            </div>

            <p className="text-gray-500">
              Use the tabs above to navigate to different sections
            </p>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">My Assigned Bookings</h3>
              <button
                onClick={fetchBookings}
                className="btn-outline flex items-center"
              >
                <FaSpinner className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <FaClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Assigned</h3>
                <p className="text-gray-600">You don't have any assigned bookings yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div key={booking._id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {booking.service?.name || 'Service'}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <FaUser className="w-4 h-4 mr-2" />
                            <span>Customer: {booking.houseOwner?.username || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaCalendarAlt className="w-4 h-4 mr-2" />
                            <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaClock className="w-4 h-4 mr-2" />
                            <span>{booking.scheduledTime}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                            <span>{booking.address}</span>
                          </div>
                        </div>

                        {booking.description && (
                          <p className="text-sm text-gray-700 mb-4">
                            <strong>Description:</strong> {booking.description}
                          </p>
                        )}

                        {booking.completionNotes && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                            <p className="text-sm text-green-800">
                              <strong>Completion Notes:</strong> {booking.completionNotes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col space-y-2">
                        {booking.status === 'accepted' && (
                          <button
                            onClick={() => updateBookingStatus(booking._id, 'in_progress')}
                            className="flex items-center px-3 py-2 text-sm rounded-md text-blue-600 hover:bg-blue-50"
                          >
                            <FaPlay className="w-4 h-4 mr-1" />
                            Start Work
                          </button>
                        )}
                        
                        {booking.status === 'in_progress' && (
                          <button
                            onClick={() => {
                              const notes = prompt('Add completion notes (optional):');
                              updateBookingStatus(booking._id, 'completed', notes || '');
                            }}
                            className="flex items-center px-3 py-2 text-sm rounded-md text-green-600 hover:bg-green-50"
                          >
                            <FaCheckCircle className="w-4 h-4 mr-1" />
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryViewer userRole="technician" />
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard;
