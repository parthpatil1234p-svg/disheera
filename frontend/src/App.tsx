import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { QuizPage } from './pages/QuizPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { PassportPage } from './pages/PassportPage';
import { ResumeStudioPage } from './pages/ResumeStudioPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { RecruiterCockpitPage } from './pages/RecruiterCockpitPage';
import { JobsPage } from './pages/JobsPage';
import { VerifyPage } from './pages/VerifyPage';
import { AuthPage } from './pages/AuthPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SecurityPage } from './pages/SecurityPage';
import { SupportPage } from './pages/SupportPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Main Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideFooterOn = ['/assessment', '/login', '/register', '/reset-password'];
  const shouldHideFooter = hideFooterOn.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FD] text-[#0F172A] selection:bg-blue-100 selection:text-blue-900 font-sans antialiased">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/passport" element={<PassportPage />} />
            <Route path="/resume-builder" element={<ResumeStudioPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/recruiter-dashboard" element={<RecruiterCockpitPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
