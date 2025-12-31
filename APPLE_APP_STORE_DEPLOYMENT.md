# 🍎 Apple App Store Deployment Guide

Complete guide to publishing your EduFeed mobile app to the Apple App Store.

## 📋 Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Apple Developer Account** ($99/year)
  - Sign up at: https://developer.apple.com/programs/
  - Processing time: 24-48 hours

- [ ] **Mac Computer** (required for iOS builds)
  - MacOS 12.0 or later recommended
  - Xcode 14+ installed

- [ ] **App Information Ready**
  - App name (unique in App Store)
  - App description
  - Keywords for search
  - Privacy policy URL
  - Support URL
  - Marketing URL (optional)

- [ ] **Visual Assets**
  - App icon (1024x1024px)
  - Screenshots (various sizes for different devices)
  - App preview videos (optional but recommended)

## 🚀 Step-by-Step Deployment

### Phase 1: Apple Developer Setup (Day 1)

#### 1. Join Apple Developer Program

```bash
# Cost: $99/year
# URL: https://developer.apple.com/programs/enroll/
```

**Steps:**
1. Go to https://developer.apple.com/programs/
2. Click "Enroll"
3. Sign in with your Apple ID
4. Complete enrollment (requires payment)
5. Wait 24-48 hours for approval

#### 2. Create App Store Connect Record

1. Go to https://appstoreconnect.apple.com/
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: EduFeed (or your chosen name)
   - **Primary Language**: English
   - **Bundle ID**: Create new (e.g., `com.yourdomain.edufeed`)
   - **SKU**: Unique identifier (e.g., `edufeed-001`)
   - **User Access**: Full Access

#### 3. Create Bundle Identifier

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click "+" to add new identifier
3. Select "App IDs"
4. Choose "App" type
5. Fill in:
   - **Description**: EduFeed Mobile App
   - **Bundle ID**: `com.yourdomain.edufeed` (explicit)
   - **Capabilities**:
     - ✅ Push Notifications (if using)
     - ✅ Sign in with Apple (if using)
     - ✅ Associated Domains (if using deep links)

### Phase 2: Configure Your Expo/React Native App (Day 1-2)

#### 1. Update app.json Configuration

Navigate to your mobile app directory:

```bash
cd edufeed-mobile
```

Update `app.json` or `app.config.js`:

```json
{
  "expo": {
    "name": "EduFeed",
    "slug": "edufeed",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourdomain.edufeed",
      "buildNumber": "1",
      "icon": "./assets/icon-ios.png",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Allow EduFeed to access your photos to upload documents",
        "NSCameraUsageDescription": "Allow EduFeed to use your camera to scan documents",
        "NSMicrophoneUsageDescription": "Allow EduFeed to record audio for notes"
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourdomain.edufeed",
      "versionCode": 1
    },
    "plugins": [
      "expo-router"
    ],
    "scheme": "edufeed",
    "extra": {
      "apiUrl": "https://your-production-api.com",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

#### 2. Create App Icons and Splash Screens

**Required Assets:**

```bash
edufeed-mobile/assets/
├── icon.png           # 1024x1024px (App Icon)
├── icon-ios.png       # 1024x1024px (iOS specific if different)
├── splash.png         # 1284x2778px (Splash screen)
├── adaptive-icon.png  # 1024x1024px (Android)
└── favicon.png        # 48x48px (Web)
```

**Quick Generate Icons:**

```bash
# Install icon generator
npm install -g expo-cli

# Generate all required sizes
npx expo-optimize
```

Or use online tools:
- https://www.appicon.co/
- https://icon.kitchen/

#### 3. Set Up EAS (Expo Application Services)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure
```

This creates `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

### Phase 3: Build for iOS (Day 2-3)

#### 1. Create Production Build

```bash
cd edufeed-mobile

