import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, BookOpen, Calendar, Brain, Users, Target, LogOut } from 'lucide-react';
import ChatSection from '../common/ChatSection';
import AssessmentSection from './AssessmentSection';
import AIRoadmapSection from './AIRoadmapSection';
import AIPracticeSection from './AIPracticeSection';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'assessments', label: 'Assessments', icon: Calendar },
    { id: 'ai-roadmap', label: 'AI Roadmap', icon: Target },
    { id: 'ai-practice', label: 'AI Practice', icon: Brain },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'chat':
        return <ChatSection />;
      case 'assessments':
        return <AssessmentSection />;
      case 'ai-roadmap':
        return <AIRoadmapSection />;
      case 'ai-practice':
        return <AIPracticeSection />;
      default:
        return (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
                <p className="text-gray-600 mt-2">Explore AI-powered learning tools and assessments</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <Calendar className="w-10 h-10 text-blue-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Assessments</h3>
                    <p className="text-gray-600">View and take your assigned assessments</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <Brain className="w-10 h-10 text-purple-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Learning</h3>
                    <p className="text-gray-600">Smart roadmaps & practice tests</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <Users className="w-10 h-10 text-green-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Community</h3>
                    <p className="text-gray-600">Chat with professors & alumni</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">AI-Powered Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveSection('ai-roadmap')}
                  className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  <Target className="w-6 h-6 mx-auto mb-2" />
                  <span className="block font-semibold">AI Learning Roadmap</span>
                  <span className="block text-sm opacity-90">Personalized learning paths</span>
                </button>
                <button
                  onClick={() => setActiveSection('ai-practice')}
                  className="p-6 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all transform hover:scale-105"
                >
                  <Brain className="w-6 h-6 mx-auto mb-2" />
                  <span className="block font-semibold">AI Practice Tests</span>
                  <span className="block text-sm opacity-90">Smart assessment & feedback</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">SmartEval Student</h2>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors ${
                activeSection === item.id ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-600' : 'text-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default StudentDashboard;