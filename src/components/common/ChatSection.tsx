import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User, MessageCircle, LogOut } from 'lucide-react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage, User as UserType } from '../../types';
import toast from 'react-hot-toast';

interface ChatUser extends UserType {
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

const ChatSection: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatUsers();
  }, []);

  const loadChatUsers = async () => {
    try {
      // This would typically load users who have had conversations with the current user
      // For now, we'll simulate this with an empty array
      setChatUsers([]);
    } catch (error) {
      console.error('Failed to load chat users');
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await chatAPI.findUser(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (targetUser: UserType) => {
    setSelectedUser(targetUser);
    setSearchResults([]);
    setSearchQuery('');
    setShowSearch(false);
    
    try {
      const response = await chatAPI.getMessages(user!.id, targetUser.id);
      setMessages(response.data);
      
      // Add to chat users if not already present
      const existingUser = chatUsers.find(u => u.id === targetUser.id);
      if (!existingUser) {
        setChatUsers(prev => [targetUser, ...prev]);
      }
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const messageData = {
        senderId: user!.id,
        receiverId: selectedUser.id,
        message: newMessage.trim(),
      };

      await chatAPI.sendMessage(messageData);
      
      // Add message to local state
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        ...messageData,
        timestamp: new Date(),
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage('');
      
      // Update chat users list
      setChatUsers(prev => {
        const updated = prev.filter(u => u.id !== selectedUser.id);
        return [{
          ...selectedUser,
          lastMessage: newMessage.trim(),
          lastMessageTime: new Date(),
        }, ...updated];
      });
      
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="p-8 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button
          onClick={logout}
          className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
      
      <div className="h-full bg-white rounded-lg shadow-md overflow-hidden flex">
        {/* Left Panel - Chat List and Search */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            
            {showSearch && (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search username or email"
                    />
                  </div>
                  <button
                    onClick={searchUsers}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Search
                  </button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map((searchUser) => (
                      <button
                        key={searchUser.id}
                        onClick={() => startChat(searchUser)}
                        className="w-full text-left p-2 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{searchUser.username}</p>
                            <p className="text-xs text-gray-600">{searchUser.role}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatUsers.length > 0 ? (
              <div className="space-y-1 p-2">
                {chatUsers.map((chatUser) => (
                  <button
                    key={chatUser.id}
                    onClick={() => startChat(chatUser)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedUser?.id === chatUser.id
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{chatUser.username}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {chatUser.lastMessage || `${chatUser.role} • Start a conversation`}
                        </p>
                        {chatUser.lastMessageTime && (
                          <p className="text-xs text-gray-400">
                            {chatUser.lastMessageTime.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <p className="text-gray-400 text-xs mt-1">Use the search button to find users</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedUser.username}</h3>
                    <p className="text-sm text-gray-600">{selectedUser.role}</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === user!.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user!.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderId === user!.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose from existing conversations or search for new users</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSection;