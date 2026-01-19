import React from 'react';
import { PublicPage } from '../types';
import { ArrowRight } from 'lucide-react';

interface Props {
  currentPage: PublicPage;
  onNavigate: (page: PublicPage) => void;
  onEnterDashboard: () => void;
}

const PublicNavbar: React.FC<Props> = ({ currentPage, onNavigate, onEnterDashboard }) => {
  const links = [
    { id: PublicPage.SOLUTIONS, label: 'Architecture' },
    { id: PublicPage.SERVICES, label: 'Execution' },
    { id: PublicPage.CASE_STUDIES, label: 'Validation' },
    { id: PublicPage.PRICING, label: 'Membership' },
    { id: PublicPage.ABOUT, label: 'Identity' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-xlnc-bg/90 backdrop-blur-md transition-all duration-500">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => onNavigate(PublicPage.HOME)}
          className="cursor-pointer group"
        >
          <h1 className="text-3xl font-serif font-bold tracking-widest text-white group-hover:text-xlnc-gold transition-colors duration-500">
            XLNC
          </h1>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-12">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-300 relative group ${
                currentPage === link.id ? 'text-xlnc-gold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-xlnc-gold transition-all duration-300 ${
                currentPage === link.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
              }`} />
            </button>
          ))}
        </div>

        {/* CTA */}
        <button 
          onClick={onEnterDashboard}
          className="border border-white/10 bg-transparent hover:border-xlnc-gold text-white hover:text-xlnc-gold px-8 py-3 text-[10px] font-bold uppercase tracking-[0.25em] transition-all duration-500 ease-out flex items-center gap-3"
        >
          Command
          <ArrowRight size={12} />
        </button>
      </div>
    </nav>
  );
};

export default PublicNavbar;