import React, { useState, useEffect } from 'react';
import { User, BarChart3, Calendar, Trophy, TrendingUp, Eye } from 'lucide-react';
import { assessmentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Assessment } from '../../types';
import toast from 'react-hot-toast';

interface StudentResult {
  studentId: string;
  studentName: string;
  studentEmail: string;
  assessmentTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  assessmentId: string;
}

interface StudentProfile {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  bestScore: number;
  recentResults: StudentResult[];
}

const StudentResultsSection: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    if (user) {
      fetchAssessmentsAndResults();
    }
  }, [user]);

  const fetchAssessmentsAndResults = async () => {
    setLoading(true);
    try {
      // Fetch all assessments created by this professor
      const assessmentsResponse = await assessmentAPI.getByProfessor(user!.id);
      const professorAssessments = assessmentsResponse.data;
      setAssessments(professorAssessments);

      // Fetch results for all assessments
      const allResults: StudentResult[] = [];
      
      for (const assessment of professorAssessments) {
        try {
          const resultsResponse = await assessmentAPI.getResultsWithStudents(assessment.id);
          const assessmentResults = resultsResponse.data.map((result: any) => ({
            studentId: result.studentId,
            studentName: result.studentName || 'Unknown Student',
            studentEmail: result.studentEmail || 'No Email',
            assessmentTitle: assessment.title,
            score: result.score,
            totalQuestions: assessment.questions.length,
            percentage: Math.round((result.score / assessment.questions.length) * 100),
            completedAt: result.completedAt,
            assessmentId: assessment.id,
          }));
          allResults.push(...assessmentResults);
        } catch (error) {
          console.error(`Failed to fetch results for assessment ${assessment.id}`);
        }
      }

      // Group results by student to create profiles
      const studentMap = new Map<string, StudentResult[]>();
      allResults.forEach(result => {
        if (!studentMap.has(result.studentId)) {
          studentMap.set(result.studentId, []);
        }
        studentMap.get(result.studentId)!.push(result);
      });

      // Create student profiles
      const profiles: StudentProfile[] = Array.from(studentMap.entries()).map(([studentId, results]) => {
        const firstResult = results[0];
        const scores = results.map(r => r.percentage);
        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const bestScore = Math.max(...scores);
        
        // Get all assessments assigned to this student
        const studentAssignedAssessments = professorAssessments.filter(assessment => 
          assessment.assignedStudents.includes(firstResult.studentEmail)
        );

        return {
          studentId,
          studentName: firstResult.studentName,
          studentEmail: firstResult.studentEmail,
          totalAssessments: studentAssignedAssessments.length,
          completedAssessments: results.length,
          averageScore: Math.round(averageScore),
          bestScore: Math.round(bestScore),
          recentResults: results.sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          ).slice(0, 5),
        };
      });

      setStudentProfiles(profiles.sort((a, b) => b.averageScore - a.averageScore));
    } catch (error) {
      toast.error('Failed to fetch student results');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (selectedStudent) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => setSelectedStudent(null)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedStudent.studentName}</h1>
              <p className="text-gray-600">{selectedStudent.studentEmail}</p>
            </div>
          </div>
        </div>

        {/* Student Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedStudent.completedAssessments}/{selectedStudent.totalAssessments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStudent.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Best Score</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStudent.bestScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Grade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getGradeLetter(selectedStudent.averageScore)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Assessment Results</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedStudent.recentResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.assessmentTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.score}/{result.totalQuestions}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{result.percentage}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.percentage)}`}>
                        {getGradeLetter(result.percentage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(result.completedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Results & Profiles</h1>
        <p className="text-gray-600">View comprehensive student performance across all assessments</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student results...</p>
        </div>
      ) : studentProfiles.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No student results yet</h3>
          <p className="text-gray-600">Student results will appear here once they complete assessments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {studentProfiles.map((profile) => (
            <div key={profile.studentId} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{profile.studentName}</h3>
                    <p className="text-sm text-gray-600">{profile.studentEmail}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(profile.averageScore)}`}>
                  {getGradeLetter(profile.averageScore)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{profile.averageScore}%</p>
                  <p className="text-xs text-gray-600">Average Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{profile.completedAssessments}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{profile.completedAssessments}/{profile.totalAssessments}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(profile.completedAssessments / profile.totalAssessments) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Best: {profile.bestScore}%</span>
                </div>
                <button
                  onClick={() => setSelectedStudent(profile)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentResultsSection;