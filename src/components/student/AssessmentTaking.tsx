import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, X, Brain } from 'lucide-react';
import { Assessment } from '../../types';
import { assessmentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AssessmentTakingProps {
  assessment: Assessment;
  onComplete: () => void;
  onExit: () => void;
}

const AssessmentTaking: React.FC<AssessmentTakingProps> = ({ assessment, onComplete, onExit }) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(assessment.questions.length).fill(-1));
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Calculate time remaining with better precision
    const endTime = new Date(assessment.endTime).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    setTimeRemaining(remaining);

    if (remaining <= 0) {
      toast.error('Time is up! Assessment will be auto-submitted.');
      submitAssessment();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          toast.error('Time is up! Auto-submitting assessment...');
          submitAssessment();
          return 0;
        }
        
        // Show warnings at specific time intervals
        if (prev === 300) { // 5 minutes
          toast.warning('5 minutes remaining!');
        } else if (prev === 60) { // 1 minute
          toast.error('1 minute remaining!');
        } else if (prev === 30) { // 30 seconds
          toast.error('30 seconds remaining!');
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment.endTime, isSubmitting]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitAssessment = async () => {
    if (isSubmitting) {
      console.log('Already submitting, preventing duplicate submission');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await assessmentAPI.submit(assessment.id, {
        studentId: user!.id,
        answers: answers
      });
      toast.success('Assessment submitted successfully!');
      onComplete();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit assessment. Retrying...');
      
      // Retry submission once after a short delay
      setTimeout(async () => {
        try {
          await assessmentAPI.submit(assessment.id, {
            studentId: user!.id,
            answers: answers
          });
          toast.success('Assessment submitted successfully!');
          onComplete();
        } catch (retryError) {
          toast.error('Failed to submit assessment. Please contact support.');
          console.error('Retry submission failed:', retryError);
        }
      }, 2000);
      
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    const unansweredCount = answers.filter(a => a === -1).length;
    const message = unansweredCount > 0 
      ? `Are you sure you want to exit? You have ${unansweredCount} unanswered questions and your progress will be lost.`
      : 'Are you sure you want to exit? Your progress will be lost.';
      
    if (window.confirm(message)) {
      onExit();
    }
  };

  const question = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
  const answeredCount = answers.filter(a => a !== -1).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Brain className="w-6 h-6 mr-2 text-blue-600" />
                {assessment.title}
              </h1>
              <p className="text-gray-600 mt-1">{assessment.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-4 py-2 rounded-lg ${
                timeRemaining < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 
                timeRemaining < 300 ? 'bg-orange-100 text-orange-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-4 h-4 mr-2" />
                <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
              </div>
              
              <button
                onClick={handleExit}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {assessment.questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {answeredCount} answered
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {question.questionText}
            </h2>
            
            {timeRemaining < 60 && timeRemaining > 0 && (
              <div className="flex items-center p-4 bg-red-100 border-2 border-red-300 rounded-lg mb-6 animate-pulse">
                <AlertCircle className="w-6 h-6 text-red-700 mr-3" />
                <div>
                  <span className="text-red-800 font-bold text-lg">URGENT: Less than 1 minute remaining!</span>
                  <p className="text-red-700 text-sm mt-1">Assessment will auto-submit when time expires.</p>
                </div>
              </div>
            )}
            
            {timeRemaining < 300 && timeRemaining >= 60 && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-700 text-sm font-medium">Less than 5 minutes remaining!</span>
              </div>
            )}
          </div>

          <div className="space-y-3 mb-8">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                  answers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center text-sm font-semibold ${
                    answers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-400'
                  }`}>
                    {answers[currentQuestion] === index ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-3">
              {currentQuestion < assessment.questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={submitAssessment}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Assessment
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigator</h3>
          <div className="grid grid-cols-10 gap-2">
            {assessment.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== -1
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center mt-4 space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span className="text-gray-600">Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span className="text-gray-600">Not Answered ({assessment.questions.length - answeredCount})</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
              <span className="text-gray-600">Current</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTaking;