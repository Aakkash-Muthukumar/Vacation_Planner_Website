import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { HomePage } from '@/components/HomePage';

interface IndexProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

const Index = ({ darkMode, setDarkMode }: IndexProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <HomePage darkMode={darkMode} setDarkMode={setDarkMode} />;
};

export default Index;