# Build for iOS (this will take 10-20 minutes)
eas build --platform ios --profile production
```

**What happens:**
1. Code is uploaded to Expo servers
2. App is built in the cloud (no Mac needed for this step!)
3. You get a download link for the `.ipa` file

**Important:**
- First build will ask you to create credentials (certificates)
- Let EAS handle this automatically (recommended)
- EAS will create:
  - Distribution Certificate
  - Provisioning Profile
  - Push Notification Key (if needed)

#### 2. Download the Build

```bash
# After build completes, download the .ipa file
# Or download from: https://expo.dev/accounts/[username]/projects/edufeed/builds
```

### Phase 4: Prepare App Store Listing (Day 3)

#### 1. App Information

Go to App Store Connect → Your App → App Information:

- **Name**: EduFeed
- **Subtitle**: AI-Powered Study Assistant (max 30 characters)
- **Category**:
  - Primary: Education
  - Secondary: Productivity
- **Content Rights**: Check if it contains third-party content

#### 2. Pricing and Availability

- **Price**: Free (or set pricing)
- **Availability**: All countries or select specific ones
- **Pre-orders**: Optional

#### 3. App Privacy

You MUST fill out the privacy questionnaire:

**Data Collection:**
- [ ] Email address (for authentication)
- [ ] Name (for user profile)
- [ ] User content (documents, notes, flashcards)
- [ ] Device ID (for analytics)
- [ ] Usage data (for analytics)

**Privacy Policy URL Required:**
Create a privacy policy and host it. Example template:

```markdown
# Privacy Policy for EduFeed

Last updated: [Date]

## Information We Collect
- Email address and name (for account creation)
- Documents and study materials you upload
- Learning progress and quiz results

## How We Use Your Information
- To provide personalized learning experience
- To generate AI-powered study materials
- To track your learning progress

## Data Storage
- Your data is stored securely on our servers
- We use Supabase for database hosting
- We do not sell your personal information

## Third-Party Services
- Cloudflare Workers (for AI features)
- Supabase (for data storage)
- Google OAuth (for authentication)

## Contact
Email: support@edufeed.com
```

Host this on your website, e.g., `https://yourdomain.com/privacy`

#### 4. Screenshots (REQUIRED)

You need screenshots for:

**iPhone 6.7" Display (iPhone 14 Pro Max)** - REQUIRED
- 1290 x 2796 pixels
- 3-10 screenshots

**iPhone 6.5" Display (iPhone 11 Pro Max, XS Max)**
- 1242 x 2688 pixels
- 3-10 screenshots

**iPhone 5.5" Display (iPhone 8 Plus)**
- 1242 x 2208 pixels
- 3-10 screenshots

**iPad Pro (12.9-inch)** - If supporting iPad
- 2048 x 2732 pixels
- 3-10 screenshots

**How to Create Screenshots:**

Option 1: Use iOS Simulator
```bash
# Start iOS simulator
npx expo start --ios

# Take screenshots:
# CMD + S in simulator
# Or use: CMD + Shift + 4 to capture specific area
```

Option 2: Use Real Device
- Run app on your iPhone
- Take screenshots
- Transfer to Mac via AirDrop

Option 3: Use Screenshot Tools
- https://www.shotbot.io/ (generates all sizes)
- https://appure.io/ (mockup generator)

**Screenshot Tips:**
1. Show key features:
   - Home screen
   - Chat with document
   - Flashcards
   - Study guide
   - Quiz screen
2. Add text overlays explaining features
3. Use consistent branding
4. Show the app in action

#### 5. App Description

**App Store Description (max 4000 characters):**

```markdown
Transform your learning with EduFeed - the AI-powered study assistant that turns any document into interactive study materials.

FEATURES:

📚 SMART STUDY TOOLS
• Upload PDFs, articles, or notes
• Get AI-generated flashcards instantly
• Create comprehensive study guides
• Take quizzes to test your knowledge

💬 CHAT WITH YOUR DOCUMENTS
• Ask questions about your study materials
• Get instant answers with source citations
• Understand complex topics easily

🃏 INTELLIGENT FLASHCARDS
• AI creates personalized flashcards from your content
• Spaced repetition system for better retention
• Track your learning progress
• Study offline anytime

📖 COMPREHENSIVE STUDY GUIDES
• Automatic topic extraction
• Timeline views for historical content
• Key vocabulary with definitions
• Practice questions

🎯 ADAPTIVE LEARNING
• Personalized quiz difficulty
• Track your strengths and weaknesses
• Study recommendations
• Progress analytics

🔒 PRIVACY FIRST
• Your data stays private
• Secure cloud storage
• No ads, ever

PERFECT FOR:
• Students (high school, college, graduate)
• Professionals learning new skills
• Lifelong learners
• Anyone studying for exams

START LEARNING SMARTER TODAY!
Download EduFeed and experience the future of studying.

---
Powered by open-source AI (Llama 3.3)
```

