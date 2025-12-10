import { useState } from 'react';
import { FiSearch, FiHelpCircle, FiMessageSquare, FiBook, FiMail, FiPhone, FiClock, FiCheckCircle, FiArrowRight, FiAlertTriangle, FiLock, FiCreditCard, FiSettings, FiUsers, FiPlay } from 'react-icons/fi';

function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');

  // Sample help categories and articles
  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: FiHelpCircle },
    { id: 'account', name: 'Account & Profile', icon: FiBook },
    { id: 'videos', name: 'Videos & Reels', icon: FiPlay },
    { id: 'community', name: 'Community', icon: FiUsers },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: FiSettings },
    { id: 'contact', name: 'Contact Us', icon: FiMail },
  ];

  const helpArticles = {
    'getting-started': [
      { title: 'Creating Your Account', description: 'Learn how to sign up and create your profile', popular: true },
      { title: 'Navigating the Interface', description: 'Understand the main features and navigation', popular: true },
      { title: 'Privacy Settings', description: 'Control who can see your content and activity' },
      { title: 'Notifications Setup', description: 'Customize your notification preferences' },
    ],
    'account': [
      { title: 'Changing Your Username', description: 'Steps to update your username' },
      { title: 'Updating Profile Picture', description: 'How to change your profile avatar' },
      { title: 'Account Verification', description: 'Process for getting verified badge', popular: true },
      { title: 'Password Recovery', description: 'Reset your password if you forget it' },
    ],
    'videos': [
      { title: 'Uploading Videos', description: 'How to upload and share your videos', popular: true },
      { title: 'Creating Reels', description: 'Tips for making engaging short videos' },
      { title: 'Video Editing Tools', description: 'Built-in editing features and filters' },
      { title: 'Copyright Guidelines', description: 'Understanding content rights and restrictions' },
    ],
    'community': [
      { title: 'Joining Groups', description: 'How to find and join community groups' },
      { title: 'Starting Discussions', description: 'Create posts and start conversations' },
      { title: 'Reporting Content', description: 'How to report inappropriate content', popular: true },
      { title: 'Building Followers', description: 'Tips for growing your audience' },
    ],
    'troubleshooting': [
      { title: 'Video Not Playing', description: 'Solutions for playback issues', popular: true },
      { title: 'Login Problems', description: 'Troubleshoot account access issues' },
      { title: 'App Crashing', description: 'Fixes for app stability problems' },
      { title: 'Slow Performance', description: 'Improve app speed and responsiveness' },
    ],
    'contact': [
      { title: 'Send a Message', description: 'Reach out to our support team directly' },
      { title: 'Call Support', description: 'Speak with a representative by phone' },
      { title: 'Business Inquiries', description: 'Partnership and collaboration opportunities' },
      { title: 'Bug Reports', description: 'Report technical issues and glitches' },
    ],
  };

  const faqs = [
    { question: 'How do I reset my password?', answer: 'You can reset your password by clicking on "Forgot Password" on the login page and following the email instructions.' },
    { question: 'What video formats are supported?', answer: 'We support MP4, MOV, AVI, and WMV formats with a maximum file size of 4GB.' },
    { question: 'How can I delete my account?', answer: 'To delete your account, go to Settings > Account > Delete Account and follow the confirmation steps.' },
    { question: 'Can I download videos?', answer: 'Downloading videos is only available for Premium subscribers and content creators for their own videos.' },
  ];

  const popularTopics = [
    { title: 'Video Upload Issues', icon: FiAlertTriangle },
    { title: 'Account Verification', icon: FiCheckCircle },
    { title: 'Privacy Controls', icon: FiLock },
    { title: 'Payment Methods', icon: FiCreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Help Center</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Find answers to your questions, troubleshoot issues, and get the most out of your experience
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Popular Topics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Popular Topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularTopics.map((topic, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <topic.icon className="w-5 h-5 text-purple-500 mr-3" />
                  <span className="font-medium text-gray-900 dark:text-white">{topic.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <li key={category.id}>
                      <button
                        onClick={() => setActiveCategory(category.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                          activeCategory === category.id
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mr-3" />
                        <span>{category.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Articles Content */}
          <div className="lg:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categories.find(cat => cat.id === activeCategory)?.name}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {helpArticles[activeCategory]?.length} articles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpArticles[activeCategory]?.map((article, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{article.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{article.description}</p>
                      </div>
                      {article.popular && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                      Learn more
                      <FiArrowRight className="ml-1 w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-sm p-8 mt-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2">Still Need Help?</h2>
                  <p className="opacity-90">Our support team is ready to assist you</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex items-center justify-center px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    <FiMessageSquare className="mr-2" />
                    Live Chat
                  </button>
                  <button className="flex items-center justify-center px-6 py-3 bg-purple-600/20 text-white rounded-lg font-medium hover:bg-purple-600/30 transition-colors">
                    <FiMail className="mr-2" />
                    Email Us
                  </button>
                </div>
              </div>
              <div className="mt-6 flex items-center text-sm opacity-90">
                <FiClock className="mr-2" />
                <span>Support available 24/7 • Average response time: 2 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpCenter;