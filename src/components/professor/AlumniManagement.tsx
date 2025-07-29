import React, { useState, useEffect } from 'react';
import { Check, X, User, Mail, Clock } from 'lucide-react';
import { alumniAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { AlumniRequest } from '../../types';
import toast from 'react-hot-toast';

const AlumniManagement: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AlumniRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await alumniAPI.getPendingRequests(user!.id);
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch alumni requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await alumniAPI.approveRequest(requestId);
      toast.success('Alumni request approved successfully!');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await alumniAPI.rejectRequest(requestId);
      toast.success('Alumni request rejected');
      fetchPendingRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alumni Management</h1>
        <p className="text-gray-600">Review and approve alumni registration requests</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alumni requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-600">All alumni requests have been processed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{request.alumniUsername}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {request.alumniEmail}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Pending
                </span>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  <strong>Request:</strong> Wants to join as Alumni
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Requested on {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleApprove(request.id)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlumniManagement;