import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  User as UserIcon,
  Camera,
  CheckCircle2,
  HardDrive,
  Save,
  Sparkles,
  Lock,
  MessageSquare,
  Phone,
  Mail,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/layout/AdminSidebar';

const AdminSettings = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Teacher Contact Details (Displayed to newly registered students with 0 courses)
  const [contactPhone, setContactPhone] = useState(user?.contactInfo?.phone || '');
  const [contactWhatsapp, setContactWhatsapp] = useState(user?.contactInfo?.whatsapp || '');
  const [contactEmail, setContactEmail] = useState(user?.contactInfo?.email || user?.email || '');
  const [contactTelegram, setContactTelegram] = useState(user?.contactInfo?.telegram || '');
  const [contactMessage, setContactMessage] = useState(
    user?.contactInfo?.message ||
      'Welcome to MyCourse! Please message me on WhatsApp or email with your registered email address to assign your private course modules.'
  );

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setContactPhone(user.contactInfo?.phone || '');
      setContactWhatsapp(user.contactInfo?.whatsapp || '');
      setContactEmail(user.contactInfo?.email || user.email || '');
      setContactTelegram(user.contactInfo?.telegram || '');
      if (user.contactInfo?.message) {
        setContactMessage(user.contactInfo.message);
      }
    }
  }, [user]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo size must be less than 5MB.', 'warning');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setSaving(true);
    try {
      let finalAvatarKey = user?.avatar;

      // 1. If new photo selected, upload to S3 via presigned PUT URL
      if (avatarFile) {
        showToast('Uploading profile photo to private S3 bucket...', 'info');
        const uploadRes = await api.post('/media/avatar-upload-url', {
          originalFilename: avatarFile.name,
          contentType: avatarFile.type || 'image/jpeg',
          fileSize: avatarFile.size,
        });

        if (!uploadRes.data?.success) {
          throw new Error('Failed to obtain S3 upload authorization.');
        }

        const { uploadUrl, objectKey } = uploadRes.data.data;

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': avatarFile.type || 'image/jpeg',
          },
          body: avatarFile,
        });

        finalAvatarKey = objectKey;
      }

      // 2. Send updated profile payload
      const payload = {
        name,
        bio,
        avatarKey: finalAvatarKey,
        contactInfo: {
          phone: contactPhone,
          whatsapp: contactWhatsapp,
          email: contactEmail,
          telegram: contactTelegram,
          message: contactMessage,
        },
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);
      showToast('Admin settings updated successfully! 🎉', 'success');
      setAvatarFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activePhoto = avatarPreview || user?.avatarUrl;

  return (
    <LiquidBackground fixedLayout>
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-stretch gap-8 overflow-hidden min-h-0">
        <AdminSidebar />

        <main
          data-lenis-prevent
          className="flex-1 min-w-0 h-full overflow-y-auto pr-1 pb-24 space-y-6 scroll-smooth overscroll-contain"
        >
          {/* Header Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-brand-lavender text-brand-black">
                <Shield className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                ADMIN WORKSPACE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-black brand-title">
              Admin Settings & Preferences
            </h1>
            <p className="text-xs text-brand-muted mt-1">
              Manage master credentials, administrator profile, and system infrastructure.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: Admin Profile Card */}
            <div className="rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/60">
                <div className="flex items-center gap-4">
                  {/* Photo with Camera upload */}
                  <div className="relative group shrink-0">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-brand-black text-white flex items-center justify-center font-bold text-xl uppercase shadow-md overflow-hidden border-2 border-white/90">
                      {activePhoto ? (
                        <img
                          src={activePhoto}
                          alt={user?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.name ? user.name.slice(0, 2) : 'AD'
                      )}
                    </div>

                    <label
                      htmlFor="adminAvatarInput"
                      className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-brand-black text-white hover:bg-neutral-800 transition cursor-pointer shadow-md border-2 border-white"
                      title="Upload Admin Photo to S3"
                    >
                      <Camera className="w-3.5 h-3.5 text-brand-lavender" />
                    </label>
                    <input
                      type="file"
                      id="adminAvatarInput"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-brand-black">
                        {user?.name || 'Administrator'}
                      </h2>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-black text-brand-mint">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">{user?.email}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Full System & Curriculum Access
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Administrator Name"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Email Address <span className="text-[10px] text-brand-muted">(System Protected)</span>
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-100/70 border border-neutral-200 text-xs sm:text-sm text-neutral-500 cursor-not-allowed shadow-2xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Bio / Admin Title
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Lead Instructor & Curriculum Director"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Student Welcome & Teacher Contact Details (Displayed to students with 0 courses) */}
            <div className="rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-black">Student Welcome & Teacher Contact Info</h3>
                    <p className="text-[11px] text-brand-muted">
                      Displayed on registration popup & student dashboard when a learner has 0 assigned courses.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-mint text-emerald-950 self-start sm:self-auto">
                  Student Guidance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Number (Direct Chat)</span>
                  </label>
                  <input
                    type="text"
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    placeholder="+91 9876543210 (include country code)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                  <span className="text-[10px] text-brand-muted mt-1 block">
                    Enables a one-click "Chat on WhatsApp" button for newly registered students.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Phone Number (Call / SMS)</span>
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                  <span className="text-[10px] text-brand-muted mt-1 block">
                    Direct voice contact number for course enrollment inquiries.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>Support Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="instructor@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Telegram Handle / Link (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={contactTelegram}
                    onChange={(e) => setContactTelegram(e.target.value)}
                    placeholder="@instructor_handle"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Custom Welcome & Course Assignment Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Instructions shown to student upon registration or when 0 courses are assigned..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs resize-none"
                  />
                  <span className="text-[10px] text-brand-muted mt-1 block">
                    Example: "Please send your registered email via WhatsApp to unlock your specific batch courses."
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Security & Credentials Card */}
            <div className="rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/60">
                <KeyRound className="w-4 h-4 text-brand-black" />
                <h3 className="text-sm font-bold text-brand-black">Update Security Password</h3>
              </div>
              <p className="text-xs text-brand-muted">
                Leave password fields blank if you do not wish to update your administrator credentials.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/70 border border-neutral-200 text-xs sm:text-sm text-brand-black focus:outline-none focus:bg-white focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Storage & Infrastructure Info */}
            <div className="rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass">
              <div className="flex items-center justify-between pb-3 border-b border-white/60 mb-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-brand-black" />
                  <h3 className="text-sm font-bold text-brand-black">Private S3 Media Infrastructure</h3>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Online & Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80">
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">Storage Bucket</span>
                  <span className="font-mono font-semibold text-brand-black mt-0.5 block truncate">
                    mycourse-private-media-2026
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80">
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">AWS Region</span>
                  <span className="font-mono font-semibold text-brand-black mt-0.5 block">
                    ap-southeast-2
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80">
                  <span className="text-[10px] font-bold uppercase text-brand-muted block">Streaming Security</span>
                  <span className="font-semibold text-brand-black mt-0.5 block">
                    Short-Lived Presigned URLs (Byte-Range)
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-brand-black text-white text-xs font-bold hover:bg-neutral-800 transition active:scale-95 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-brand-lavender" />
                <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </LiquidBackground>
  );
};

export default AdminSettings;

