import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaStar, 
  FaFilter, 
  FaSearch, 
  FaCheck, 
  FaTimes, 
  FaReply, 
  FaSpinner,
  FaDownload,
  FaCalendarAlt,
  FaComments,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes as FaClose
} from 'react-icons/fa';
import FeedbackDisplay from '../../components/FeedbackDisplay';

const FeedbackManagement = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedFeedbacks, setSelectedFeedbacks] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 0
  });
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editFormData, setEditFormData] = useState({
    rating: 0,
    comment: '',
    isPublic: true,
    status: 'pending'
  });

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/feedback');
      setFeedbacks(response.data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/feedback/stats');
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      await axios.put(`/api/feedback/${feedbackId}/status`, { status: newStatus });
      toast.success(`Feedback ${newStatus} successfully`);
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update feedback status');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedFeedbacks.length === 0) {
      toast.error('Please select feedbacks to perform bulk action');
      return;
    }

    try {
      const promises = selectedFeedbacks.map(feedbackId => {
        switch (action) {
          case 'approve':
            return axios.put(`/api/feedback/${feedbackId}/status`, { status: 'approved' });
          case 'reject':
            return axios.put(`/api/feedback/${feedbackId}/status`, { status: 'rejected' });
          case 'hide':
            return axios.put(`/api/feedback/${feedbackId}/status`, { status: 'hidden' });
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      toast.success(`${action} completed for ${selectedFeedbacks.length} feedback(s)`);
      setSelectedFeedbacks([]);
      setShowBulkActions(false);
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      await axios.post(`/api/feedback/${selectedFeedback._id}/reply`, {
        content: replyContent
      });
      toast.success('Reply sent successfully');
      setShowReplyModal(false);
      setSelectedFeedback(null);
      setReplyContent('');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback);
    setEditFormData({
      rating: feedback.rating,
      comment: feedback.comment || '',
      isPublic: feedback.isPublic,
      status: feedback.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(`/api/feedback/${editingFeedback._id}`, editFormData);
      toast.success('Feedback updated successfully');
      setShowEditModal(false);
      setEditingFeedback(null);
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback');
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/feedback/${feedbackId}`);
      toast.success('Feedback deleted successfully');
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/feedback/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `feedbacks-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Feedbacks exported successfully');
    } catch (error) {
      console.error('Error exporting feedbacks:', error);
      toast.error('Failed to export feedbacks');
    }
  };

  const getFilteredFeedbacks = () => {
    let filtered = [...feedbacks];

    if (searchTerm) {
      filtered = filtered.filter(feedback =>
        feedback.houseOwner?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.technician?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.status === statusFilter);
    }

    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(feedback => feedback.rating === rating);
    }

    return filtered;
  };

  const handleFeedbackSelect = (feedbackId) => {
    setSelectedFeedbacks(prev => 
      prev.includes(feedbackId) 
        ? prev.filter(id => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const handleSelectAll = () => {
    const filteredFeedbacks = getFilteredFeedbacks();
    if (selectedFeedbacks.length === filteredFeedbacks.length) {
      setSelectedFeedbacks([]);
    } else {
      setSelectedFeedbacks(filteredFeedbacks.map(f => f._id));
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const filteredFeedbacks = getFilteredFeedbacks();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600 mt-2">Manage customer feedback and reviews</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaComments className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600">Total Feedbacks</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
            <p className="text-gray-600">Pending</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.approved}</h3>
            <p className="text-gray-600">Approved</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTimes className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.rejected}</h3>
            <p className="text-gray-600">Rejected</p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</h3>
            <p className="text-gray-600">Avg Rating</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="card mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search feedbacks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full sm:w-64"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full sm:w-32"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="hidden">Hidden</option>
              </select>
              
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="input w-full sm:w-32"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className="btn-outline flex items-center space-x-2"
              >
                <FaDownload className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              {selectedFeedbacks.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaFilter className="w-4 h-4" />
                  <span>Bulk Actions ({selectedFeedbacks.length})</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  Actions for {selectedFeedbacks.length} selected feedback(s):
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleBulkAction('hide')}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedbacks List */}
        {loading ? (
          <div className="text-center py-12">
            <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading feedbacks...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-12">
            <FaComments className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedbacks found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Select All */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedFeedbacks.length === filteredFeedbacks.length && filteredFeedbacks.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Select all ({filteredFeedbacks.length} feedbacks)
              </span>
            </div>
            
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback._id} className="relative">
                <input
                  type="checkbox"
                  checked={selectedFeedbacks.includes(feedback._id)}
                  onChange={() => handleFeedbackSelect(feedback._id)}
                  className="absolute top-4 left-4 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="ml-8">
                  <FeedbackDisplay
                    feedback={feedback}
                    onHelpful={() => {}}
                    onReport={() => {}}
                    showActions={false}
                  />
                  
                  {/* Admin Actions */}
                  <div className="mt-4 flex items-center space-x-2 flex-wrap">
                    <button
                      onClick={() => handleStatusUpdate(feedback._id, 'approved')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center space-x-1"
                    >
                      <FaCheck className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(feedback._id, 'rejected')}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center space-x-1"
                    >
                      <FaTimes className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFeedback(feedback);
                        setShowReplyModal(true);
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center space-x-1"
                    >
                      <FaReply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={() => handleEditFeedback(feedback)}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 flex items-center space-x-1"
                    >
                      <FaEdit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFeedback(feedback._id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center space-x-1"
                    >
                      <FaTrash className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Modal */}
        {showReplyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reply to Feedback</h3>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="input w-full mb-4"
                rows="4"
                placeholder="Enter your reply..."
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedFeedback(null);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  className="btn-primary"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Feedback Modal */}
        {showEditModal && editingFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Feedback</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFeedback(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaClose className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, rating: star }))}
                        className={`text-2xl transition-colors duration-200 ${
                          star <= editFormData.rating 
                            ? 'text-yellow-400' 
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={editFormData.comment}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, comment: e.target.value }))}
                    className="input w-full"
                    rows="4"
                    placeholder="Enter feedback comment..."
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="input w-full"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                {/* Public/Private */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={editFormData.isPublic}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Make feedback public</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFeedback(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaSave className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;








