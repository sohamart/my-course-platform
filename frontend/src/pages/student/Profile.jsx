import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, KeyRound, Shield, LogOut, CheckCircle2, Camera, Upload, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import BottomNavigation from '../../components/layout/BottomNavigation';

const Profile = () => {
  const { user, updateProfile, logout, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

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

      // 1. If user selected a new profile image, upload directly to S3 via Presigned PUT URL
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
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await updateProfile(payload);
      showToast('Profile and photo updated successfully!', 'success');
      setAvatarFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activePhoto = avatarPreview || user?.avatarUrl;

  return (
    <LiquidBackground>
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
              ACCOUNT PREFERENCES
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-black brand-title mt-0.5">
              Profile & Settings
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              Manage your personal profile, credentials, and S3-stored profile photo.
            </p>
          </div>

          {isAdmin && (
            <Link
              to="/admin/settings"
              className="px-4 py-2 rounded-2xl bg-brand-black text-white text-xs font-semibold flex items-center gap-2 hover:bg-neutral-800 transition shadow-sm cursor-pointer"
            >
              <Shield className="w-4 h-4 text-brand-lavender" />
              <span>Admin Workspace Settings</span>
            </Link>
          )}
        </div>

        <div className="rounded-[30px] glass-card p-6 sm:p-10 border border-white/80 shadow-glass">
          {/* User Header Badge with S3 Photo Upload */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/60 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-3xl bg-brand-black text-white flex items-center justify-center font-bold text-2xl uppercase shadow-lg overflow-hidden border-2 border-white/80">
                  {activePhoto ? (
                    <img
                      src={activePhoto}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name ? user.name.slice(0, 2) : 'MC'
                  )}
                </div>

                {/* Camera upload overlay badge */}
                <label
                  htmlFor="avatarInput"
                  className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-brand-black text-white hover:bg-neutral-800 transition cursor-pointer shadow-md border-2 border-white"
                  title="Upload New Photo to S3"
                >
                  <Camera className="w-3.5 h-3.5 text-brand-lavender" />
                </label>
                <input
                  type="file"
                  id="avatarInput"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-brand-black">{user?.name}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-lavender text-brand-black border border-white/80">
                    {user?.role}
                  </span>
                </div>
                <p className="text-xs text-brand-muted mt-0.5">{user?.email}</p>
                {avatarFile && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                    <Sparkles className="w-3 h-3" /> New photo selected (Click Save below)
                  </span>
                )}
              </div>
            </div>

            {/* Change Photo Pill Button */}
            <label
              htmlFor="avatarInput"
              className="w-full sm:w-auto justify-center px-4 py-2 rounded-2xl glass-card border border-white/80 text-xs font-semibold text-brand-black hover:bg-white/70 transition shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-brand-black" />
              <span>{activePhoto ? 'Change Photo' : 'Upload Photo'}</span>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-brand-black flex items-center gap-2">
                <User className="w-4 h-4 text-brand-muted" /> Personal Details
              </h3>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5">
                  About You / Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="3"
                  placeholder="Share a short note about your learning goals..."
                  className="w-full px-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/20"
                />
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4 pt-6 border-t border-white/60">
              <h3 className="text-sm font-bold text-brand-black flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-muted" /> Change Password
              </h3>
              <p className="text-[11px] text-brand-muted">
                Leave password fields blank if you do not wish to change your password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-2xl glass-card border border-white/80 text-xs sm:text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-black/20"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-brand-black text-white text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Profile Settings'}
              </button>

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </form>
        </div>
      </main>

      <BottomNavigation />
    </LiquidBackground>
  );
};

export default Profile;

