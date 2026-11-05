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
    <nav
      aria-label="Student Navigation Dock"
      className="fixed bottom-3.5 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 px-2 sm:px-3 py-2 sm:py-2 bg-white/95 sm:bg-white/75 backdrop-blur-xl sm:backdrop-blur-3xl flex items-center justify-center gap-1 sm:gap-2 rounded-full border border-neutral-200/85 sm:border-white/85 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.18),0_4px_12px_-2px_rgba(0,0,0,0.08)] sm:shadow-glass max-w-[calc(100vw-20px)] sm:max-w-none transition-all duration-300"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`relative px-3 sm:px-4 py-2 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 text-xs sm:text-xs font-bold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-neutral-950 font-bold'
                : 'text-neutral-700 hover:text-neutral-950 font-bold'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 bg-brand-lavender rounded-full border border-indigo-200/90 shadow-2xs"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 sm:gap-1.5">
              <Icon className="w-4 h-4 shrink-0 text-neutral-900" />
              <span className="inline font-bold tracking-tight">{item.label}</span>
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;

