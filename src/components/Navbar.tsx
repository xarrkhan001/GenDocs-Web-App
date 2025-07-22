import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X, Briefcase, Globe, LogOut, Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { signOut } from '@/lib/auth';
import { useTheme } from '@/contexts/ThemeContext';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleDashboardClick = () => {
    setMenuOpen(false);
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=signin');
    }
  };

  const showDashboardControls = location.pathname === '/dashboard';

  return (
    <nav className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xl font-bold text-primary tracking-tight">
          <span className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg">
            <Briefcase className="w-6 h-6 text-primary-foreground" />
          </span>
          GenDocs
        </span>
        {/* Desktop Nav */}
        <div className="hidden lg:flex flex-1 justify-start gap-4 ml-16">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1 rounded transition font-medium ${location.pathname === link.path ? 'bg-primary text-white dark:bg-blue-600 dark:text-white' : 'text-muted-foreground hover:bg-primary/10 dark:hover:bg-primary/20'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>
        {/* Desktop Dashboard Button and Dashboard Controls */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={handleDashboardClick}
            className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary/80 transition dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
          >
            Dashboard
          </button>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="ml-2 p-2 rounded border border-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
          {showDashboardControls && (
            <>
              <button
                onClick={() => setLanguage(language === 'english' ? 'urdu' : 'english')}
                className="px-1 py-0.5 text-[9px] md:px-2.5 md:py-1 md:text-xs lg:px-4 lg:py-2 lg:text-sm border border-gray-300 rounded bg-white dark:bg-gray-800 flex items-center gap-1 ml-2"
                style={{ minWidth: 60 }}
              >
                <Globe className="w-4 h-4 mr-1" />
                {language === 'english' ? '\u0627\u0631\u062f\u0648' : 'English'}
              </button>
              <button
                onClick={signOut}
                className="px-1 py-0.5 text-[9px] md:px-2.5 md:py-1 md:text-xs lg:px-4 lg:py-2 lg:text-sm border border-gray-300 rounded bg-white dark:bg-gray-800 flex items-center gap-1 ml-2"
                style={{ minWidth: 60 }}
              >
                <LogOut className="w-4 h-4 mr-1" />
                {t('signOut', language)}
              </button>
            </>
          )}
        </div>
        {/* Hamburger for mobile/md */}
        <div className="lg:hidden flex items-center">
          <button
            className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
        </div>
        {/* Mobile Menu */}
        {menuOpen && (
          <>
            {/* Overlay to close menu on outside click */}
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setMenuOpen(false)} />
            <div className="fixed left-0 w-full z-50 bg-white dark:bg-gray-900 shadow-xl border-b animate-slide-down top-16 md:top-20">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                {/* Theme Toggle Button (Mobile) */}
                <button
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="p-2 rounded border border-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
                </button>
              </div>
              <div className="flex flex-col gap-2 px-6 py-4">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded transition font-medium text-base ${location.pathname === link.path ? 'bg-primary text-white dark:bg-blue-600 dark:text-white' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <button
                  onClick={handleDashboardClick}
                  className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary/80 transition mt-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                  Dashboard
                </button>
                {/* Theme Toggle Button (Mobile, below Dashboard) */}
                {/* Already added above in border-b */}
                {showDashboardControls && (
                  <>
                    <button
                      onClick={() => { setLanguage(language === 'english' ? 'urdu' : 'english'); setMenuOpen(false); }}
                      className="px-1 py-0.5 text-[9px] md:px-2.5 md:py-1 md:text-xs lg:px-4 lg:py-2 lg:text-sm border border-gray-300 rounded bg-white dark:bg-gray-800 flex items-center gap-1 mt-2"
                      style={{ minWidth: 60 }}
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      {language === 'english' ? '\u0627\u0631\u062f\u0648' : 'English'}
                    </button>
                    <button
                      onClick={() => { signOut(); setMenuOpen(false); }}
                      className="px-1 py-0.5 text-[9px] md:px-2.5 md:py-1 md:text-xs lg:px-4 lg:py-2 lg:text-sm border border-gray-300 rounded bg-white dark:bg-gray-800 flex items-center gap-1 mt-2"
                      style={{ minWidth: 60 }}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      {t('signOut', language)}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {/* Simple slide-down animation */}
      <style>{`
        @keyframes slide-down {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.2s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 