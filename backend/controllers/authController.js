const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');
const { getPresignedViewUrl, deleteMediaObject } = require('../services/s3Service');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // SECURITY: Always enforce student role on public registration
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'student', // Client input is strictly ignored
      isActive: true,
    });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate student or admin & get token
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Log out user & clear cookie
 * @access  Public
 */
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user profile
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let avatarUrl = null;
    if (user.avatar) {
      avatarUrl = await getPresignedViewUrl(user.avatar, { expiresIn: 86400 });
    }
    const userObj = user.toJSON();
    userObj.avatarUrl = avatarUrl;

    return res.status(200).json({
      success: true,
      user: userObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
    });
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile & password
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, bio, currentPassword, newPassword, avatarKey, contactInfo } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();

    // If updating teacher contact information
    if (contactInfo && typeof contactInfo === 'object') {
      user.contactInfo = {
        phone: contactInfo.phone !== undefined ? contactInfo.phone.trim() : (user.contactInfo?.phone || ''),
        email: contactInfo.email !== undefined ? contactInfo.email.trim() : (user.contactInfo?.email || ''),
        whatsapp: contactInfo.whatsapp !== undefined ? contactInfo.whatsapp.trim() : (user.contactInfo?.whatsapp || ''),
        telegram: contactInfo.telegram !== undefined ? contactInfo.telegram.trim() : (user.contactInfo?.telegram || ''),
        message: contactInfo.message !== undefined ? contactInfo.message.trim() : (user.contactInfo?.message || ''),
      };
    }

    // If updating avatar via S3
    const newAvatarKey = avatarKey !== undefined ? avatarKey : req.body.avatar;
    if (newAvatarKey !== undefined && newAvatarKey !== user.avatar) {
      if (user.avatar) {
        await deleteMediaObject(user.avatar);
        console.log(`🗑️ Deleted old user avatar from S3: ${user.avatar}`);
      }
      user.avatar = newAvatarKey;
    }

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
      }

      user.password = newPassword;
    }

    await user.save();

    let avatarUrl = null;
    if (user.avatar) {
      avatarUrl = await getPresignedViewUrl(user.avatar, { expiresIn: 86400 });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        avatarUrl,
        contactInfo: user.contactInfo,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile.',
    });
  }
};

/**
 * @route   GET /api/auth/teacher-contact
 * @desc    Get configured instructor contact details for students
 * @access  Public
 */
const getTeacherContact = async (req, res) => {
  try {
    const adminUser = await User.findOne({ role: 'admin' }).select('name email avatar bio contactInfo');
    if (!adminUser) {
      return res.status(200).json({
        success: true,
        contact: {
          name: 'Lead Instructor',
          email: 'admin@mycourse.local',
          phone: '',
          whatsapp: '',
          telegram: '',
          message: 'Please contact your teacher with your registered email to get course access.',
          avatarUrl: null,
        },
      });
    }

    let avatarUrl = null;
    if (adminUser.avatar) {
      avatarUrl = await getPresignedViewUrl(adminUser.avatar, { expiresIn: 86400 });
    }

    return res.status(200).json({
      success: true,
      contact: {
        name: adminUser.name,
        email: adminUser.contactInfo?.email || adminUser.email,
        phone: adminUser.contactInfo?.phone || '',
        whatsapp: adminUser.contactInfo?.whatsapp || adminUser.contactInfo?.phone || '',
        telegram: adminUser.contactInfo?.telegram || '',
        message:
          adminUser.contactInfo?.message ||
          'Welcome to MyCourse! Please message me on WhatsApp or email with your registered email address to assign your personalized course modules.',
        avatarUrl,
      },
    });
  } catch (error) {
    console.error('Get Teacher Contact Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve instructor contact details.',
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  getTeacherContact,
};

