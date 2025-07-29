import React, { useState, useEffect } from 'react';
import { X, User, Clock, CheckCircle, XCircle, BarChart3, Download } from 'lucide-react';
import { assessmentAPI } from '../../services/api';
import { Assessment } from '../../types';
import toast from 'react-hot-toast';

interface AssessmentResult {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName?: string;
  answers: number[];
  score: number;
  completedAt: string;
}

interface AssessmentResultsModalProps {
  assessment: Assessment;
  onClose: () => void;
}

const AssessmentResultsModal: React.FC<AssessmentResultsModalProps> = ({ assessment, onClose }) => {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    fetchResults();
  }, [assessment.id]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await assessmentAPI.getResultsWithStudents(assessment.id);
      setResults(response.data);
    } catch (error) {
      toast.error('Failed to fetch assessment results');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (results.length === 0) return null;

    const scores = results.map(r => r.score);
    const totalQuestions = assessment.questions.length;
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const averagePercentage = (averageScore / totalQuestions) * 100;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const submissionRate = (results.length / assessment.assignedStudents.length) * 100;

    return {
      totalStudents: assessment.assignedStudents.length,
      submitted: results.length,
      submissionRate,
      averageScore,
      averagePercentage,
      highestScore,
      lowestScore,
      totalQuestions
    };
  };

  const getGradeDistribution = () => {
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const totalQuestions = assessment.questions.length;

    results.forEach(result => {
      const percentage = (result.score / totalQuestions) * 100;
      if (percentage >= 90) distribution.A++;
      else if (percentage >= 80) distribution.B++;
      else if (percentage >= 70) distribution.C++;
      else if (percentage >= 60) distribution.D++;
      else distribution.F++;
    });

    return distribution;
  };

  const stats = calculateStats();
  const gradeDistribution = getGradeDistribution();

  const exportResults = () => {
    const csvContent = [
      ['Student ID', 'Score', 'Percentage', 'Completed At'],
      ...results.map(result => [
        result.studentId,
        result.score,
        `${((result.score / assessment.questions.length) * 100).toFixed(1)}%`,
        new Date(result.completedAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.title}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{assessment.title} - Results</h2>
            <p className="text-gray-600 mt-1">Assessment results and analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportResults}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'detailed', label: 'Detailed Results' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading results...</p>
            </div>
          ) : selectedTab === 'overview' ? (
            <div className="space-y-6">
              {/* Statistics Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <User className="w-8 h-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Submission Rate</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {stats.submissionRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-blue-700">
                          {stats.submitted}/{stats.totalStudents} students
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm text-green-600 font-medium">Average Score</p>
                        <p className="text-2xl font-bold text-green-900">
                          {stats.averagePercentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-green-700">
                          {stats.averageScore.toFixed(1)}/{stats.totalQuestions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-8 h-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Highest Score</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {((stats.highestScore / stats.totalQuestions) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-purple-700">
                          {stats.highestScore}/{stats.totalQuestions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <XCircle className="w-8 h-8 text-orange-600 mr-3" />
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Lowest Score</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {((stats.lowestScore / stats.totalQuestions) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-orange-700">
                          {stats.lowestScore}/{stats.totalQuestions}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grade Distribution */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="text-center">
                      <div className={`w-full h-20 rounded-lg flex items-end justify-center text-white font-bold text-lg ${
                        grade === 'A' ? 'bg-green-500' :
                        grade === 'B' ? 'bg-blue-500' :
                        grade === 'C' ? 'bg-yellow-500' :
                        grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                      }`} style={{ height: `${Math.max(20, (count / results.length) * 100)}px` }}>
                        {count}
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-700">Grade {grade}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
                <div className="space-y-3">
                  {results.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{result.studentId}</p>
                          <p className="text-sm text-gray-600">
                            Submitted {new Date(result.completedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {result.score}/{assessment.questions.length}
                        </p>
                        <p className="text-sm text-gray-600">
                          {((result.score / assessment.questions.length) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Detailed Results */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">All Submissions</h3>
                <p className="text-sm text-gray-600">{results.length} submissions</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Taken
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => {
                      const percentage = (result.score / assessment.questions.length) * 100;
                      const submittedAt = new Date(result.completedAt);
                      const startTime = new Date(assessment.startTime);
                      const timeTakenMs = submittedAt.getTime() - startTime.getTime();
                      const timeTaken = timeTakenMs > 0 ? Math.round(timeTakenMs / (1000 * 60)) : 0;

                      return (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {result.studentName || result.studentId}
                                </div>
                                <div className="text-sm text-gray-500">{result.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {result.score}/{assessment.questions.length}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              percentage >= 90 ? 'bg-green-100 text-green-800' :
                              percentage >= 80 ? 'bg-blue-100 text-blue-800' :
                              percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              percentage >= 60 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submittedAt.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {timeTaken > 0 ? `${timeTaken} min` : '< 1 min'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {results.length === 0 && (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                  <p className="text-gray-600">Students haven't submitted this assessment yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentResultsModal;