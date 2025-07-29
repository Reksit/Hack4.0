import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Users, Edit, Trash2, Eye, BarChart3 } from 'lucide-react';
import { assessmentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Assessment } from '../../types';
import toast from 'react-hot-toast';
import CreateAssessmentModal from './CreateAssessmentModal';
import AssessmentResultsModal from './AssessmentResultsModal';

const AssessmentManagement: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssessments();
    }
  }, [user]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await assessmentAPI.getByProfessor(user!.id);
      setAssessments(response.data);
    } catch (error) {
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (assessment: Assessment) => {
    const now = new Date();
    const start = new Date(assessment.startTime);
    const end = new Date(assessment.endTime);
    
    if (now < start) return 'text-blue-600 bg-blue-100 border-blue-300';
    if (now >= start && now <= end) return 'text-green-600 bg-green-100 border-green-300 animate-pulse';
    return 'text-gray-600 bg-gray-100 border-gray-300';
  };

  const getStatusText = (assessment: Assessment) => {
    const now = new Date();
    const start = new Date(assessment.startTime);
    const end = new Date(assessment.endTime);
    
    if (now < start) return 'Scheduled';
    if (now >= start && now <= end) return 'Ongoing';
    return 'Completed';
  };

  const handleCreateAssessment = async (assessmentData: any) => {
    try {
      await assessmentAPI.create({ ...assessmentData, createdBy: user!.id });
      toast.success('Assessment created successfully!');
      setShowCreateModal(false);
      fetchAssessments();
    } catch (error) {
      toast.error('Failed to create assessment');
    }
  };

  const viewResults = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowResultsModal(true);
  };
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Management</h1>
          <p className="text-gray-600">Create, manage, and monitor student assessments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Assessment
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessments...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
          <p className="text-gray-600 mb-6">Create your first assessment to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Assessment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{assessment.title}</h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">{assessment.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(assessment)}`}>
                  {getStatusText(assessment)}
                </span>
              </div>
              
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {new Date(assessment.startTime).toLocaleDateString()} at {new Date(assessment.startTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    Duration: {Math.round((new Date(assessment.endTime).getTime() - new Date(assessment.startTime).getTime()) / (1000 * 60))} minutes
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{assessment.assignedStudents.length} students assigned</span>
                </div>
              </div>
              
              {/* Time Status */}
              {getStatusText(assessment) === 'Live' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-medium">Assessment is currently live</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Ends at {new Date(assessment.endTime).toLocaleString()}
                  </div>
                </div>
              )}
              
              {getStatusText(assessment) === 'Scheduled' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-700">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">
                      Starts {new Date(assessment.startTime) > new Date(Date.now() + 24 * 60 * 60 * 1000) 
                        ? `on ${new Date(assessment.startTime).toLocaleDateString()}`
                        : `in ${Math.ceil((new Date(assessment.startTime).getTime() - Date.now()) / (1000 * 60))} minutes`
                      }
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-gray-500">
                  {assessment.questions.length} questions
                </span>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => viewResults(assessment)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Results"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAssessmentModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAssessment}
        />
      )}

      {showResultsModal && selectedAssessment && (
        <AssessmentResultsModal
          assessment={selectedAssessment}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedAssessment(null);
          }}
        />
      )}
    </div>
  );
};

export default AssessmentManagement;