import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, BookOpen, Users, LogOut } from 'lucide-react';
import ChatSection from '../common/ChatSection';

const AlumniDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'chat':
        return <ChatSection />;
      default:
        return (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Welcome back, {user?.username}!
            </h1>
                <p className="text-gray-600 mt-2">Connect with students and share your professional experience</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <MessageCircle className="w-10 h-10 text-purple-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
                    <p className="text-gray-600">Connect with students and professors</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <Users className="w-10 h-10 text-blue-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Community</h3>
                    <p className="text-gray-600">Share your experience and knowledge</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex justify-center">
                <button
                  onClick={() => setActiveSection('chat')}
                  className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
                >
                  <MessageCircle className="w-6 h-6 mx-auto mb-2" />
                  Start a Conversation
                </button>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Alumni Portal Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Chat with current students
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                  Connect with professors
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  Share career insights
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                  Mentor current students
                </div>
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
          <h2 className="text-xl font-bold text-gray-900">SmartEval Alumni</h2>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-purple-50 transition-colors ${
                activeSection === item.id ? 'bg-purple-50 border-r-2 border-purple-500 text-purple-600' : 'text-gray-700'
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

export default AlumniDashboard;