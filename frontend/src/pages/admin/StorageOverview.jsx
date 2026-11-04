import React, { useEffect, useState } from 'react';
import { HardDrive, Shield, Cloud, FileText, Video, CheckCircle2, Lock } from 'lucide-react';
import api from '../../services/api';
import LiquidBackground from '../../components/effects/LiquidBackground';
import Header from '../../components/layout/Header';
import AdminSidebar from '../../components/layout/AdminSidebar';
import DatabaseErrorAlert from '../../components/common/DatabaseErrorAlert';

const StorageOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStorage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data && res.data.success) {
        setData(res.data);
      } else {
        throw new Error(res.data?.message || 'Database connection error');
      }
    } catch (err) {
      console.error('Failed to load storage info:', err);
      setError(
        err.response?.data?.message ||
          'Not connected to database. Please contact developer.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const stats = data?.stats;
  const s3Status = data?.s3Status;

  return (
    <LiquidBackground fixedLayout>
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-stretch gap-8 overflow-hidden min-h-0">
        <AdminSidebar />

        <main
          data-lenis-prevent
          className="flex-1 min-w-0 h-full overflow-y-auto pr-1 pb-24 space-y-6 scroll-smooth overscroll-contain"
        >
          {/* Database Connection Error Alert */}
          {error && (
            <DatabaseErrorAlert message={error} onRetry={fetchStorage} />
          )}

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
              CLOUD ASSET MANAGEMENT
            </span>
            <h1 className="text-2xl font-extrabold text-brand-black brand-title mt-0.5">
              Storage & AWS S3 Overview
            </h1>
            <p className="text-xs text-brand-muted mt-0.5">
              Monitor private bucket utilization, direct presigned uploads, and streaming security.
            </p>
          </div>

          {/* S3 Status Card */}
          <div className="rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/60">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl glass-lavender border border-white/90 flex items-center justify-center text-indigo-900 shadow-sm">
                  <Cloud className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-brand-black">Private S3 Engine</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${loading ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {loading
                        ? 'Checking status...'
                        : s3Status?.mode === 'production_aws_s3'
                        ? 'AWS S3 Connected'
                        : 'Local Emulation Active'}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted mt-0.5 font-mono break-all">
                    {loading ? 'Connecting to storage backend...' : `Bucket: ${s3Status?.bucketName || 'private-media'} · Region: ${s3Status?.region || 'ap-southeast-2'}`}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold text-brand-muted">Total Consumed</span>
                {loading ? (
                  <div className="h-8 w-24 bg-neutral-200/70 rounded-lg animate-pulse mt-1" />
                ) : (
                  <p className="text-2xl font-extrabold text-brand-black">
                    {stats?.totalStorageMB ?? '0.00'} MB
                  </p>
                )}
              </div>
            </div>

            {/* Asset Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-2xl bg-white/50 border border-white/70 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl glass-lavender flex items-center justify-center text-indigo-900">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-brand-muted font-semibold">Video Lessons</span>
                  {loading ? (
                    <div className="h-5 w-16 bg-neutral-200/70 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-base font-extrabold text-brand-black">
                      {stats?.totalVideosCount ?? 0} files
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/50 border border-white/70 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl glass-mint flex items-center justify-center text-emerald-900">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-brand-muted font-semibold">PDF Notes</span>
                  {loading ? (
                    <div className="h-5 w-20 bg-neutral-200/70 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-base font-extrabold text-brand-black">
                      {stats?.totalNotesCount ?? 0} documents
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/50 border border-white/70 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl glass-iceblue flex items-center justify-center text-sky-900">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-brand-muted font-semibold">Access Policy</span>
                  <p className="text-base font-extrabold text-brand-black">100% Private</p>
                </div>
              </div>
            </div>
          </div>

          {/* S3 Architecture & Production Setup Guide */}
          <div className="rounded-[28px] glass-card p-6 sm:p-8 border border-white/80 shadow-glass space-y-4">
            <h3 className="text-base font-bold text-brand-black flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              AWS S3 Private Media Architecture
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              In MyCourse, media is never stored in public buckets. When students access a lesson, the backend verifies their active enrollment and dynamically signs a 15-to-60 minute presigned GET URL using AWS SDK v3.
            </p>

            <div className="p-4 rounded-2xl bg-brand-lavender/30 border border-brand-lavender text-xs space-y-2">
              <p className="font-bold text-brand-black">To switch to real AWS S3:</p>
              <ol className="list-decimal list-inside space-y-1 text-brand-muted">
                <li>Create an Amazon S3 bucket with "Block all public access" turned ON.</li>
                <li>Create an IAM user with `AmazonS3FullAccess` or a scoped bucket policy.</li>
                <li>
                  Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET_NAME` into <code className="bg-white/80 px-1 py-0.5 rounded font-mono">backend/.env</code>.
                </li>
                <li>Restart the backend. Direct client uploads and secure streams will immediately route through real AWS S3.</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    </LiquidBackground>
  );
};

export default StorageOverview;