**Keywords (max 100 characters):**
```
study,flashcards,education,learning,ai,quiz,notes,pdf,exam,student
```

**Promotional Text (max 170 characters - appears above description):**
```
Turn any document into flashcards, quizzes, and study guides with AI. Chat with your PDFs and learn smarter, not harder.
```

### Phase 5: Submit for Review (Day 4)

#### 1. Upload Build via EAS

```bash
# Submit to App Store
eas submit --platform ios --profile production
```

Or manually upload:
1. Download `.ipa` from EAS build
2. Open Transporter app (Mac App Store)
3. Drag and drop `.ipa` file
4. Click "Deliver"

#### 2. Create Version in App Store Connect

1. Go to App Store Connect → Your App
2. Click "+" next to "iOS App"
3. Select the build you uploaded
4. Fill in:
   - **What's New in This Version**:
     ```
     Initial release of EduFeed!

     • Upload and study any document
     • AI-powered flashcard generation
     • Interactive quizzes
     • Chat with your study materials
     • Track your learning progress
     ```
   - **Screenshots**: Upload all required sizes
   - **App Preview Video**: Optional but recommended

#### 3. App Review Information

- **Sign-in required?**: Yes (if you require login)
  - Provide demo account credentials
  - Email: demo@edufeed.com
  - Password: [secure password]

- **Demo Account Notes**:
  ```
  This demo account has sample content pre-loaded:
  - Sample PDFs
  - Flashcard decks
  - Study guides

  You can also create a new account to test the full flow.
  ```

- **Contact Information**:
  - First Name: [Your Name]
  - Last Name: [Your Last Name]
  - Phone: [Your Phone]
  - Email: [Your Email]

- **Notes**:
  ```
  EduFeed uses AI to help students learn more effectively.

  Key features to test:
  1. Upload a PDF document
  2. Generate flashcards from the document
  3. Chat with the document using AI
  4. Take a quiz

  All AI features are powered by Cloudflare Workers and Llama 3.3 (open-source).
  ```

#### 4. Submit for Review

1. Check all information is complete
2. Click "Add for Review"
3. Click "Submit to App Review"

**Review Time:** Typically 24-48 hours, sometimes up to 1 week

### Phase 6: Handle App Review (Day 5-7)

#### Common Rejection Reasons & Solutions

**1. Missing Demo Account**
- ✅ Solution: Provide working demo credentials

**2. Crashes on Launch**
- ✅ Solution: Test thoroughly before submission
- Run on physical device, not just simulator

**3. Incomplete Metadata**
- ✅ Solution: Fill out all required fields
- Add privacy policy URL
- Complete privacy questionnaire

**4. Guideline 4.2 (Minimum Functionality)**
- ✅ Solution: Make sure app has substantial functionality
- Your app should be fine (has flashcards, quizzes, chat, study guides)

**5. Guideline 2.1 (App Completeness)**
- ✅ Solution: Remove any "Coming Soon" or placeholder content

**6. Privacy Issues**
- ✅ Solution: Clearly explain data usage
- Implement privacy policy
- Be transparent about AI usage

#### If Rejected:

1. **Read rejection message carefully**
2. **Fix the issues**
3. **Respond in Resolution Center** (explain what you fixed)
4. **Resubmit** (usually faster review second time)

### Phase 7: Post-Approval (Day 7+)

#### 1. App Goes Live!

Once approved:
- App appears on App Store within 24 hours
- You can control release timing

Options:
- **Automatic Release**: Goes live immediately upon approval
- **Manual Release**: You click "Release" when ready
- **Scheduled Release**: Set a specific date/time

#### 2. Monitor Initial Performance

- **Downloads**: Check App Store Connect analytics
- **Crashes**: Monitor in App Store Connect → TestFlight
- **Reviews**: Respond to user reviews (very important!)
- **Ratings**: Encourage happy users to rate

#### 3. Set Up App Store Optimization (ASO)

- Monitor keyword rankings
- A/B test screenshots
- Update description based on user feedback
- Respond to ALL reviews (especially negative ones)

## 📱 Testing Before Submission

### 1. Internal Testing (TestFlight)

```bash
# Create beta build
eas build --platform ios --profile preview

# Add internal testers in App Store Connect
# They can install via TestFlight app
```

