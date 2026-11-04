import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, BarChart2, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Courses', path: '/courses', icon: BookOpen },
    { label: 'Progress', path: '/progress', icon: BarChart2 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 px-2 sm:px-3 py-1.5 sm:py-2 glass-nav-floating flex items-center gap-1 sm:gap-2 shadow-glass border border-white/80 max-w-[95vw]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold transition-all duration-300 ${
              isActive ? 'text-brand-black' : 'text-brand-muted hover:text-brand-black'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 bg-brand-lavender/80 rounded-full border border-white/80 shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="inline">{item.label}</span>
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;

