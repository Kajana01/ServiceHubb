import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaBell,
  FaGift,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCalendarAlt,
  FaSpinner,
  FaSave,
  FaTimes as FaClose
} from 'react-icons/fa';

const AnnouncementManagement = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    targetAudience: 'all',
    priority: 'normal',
    isActive: true,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    offerDetails: {
      discount: '',
      discountType: 'percentage',
      minOrderValue: ''
    }
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnnouncements();
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/announcements/admin');
      setAnnouncements(response.data.announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('offerDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        offerDetails: {
          ...prev.offerDetails,
          [field]: type === 'number' ? parseFloat(value) || '' : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        offerDetails: formData.type === 'offer' ? formData.offerDetails : undefined
      };

      if (editingAnnouncement) {
        await axios.put(`/api/announcements/${editingAnnouncement._id}`, submitData);
        toast.success('Announcement updated successfully');
      } else {
        await axios.post('/api/announcements', submitData);
        toast.success('Announcement created successfully');
      }

      setShowForm(false);
      setEditingAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(error.response?.data?.message || 'Failed to save announcement');
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      isActive: announcement.isActive,
      startDate: new Date(announcement.startDate).toISOString().slice(0, 16),
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : '',
      offerDetails: announcement.offerDetails || {
        discount: '',
        discountType: 'percentage',
        minOrderValue: ''
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await axios.delete(`/api/announcements/${id}`);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      targetAudience: 'all',
      priority: 'normal',
      isActive: true,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: '',
      offerDetails: {
        discount: '',
        discountType: 'percentage',
        minOrderValue: ''
      }
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'offer': return <FaGift className="text-green-500" />;
      case 'urgent': return <FaExclamationTriangle className="text-red-500" />;
      case 'feedback': return <FaBell className="text-blue-500" />;
      case 'festival': return <FaCalendarAlt className="text-purple-500" />;
      default: return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetAudienceColor = (audience) => {
    switch (audience) {
      case 'all': return 'bg-purple-100 text-purple-800';
      case 'customers': return 'bg-green-100 text-green-800';
      case 'technicians': return 'bg-blue-100 text-blue-800';
      case 'admins': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Announcement Management</h1>
              <p className="mt-2 text-gray-600">Create and manage announcements for customers and technicians</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingAnnouncement(null);
                resetForm();
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <FaPlus />
              <span>Create Announcement</span>
            </button>
          </div>
        </div>

        {/* Announcement Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingAnnouncement(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaClose className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                        maxLength={200}
                      />
                    </div>

                    <div>
                      <label className="form-label">Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="general">General</option>
                        <option value="offer">Offer</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="feedback">Feedback</option>
                        <option value="festival">Festival</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Target Audience</label>
                      <select
                        name="targetAudience"
                        value={formData.targetAudience}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="all">All Users</option>
                        <option value="customers">Customers Only</option>
                        <option value="technicians">Technicians Only</option>
                        <option value="admins">Admins Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Priority</label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Start Date</label>
                      <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="form-label">End Date (Optional)</label>
                      <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Content *</label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      className="form-input"
                      rows={4}
                      required
                      maxLength={2000}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.content.length}/2000 characters
                    </p>
                  </div>

                  {/* Offer Details */}
                  {formData.type === 'offer' && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Offer Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="form-label">Discount</label>
                          <input
                            type="number"
                            name="offerDetails.discount"
                            value={formData.offerDetails.discount}
                            onChange={handleInputChange}
                            className="form-input"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="form-label">Discount Type</label>
                          <select
                            name="offerDetails.discountType"
                            value={formData.offerDetails.discountType}
                            onChange={handleInputChange}
                            className="form-input"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Min Order Value</label>
                          <input
                            type="number"
                            name="offerDetails.minOrderValue"
                            value={formData.offerDetails.minOrderValue}
                            onChange={handleInputChange}
                            className="form-input"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label className="ml-2 text-sm text-gray-700">Active</label>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingAnnouncement(null);
                        resetForm();
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex items-center space-x-2"
                    >
                      <FaSave />
                      <span>{editingAnnouncement ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Announcements List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-2xl text-gray-400" />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">All Announcements</h2>
            </div>
            
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <FaBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
                <p className="text-gray-600 mb-4">Create your first announcement to get started.</p>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingAnnouncement(null);
                    resetForm();
                  }}
                  className="btn-primary"
                >
                  Create Announcement
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getTypeIcon(announcement.type)}
                          <h3 className="text-lg font-medium text-gray-900">
                            {announcement.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTargetAudienceColor(announcement.targetAudience)}`}>
                            {announcement.targetAudience}
                          </span>
                          {announcement.isActive ? (
                            <FaEye className="text-green-500" title="Active" />
                          ) : (
                            <FaEyeSlash className="text-gray-400" title="Inactive" />
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {announcement.content}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                          <span>By: {announcement.createdBy?.username || 'System'}</span>
                          {announcement.endDate && (
                            <span>Expires: {new Date(announcement.endDate).toLocaleDateString()}</span>
                          )}
                          {announcement.readBy && (
                            <span>Read by: {announcement.readBy.length} users</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="btn-secondary btn-icon"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement._id)}
                          className="btn-danger btn-icon"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManagement;
