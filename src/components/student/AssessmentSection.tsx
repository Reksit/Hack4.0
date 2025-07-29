import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Play, Brain } from 'lucide-react';
import { assessmentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Assessment } from '../../types';
import toast from 'react-hot-toast';
import AssessmentTaking from './AssessmentTaking';

const AssessmentSection: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'past' | 'future'>('current');
  const [takingAssessment, setTakingAssessment] = useState<Assessment | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (user) {
      fetchAssessments();
      fetchAssessmentResults();
    }
    
    // Update current time every 30 seconds for better accuracy
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    
    return () => clearInterval(timer);
  }, [user]);

  // Refresh assessments every 2 minutes to get latest data
  useEffect(() => {
    if (user) {
      const refreshTimer = setInterval(() => {
        fetchAssessments();
        fetchAssessmentResults();
      }, 120000); // 2 minutes
      
      return () => clearInterval(refreshTimer);
    }
  }, [user]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await assessmentAPI.getByStudent(user!.id);
      setAssessments(response.data);
    } catch (error) {
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentResults = async () => {
    try {
      const response = await assessmentAPI.getStudentResults(user!.id);
      const resultsMap: {[key: string]: any} = {};
      response.data.forEach((result: any) => {
        resultsMap[result.assessmentId] = result;
      });
      setAssessmentResults(resultsMap);
    } catch (error) {
      console.error('Failed to fetch assessment results');
    }
  };

  const checkAssessmentStatus = async (assessmentId: string) => {
    try {
      const response = await assessmentAPI.getStatus(assessmentId);
      return response.data.status;
    } catch (error) {
      console.error('Failed to check assessment status');
      return null;
    }
  };

  const categorizeAssessments = () => {
    const now = currentTime;
    return {
      current: assessments.filter(a => 
        new Date(a.startTime) <= now && new Date(a.endTime) >= now
      ),
      past: assessments.filter(a => new Date(a.endTime) < now),
      future: assessments.filter(a => new Date(a.startTime) > now),
    };
  };

  const { current, past, future } = categorizeAssessments();

  const getStatusColor = (assessment: Assessment) => {
    const now = currentTime;
    const start = new Date(assessment.startTime);
    const end = new Date(assessment.endTime);
    
    if (now < start) return 'text-blue-600 bg-blue-100';
    if (now >= start && now <= end) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusText = (assessment: Assessment) => {
    const now = currentTime;
    const start = new Date(assessment.startTime);
    const end = new Date(assessment.endTime);
    
    if (now < start) return 'Upcoming';
    if (now >= start && now <= end) return 'Ongoing';
    return 'Completed';
  };

  const isAssessmentAvailable = (assessment: Assessment) => {
    const now = currentTime;
    const start = new Date(assessment.startTime);
    const end = new Date(assessment.endTime);
    return now >= start && now <= end;
  };

  const hasSubmittedAssessment = (assessmentId: string) => {
    return assessmentResults[assessmentId] !== undefined;
  };

  const getTimeUntilStart = (assessment: Assessment) => {
    const now = currentTime;
    const start = new Date(assessment.startTime);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  const getTimeRemaining = (assessment: Assessment) => {
    const now = currentTime;
    const end = new Date(assessment.endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    if (minutes > 0) return `${minutes}m remaining`;
    return `${seconds}s remaining`;
  };
  const startAssessment = async (assessment: Assessment) => {
    if (hasSubmittedAssessment(assessment.id)) {
      toast.error('You have already submitted this assessment');
      return;
    }
    
    // Check if assessment is currently available
    const now = currentTime;
    const start = new Date(assessment.startTime);
    const end = new Date(assessment.endTime);
    
    if (now < start) {
      toast.error(`Assessment starts in ${getTimeUntilStart(assessment)}`);
      return;
    }
    
    if (now > end) {
      toast.error('Assessment time has ended');
      return;
    }
    
    if (now >= start && now <= end) {
      setTakingAssessment(assessment);
    } else {
      toast.error('Assessment is not currently available');
    }
  };

  const viewResults = (assessment: Assessment) => {
    const result = assessmentResults[assessment.id];
    if (result) {
      const percentage = ((result.score / assessment.questions.length) * 100).toFixed(1);
      toast.success(`Your score: ${result.score}/${assessment.questions.length} (${percentage}%)`);
    }
  };

  if (takingAssessment) {
    return (
      <AssessmentTaking 
        assessment={takingAssessment} 
        onComplete={() => {
          setTakingAssessment(null);
          fetchAssessments();
          fetchAssessmentResults();
        }}
        onExit={() => setTakingAssessment(null)}
      />
    );
  }

  const renderAssessmentCard = (assessment: Assessment) => (
    <div key={assessment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{assessment.title}</h3>
          <p className="text-gray-600 mb-3">{assessment.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment)}`}>
          {getStatusText(assessment)}
        </span>
      </div>
      
      <div className="flex items-center text-gray-600 text-sm space-x-4 mb-4">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(assessment.startTime).toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          {new Date(assessment.startTime).toLocaleTimeString()} - {new Date(assessment.endTime).toLocaleTimeString()}
        </div>
      </div>
      
      {/* Time Information */}
      <div className="mb-4">
        {getStatusText(assessment) === 'Upcoming' && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span>Starts in: <strong>{getTimeUntilStart(assessment)}</strong></span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs text-blue-500 mt-1">
              {new Date(assessment.startTime).toLocaleString()}
            </div>
          </div>
        )}
        {getStatusText(assessment) === 'Ongoing' && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <span><strong>{getTimeRemaining(assessment)}</strong></span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs">LIVE</span>
              </div>
            </div>
            <div className="text-xs text-green-500 mt-1">
              Ends at {new Date(assessment.endTime).toLocaleString()}
            </div>
          </div>
        )}
        {hasSubmittedAssessment(assessment.id) && (
          <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <span>✓ Submitted</span>
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="text-xs text-purple-500 mt-1">
              Score: {assessmentResults[assessment.id].score}/{assessment.questions.length} 
              ({Math.round((assessmentResults[assessment.id].score / assessment.questions.length) * 100)}%)
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {assessment.questions.length} questions
        </span>
        
        {getStatusText(assessment) === 'Ongoing' && !hasSubmittedAssessment(assessment.id) && (
          <button 
            onClick={() => startAssessment(assessment)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Now
          </button>
        )}
        
        {getStatusText(assessment) === 'Ongoing' && hasSubmittedAssessment(assessment.id) && (
          <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </div>
        )}
        
        {getStatusText(assessment) === 'Upcoming' && (
          <div className="text-blue-600 text-sm font-medium bg-blue-50 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4 inline mr-1" />
            {getTimeUntilStart(assessment)}
          </div>
        )}
        
        {getStatusText(assessment) === 'Completed' && (
          <button 
            onClick={() => viewResults(assessment)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            View Results
          </button>
        )}
        
        {getStatusText(assessment) === 'Completed' && !hasSubmittedAssessment(assessment.id) && (
          <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 px-3 py-2 rounded-lg">
            <XCircle className="w-4 h-4 mr-1" />
            Missed
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    let data: Assessment[] = [];
    switch (activeTab) {
      case 'current':
        data = current;
        break;
      case 'past':
        data = past;
        break;
      case 'future':
        data = future;
        break;
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
          <p className="text-gray-600">
            {activeTab === 'current' && 'No ongoing assessments at the moment.'}
            {activeTab === 'past' && 'No completed assessments yet.'}
            {activeTab === 'future' && 'No upcoming assessments scheduled.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map(renderAssessmentCard)}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Brain className="w-8 h-8 mr-3 text-blue-600" />
          Smart Assessments
        </h1>
        <p className="text-gray-600">AI-powered assessments with real-time session management</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'current', label: 'Current', count: current.length },
              { id: 'future', label: 'Upcoming', count: future.length },
              { id: 'past', label: 'Completed', count: past.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessments...</p>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default AssessmentSection;