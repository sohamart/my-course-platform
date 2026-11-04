import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageSquare,
  Phone,
  Mail,
  Send,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

const TeacherContactModal = ({
  isOpen,
  onClose,
  studentName = '',
  studentEmail = '',
  title = 'Account Activated Successfully! 🎉',
  subtitle = 'Welcome to your private learning portal',
  onProceed,
  proceedLabel = 'Enter Dashboard',
}) => {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchContact = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/teacher-contact');
        if (isMounted && res.data?.success) {
          setContact(res.data.contact);
        }
      } catch (err) {
        console.error('Failed to load teacher contact:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContact();

    // Lock background scroll when open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      isMounted = false;
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const rawPhone = contact?.whatsapp || contact?.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

  const waMessage = encodeURIComponent(
    `Hello Teacher,\n\nI have registered on MyCourse with:\n• Name: ${studentName || 'Student'}\n• Email: ${studentEmail || 'My registered email'}\n\nPlease assign my course modules. Thank you!`
  );

  const mailtoUrl = contact?.email
    ? `mailto:${contact.email}?subject=${encodeURIComponent(
        `Course Access Request - ${studentName || 'Student'}`
      )}&body=${waMessage}`
    : null;

  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMessage}` : null;
  const telUrl = contact?.phone ? `tel:${contact.phone.replace(/\s+/g, '')}` : null;

  const cleanTelegram = contact?.telegram?.replace(/^@/, '') || '';
  const telegramUrl = cleanTelegram ? `https://t.me/${cleanTelegram}` : null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-[32px] glass-card border border-white/90 bg-white/90 p-6 sm:p-8 shadow-2xl z-10 space-y-6 text-brand-black transform transition-all animate-scale-up max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-mint text-emerald-950 text-xs font-bold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>0 Courses Currently Enrolled</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-black brand-title">
            {title}
          </h2>
          <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Explanatory Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-neutral-800 text-xs leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Teacher Course Assignment Required</span>
          </div>
          <p className="text-[11px] text-neutral-700">
            In this private portal, courses are not public. Your teacher will individually assign your curriculum modules to:
          </p>
          <p className="font-mono font-semibold text-neutral-900 text-[11px] bg-white/80 px-2 py-1 rounded-md inline-block">
            {studentEmail || 'your registered email'}
          </p>
        </div>

        {/* Teacher Contact Info Card */}
        <div className="rounded-2xl bg-neutral-50/80 border border-neutral-200/80 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-black text-white flex items-center justify-center font-bold text-base uppercase shrink-0 overflow-hidden shadow-sm border border-neutral-200">
              {contact?.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                contact?.name?.slice(0, 2) || 'TR'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-neutral-900 truncate">
                  {contact?.name || 'Lead Instructor'}
                </h4>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-lavender text-neutral-900">
                  TEACHER
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 truncate">
                {contact?.email || 'Teacher Direct Contact'}
              </p>
            </div>
          </div>

          {/* Teacher custom welcome message */}
          {contact?.message && (
            <div className="p-3 rounded-xl bg-white/90 border border-neutral-200/60 text-[11px] text-neutral-700 italic leading-relaxed">
              "{contact.message}"
            </div>
          )}

          {/* Action Contact Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-200 text-neutral-400 text-xs font-semibold cursor-not-allowed"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Not Set</span>
              </button>
            )}

            {mailtoUrl && (
              <a
                href={mailtoUrl}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-black hover:bg-neutral-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Mail className="w-4 h-4 text-brand-lavender" />
                <span>Send Email</span>
              </a>
            )}

            {telUrl && (
              <a
                href={telUrl}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Call {contact?.phone}</span>
              </a>
            )}

            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-cyan-600" />
                <span>Telegram</span>
              </a>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200/60">
          <button
            type="button"
            onClick={onProceed || onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-brand-black text-white text-xs sm:text-sm font-bold hover:bg-neutral-800 transition active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{proceedLabel}</span>
            <ArrowRight className="w-4 h-4 text-brand-lavender" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TeacherContactModal;

