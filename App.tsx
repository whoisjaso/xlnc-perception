

import React, { useState, useEffect } from 'react';
import DashboardLayout from './views/DashboardLayout';
import PublicNavbar from './components/PublicNavbar';
import Landing from './views/public/Landing';
import Solutions from './views/public/Solutions';
import Services from './views/public/Services';
import Pricing from './views/public/Pricing';
import CaseStudies from './views/public/CaseStudies';
import About from './views/public/About';
import Terms from './views/public/Terms';
import Privacy from './views/public/Privacy';
import Status from './views/public/Status';
import SignUp from './views/public/SignUp';
import OnboardingWizard from './components/OnboardingWizard';
import PublicChat from './components/PublicChat';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './src/stores/useAuthStore';
import { PublicPage, UserProfile } from './types';

const STORAGE_KEY = 'xlnc_sovereign_identity';

const App: React.FC = () => {
  const { user, refreshToken: refreshAuthToken, setAuth, logout: authLogout } = useAuthStore();
  const [isDashboard, setIsDashboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [publicPage, setPublicPage] = useState(PublicPage.HOME as PublicPage);
  const [userProfile, setUserProfile] = useState(null as UserProfile | null);

  // Restore Session & Refresh Token
  useEffect(() => {
    const initAuth = async () => {
      // First check if user is in zustand store (from previous session)
      if (user) {
        // Try to refresh the access token
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          setUserProfile(user);
          setIsDashboard(true);
          return;
        }
      }

      // Fallback: Check old localStorage approach for migration
      const storedIdentity = localStorage.getItem(STORAGE_KEY);
      if (storedIdentity) {
        try {
          const parsedProfile = JSON.parse(storedIdentity);
          // Try to refresh token with the stored user
          const refreshed = await refreshAuthToken();
          if (refreshed) {
            setUserProfile(parsedProfile);
            setIsDashboard(true);
          } else {
            // Refresh failed, clear old storage
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (e) {
          console.error("Identity Corrupted", e);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    initAuth();
  }, []);

  // Navigation Handler
  const navigate = (page: PublicPage) => {
    setPublicPage(page);
    window.scrollTo(0, 0);
  };

  // Entry Points
  const handleSignUpComplete = (profile: UserProfile) => {
      setUserProfile(profile);
      setIsDashboard(true);
      // Show setup wizard for new users
      setShowOnboarding(true); 
      
      // Persist Identity
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  const handleLogout = async () => {
      // Call zustand logout (which calls backend to clear refresh token)
      await authLogout();

      setIsDashboard(false);
      setUserProfile(null);
      setPublicPage(PublicPage.HOME);
      setShowOnboarding(false);

      // Clear old localStorage approach
      localStorage.removeItem(STORAGE_KEY);
  };

  const navigateToSignUp = () => {
      setPublicPage(PublicPage.SIGN_UP);
  };

  // Layout Switcher
  if (isDashboard) {
    return (
        <ErrorBoundary>
             {showOnboarding && (
                <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
            )}
            <DashboardLayout onLogout={handleLogout} user={userProfile} onboardingActive={showOnboarding} />
        </ErrorBoundary>
    );
  }

  // Special Full Screen Page for Sign Up
  if (publicPage === PublicPage.SIGN_UP) {
      return <SignUp onComplete={handleSignUpComplete} onNavigateHome={() => navigate(PublicPage.HOME)} />;
  }

  return (
    <div className="min-h-screen bg-xlnc-bg text-white selection:bg-xlnc-gold/30 selection:text-white font-sans">
        
        <PublicNavbar 
            currentPage={publicPage} 
            onNavigate={navigate} 
            onEnterDashboard={navigateToSignUp}
        />
        
        {/* Public Page Router */}
        {(() => {
            switch (publicPage) {
                case PublicPage.HOME: return <Landing onEnter={navigateToSignUp} />;
                case PublicPage.SOLUTIONS: return <Solutions />;
                case PublicPage.SERVICES: return <Services />;
                case PublicPage.PRICING: return <Pricing />;
                case PublicPage.CASE_STUDIES: return <CaseStudies />;
                case PublicPage.ABOUT: return <About />;
                case PublicPage.TERMS: return <Terms />;
                case PublicPage.PRIVACY: return <Privacy />;
                case PublicPage.STATUS: return <Status />;
                default: return <Landing onEnter={navigateToSignUp} />;
            }
        })()}

        {/* Public Footer */}
        <footer className="border-t border-xlnc-gold/10 py-16 px-6 bg-xlnc-bg relative overflow-hidden">
            {/* Decorative ambient glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-xlnc-gold/5 blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                
                {/* Identity Section */}
                <div className="flex flex-col items-center md:items-start gap-6">
                    <div className="flex items-center gap-5 group cursor-default">
                        {/* Opulent Crest Logo - Enhanced Geometry */}
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-xlnc-gold/10 rounded-full blur-md group-hover:bg-xlnc-gold/20 transition-all duration-500"></div>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 opacity-90 group-hover:opacity-100 transition-all duration-500 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                                {/* Outer Diamond Frame */}
                                <path d="M20 2L38 20L20 38L2 20L20 2Z" stroke="url(#footer-gold)" strokeWidth="0.5" strokeOpacity="0.5"/>
                                
                                {/* Inner Pyramid Structure */}
                                <path d="M20 8L30 28H10L20 8Z" stroke="url(#footer-gold)" strokeWidth="1.5"/>
                                <path d="M20 16L24 24H16L20 16Z" fill="url(#footer-gold)"/>
                                
                                {/* Vertical Axis of Power */}
                                <rect x="19.5" y="4" width="1" height="32" fill="url(#footer-gold)" fillOpacity="0.8"/>
                                
                                {/* Halo Ring */}
                                <circle cx="20" cy="20" r="14" stroke="url(#footer-gold)" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.6"/>

                                <defs>
                                    <linearGradient id="footer-gold" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#BF953F"/>
                                        <stop offset="50%" stopColor="#FCF6BA"/>
                                        <stop offset="100%" stopColor="#AA771C"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FCF6BA] via-[#BF953F] to-[#AA771C] tracking-[0.15em]">
                                XLNC
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center md:items-start pl-1">
                        <span className="text-xlnc-gold font-serif text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                            XLNC Empire &copy; 2025
                        </span>
                        <span className="text-gray-600 font-sans text-[9px] tracking-[0.25em] mt-1 uppercase">
                            Architecting Digital Sovereignty
                        </span>
                    </div>
                </div>

                {/* Legal / Status Links */}
                <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                    <button 
                        onClick={() => navigate(PublicPage.TERMS)}
                        className="text-gray-500 hover:text-xlnc-gold text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b border-transparent hover:border-xlnc-gold/50"
                    >
                        Terms of Dominion
                    </button>
                    <button 
                        onClick={() => navigate(PublicPage.PRIVACY)}
                        className="text-gray-500 hover:text-xlnc-gold text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b border-transparent hover:border-xlnc-gold/50"
                    >
                        Privacy Protocol
                    </button>
                    <button 
                        onClick={() => navigate(PublicPage.STATUS)}
                        className="text-gray-500 hover:text-xlnc-gold text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 pb-1 border-b border-transparent hover:border-xlnc-gold/50"
                    >
                        System Status
                    </button>
                </div>
            </div>
        </footer>

        {/* Concierge Chatbot */}
        <PublicChat />
    </div>
  );
};

export default App;