**Benefits:**
- Test on real devices
- Get feedback from team
- Find bugs before public release

### 2. External Testing (Public Beta)

- Add up to 10,000 external testers
- Requires App Review (lighter than full review)
- Great for beta testing community

### 3. Pre-Launch Checklist

- [ ] Test on multiple iOS versions (iOS 14, 15, 16, 17)
- [ ] Test on different devices (iPhone SE, iPhone 14, iPad)
- [ ] Test authentication flow
- [ ] Test document upload (PDF, text)
- [ ] Test AI features (chat, flashcards, study guides)
- [ ] Test offline functionality
- [ ] Test push notifications (if implemented)
- [ ] Check for memory leaks
- [ ] Check app size (< 200MB recommended)
- [ ] Verify all links work
- [ ] Test subscription/payment (if applicable)

## 💰 Pricing Options

### Free App (Recommended to Start)

- **Price**: Free
- **Revenue**: In-app purchases or subscriptions
- **Benefits**: More downloads, easier user acquisition

### Paid App

- **Price**: $0.99 - $9.99
- **Revenue**: Upfront payment
- **Benefits**: Immediate revenue per download

### Freemium Model (Recommended)

```
Free Tier:
- 5 AI generations per day
- 50 flashcards
- Basic features

Premium ($4.99/month or $29.99/year):
- Unlimited AI generations
- Unlimited flashcards
- Advanced analytics
- Priority support
- Export features
```

Implement with:
- RevenueCat (recommended)
- Apple StoreKit

## 🚨 Important Considerations

### 1. AI Disclosure

Apple requires disclosure of AI usage:

In app description:
```
This app uses AI to generate study materials. AI-generated content
may contain errors. Please verify important information.
```

### 2. Content Moderation

If users can create public content:
- Implement content moderation
- Add reporting mechanism
- Have terms of service

### 3. Data Retention

Clear policy on:
- How long you store user data
- How users can delete their data
- GDPR compliance (if applicable)

### 4. Export Compliance

In App Store Connect, you'll be asked about encryption:

- If you use HTTPS only → Select "No"
- If you have additional encryption → May need export compliance

For most apps: **"No" is correct answer**

## 📊 Post-Launch Strategy

### Week 1

- [ ] Monitor for crashes daily
- [ ] Respond to all reviews
- [ ] Fix critical bugs immediately
- [ ] Track key metrics (downloads, DAU, retention)

### Month 1

- [ ] Analyze user behavior
- [ ] Plan feature updates
- [ ] A/B test app store assets
- [ ] Build email list

### Ongoing

- [ ] Regular updates (every 2-4 weeks)
- [ ] Add new features based on feedback
- [ ] Improve based on analytics
- [ ] Build community

## 🔧 Quick Commands Reference

```bash
# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Create preview build (TestFlight)
eas build --platform ios --profile preview

# Check build status
eas build:list

# View credentials
eas credentials

# Update app.json
nano app.json  # or use your editor
```

## 📞 Support Resources

- **App Store Connect**: https://appstoreconnect.apple.com/
- **Developer Portal**: https://developer.apple.com/account/
- **App Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Expo Docs**: https://docs.expo.dev/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Apple Support**: https://developer.apple.com/contact/

---

## ✅ Final Checklist Before Submission

- [ ] Apple Developer account active ($99 paid)
- [ ] Bundle ID created
- [ ] App Store Connect record created
- [ ] app.json configured correctly
- [ ] All assets created (icon, screenshots, splash)
- [ ] Privacy policy hosted and URL added
- [ ] App description written
- [ ] Keywords optimized
- [ ] Build created with EAS
- [ ] Build uploaded to App Store Connect
- [ ] All metadata filled out
- [ ] Privacy questionnaire completed
- [ ] Demo account created (if login required)
- [ ] App tested on real device
- [ ] Submitted for review

---

**Estimated Timeline:**
- Day 1: Apple Developer setup + app configuration
- Day 2-3: Build creation + testing
- Day 3-4: Metadata + screenshots
- Day 4: Submission
- Day 5-7: Review process
- Day 7-8: **LIVE ON APP STORE!** 🎉

**Total Cost:**
- Apple Developer: $99/year
- Expo EAS: Free tier available (sufficient for small apps)
- Optional: Design tools, ASO tools ($0-50/month)

Good luck with your launch! 🚀
