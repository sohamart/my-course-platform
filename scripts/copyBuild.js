const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDist = path.join(rootDir, 'frontend', 'dist');
const backendPublic = path.join(rootDir, 'backend', 'public');

console.log('----------------------------------------------------');
console.log('📦 MyCourse - Frontend Production Build Synchronizer');
console.log('----------------------------------------------------');
console.log(`Source:      ${frontendDist}`);
console.log(`Destination: ${backendPublic}`);

// 1. Verify source frontend/dist exists and contains index.html
if (!fs.existsSync(frontendDist)) {
  console.error('❌ Error: frontend/dist does not exist. Run "npm run build --prefix frontend" first.');
  process.exit(1);
}

const sourceIndexHtml = path.join(frontendDist, 'index.html');
if (!fs.existsSync(sourceIndexHtml)) {
  console.error('❌ Error: frontend/dist/index.html not found. Frontend build appears incomplete.');
  process.exit(1);
}

// 2. Safely clean existing backend/public directory
if (fs.existsSync(backendPublic)) {
  console.log('🧹 Cleaning previous backend/public files...');
  fs.rmSync(backendPublic, { recursive: true, force: true });
}

// 3. Recreate clean backend/public directory
fs.mkdirSync(backendPublic, { recursive: true });

// 4. Copy frontend/dist contents to backend/public cross-platform
console.log('📋 Copying production artifacts to backend/public...');
fs.cpSync(frontendDist, backendPublic, {
  recursive: true,
  filter: (src) => {
    const basename = path.basename(src);
    // Exclude source maps, env files, or node_modules if any exist in dist
    if (basename.startsWith('.env') || basename === 'node_modules') {
      return false;
    }
    return true;
  },
});

// 5. Verify the copy operation
const targetIndexHtml = path.join(backendPublic, 'index.html');
if (!fs.existsSync(targetIndexHtml)) {
  console.error('❌ Verification failed: backend/public/index.html was not created.');
  process.exit(1);
}

// 6. Report summary
const copiedFiles = fs.readdirSync(backendPublic);
console.log('✅ Frontend production artifacts successfully copied to backend/public:');
copiedFiles.forEach((file) => {
  const stat = fs.statSync(path.join(backendPublic, file));
  const isDir = stat.isDirectory();
  console.log(`   - ${file}${isDir ? '/' : ''}`);
});
console.log('----------------------------------------------------');
console.log('🎉 Stage 2 Complete: Production frontend is ready in backend/public');
console.log('----------------------------------------------------');

