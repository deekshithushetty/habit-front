import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from './store';
import { initAuthToken } from './services/api';

// Pages
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import TasksPage from './pages/TasksPage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';

// Components
import AddTaskModal from './components/AddTaskModal';
import AddHabitModal from './components/AddHabitModal';

// Initialize auth token on app load
initAuthToken();

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { activeTab, theme } = useUIStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuth().finally(() => setInitialized(true));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Show loading spinner while checking auth
  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading TaskFlow...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Render active page
  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'tasks':
        return <TasksPage />;
      case 'insights':
        return <InsightsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      {renderPage()}
      <AddTaskModal />
      <AddHabitModal />
    </>
  );
}

export default App;
