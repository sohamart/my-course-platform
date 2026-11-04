import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  KeyRound,
  HardDrive,
  Settings,
  ArrowLeft,
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();

  const links = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Courses & Lessons', path: '/admin/courses', icon: BookOpen },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Enrollments', path: '/admin/enrollments', icon: KeyRound },
    { label: 'Storage & S3', path: '/admin/storage', icon: HardDrive },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-card p-4 hidden md:flex flex-col justify-between shrink-0 h-full border border-white/80 z-20 shadow-glass">
      <div data-lenis-prevent className="flex flex-col min-h-0 overflow-y-auto pr-0.5">
        <div className="px-3 py-2 mb-3 shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-muted">
            Admin Workspace
          </span>
          <h3 className="text-base font-bold text-brand-black brand-title">Administration</h3>
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? location.pathname === link.path
              : location.pathname.startsWith(link.path);

            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-lavender/70 text-brand-black shadow-sm border border-white/80'
                    : 'text-brand-muted hover:text-brand-black hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-black' : 'text-brand-muted'}`} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 mt-2 border-t border-white/60 shrink-0">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-brand-muted hover:text-brand-black hover:bg-white/50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student View
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;

