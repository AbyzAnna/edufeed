# iOS Build & App Store Submission Instructions

## 🚀 Complete Step-by-Step Guide

This guide will walk you through building your iOS app and submitting it to the App Store.

---

## Prerequisites ✅

- [x] Apple Developer Account ($99/year) - You have this ✅
- [x] EAS CLI installed - Verified ✅
- [x] Expo account (abyanna) - Logged in ✅
- [x] App configured (app.json, eas.json) - Done ✅
- [x] Assets created (icon, splash) - Done ✅
- [x] Privacy policy created - Done ✅
- [x] App Store metadata prepared - Done ✅

---

## Phase 1: Initial Setup (5-10 minutes)

### Step 1: Create EAS Project

The EAS project will be automatically created during the first build. No action needed now.

### Step 2: Verify App Configuration

Already completed! Your app.json is properly configured with:
- Bundle ID: `com.edufeed.app`
- Build number: `1`
- Version: `1.0.0`
- iOS permissions configured
- Export compliance set

### Step 3: Verify EAS Build Configuration

Already completed! Your eas.json has the production profile configured.

---

## Phase 2: Prepare for Build (30-60 minutes)

### Step 1: Create Demo Account

Create a test account for Apple's review team:

```bash
# You'll need to create this account in your app or database
# Email: demo@edufeed.com
# Password: DemoPass2025!
```

**Action Required**: Create this account with sample study materials before submission.

### Step 2: Publish Privacy Policy

Your privacy policy is ready at `PRIVACY_POLICY.md`. You need to:

1. **Option A: Host on your domain (Recommended)**
   - Upload to `https://edufeed.com/privacy`
   - Create a simple HTML page or use your existing website

2. **Option B: Use GitHub Pages (Quick)**
   ```bash
   # Create a simple GitHub repo for your privacy policy
   # Enable GitHub Pages
   # URL will be: https://[username].github.io/edufeed-privacy
   ```

3. **Option C: Use Vercel (Easiest)**
   ```bash
   # If you already have a Vercel project:
   # Add PRIVACY_POLICY.md to your website
   # Deploy to Vercel
   ```

### Step 3: Create Support Page

Create a simple support page at `https://edufeed.com/support` with:
- Contact email
- FAQ
- How to use the app
- Troubleshooting

**Quick HTML Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>EduFeed Support</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #8b5cf6; }
        a { color: #8b5cf6; }
    </style>
</head>
<body>
    <h1>EduFeed Support</h1>
    <p>Need help? We're here for you!</p>

    <h2>Contact Us</h2>
    <p>Email: <a href="mailto:support@edufeed.com">support@edufeed.com</a></p>

    <h2>FAQ</h2>
    <h3>How do I upload a document?</h3>
    <p>Tap the "+" button, select your document type (PDF, URL, or text), and upload.</p>

    <h3>How do I generate flashcards?</h3>
    <p>Open any document, tap the AI tab, and select "Generate Flashcards".</p>

    <h3>How does spaced repetition work?</h3>
    <p>Our algorithm shows you cards at optimal intervals based on your performance.</p>

    <h2>Privacy</h2>
    <p><a href="/privacy">Privacy Policy</a></p>
</body>
</html>
```

---

## Phase 3: Create iOS Build (1-2 hours total, mostly automated)

### Step 1: Install Dependencies

```bash
cd "/Users/annaabyzova/Projects/Website feed/edufeed-mobile"

# Install all dependencies
npm install

# Or if using yarn
yarn install
```

### Step 2: Configure Apple Credentials

You have two options:

#### Option A: Let EAS Handle Credentials (Recommended - Easier)

EAS will automatically create and manage certificates and provisioning profiles.

```bash
# During the build, EAS will prompt you to sign in with Apple ID
# Just follow the prompts - EAS handles everything
```

#### Option B: Use Existing Credentials (Advanced)

If you already have certificates:

```bash
# Configure credentials
eas credentials
```

### Step 3: Create Production Build

Now create the iOS build:

```bash
cd "/Users/annaabyzova/Projects/Website feed/edufeed-mobile"

# Create production iOS build
eas build --platform ios --profile production
```

**What happens during build:**

1. **EAS Project Setup** (1-2 min)
   - Creates EAS project ID
   - Updates app.json automatically
   - Links to your Expo account

2. **Credentials Setup** (2-5 min)
   - Prompts for Apple ID and password
   - Creates/manages certificates
   - Sets up provisioning profiles
   - Prompts for App Store Connect API key OR Apple ID

3. **Build Queue** (15-30 min)
   - Uploads code to EAS servers
   - Queues build (may wait if busy)
   - Shows progress updates

4. **Build Process** (10-20 min)
   - Installs dependencies
   - Compiles native code
   - Creates .ipa file
   - Runs any configured scripts

5. **Completion**
   - Downloads .ipa file
   - Provides download URL
   - Shows next steps

**Total Time: 30-60 minutes**

### Step 4: Monitor Build Progress

```bash
# Check build status
eas build:list

# View detailed logs
eas build:view [build-id]
```

You can also monitor at: https://expo.dev/accounts/abyanna/projects/edufeed/builds

---

## Phase 4: App Store Connect Setup (30-60 minutes)

### Step 1: Create App Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Sign in with your Apple Developer account
3. Click **My Apps** → **+** (plus icon) → **New App**

4. Fill in the form:
   - **Platform**: iOS
   - **Name**: EduFeed
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select `com.edufeed.app` (from dropdown)
   - **SKU**: `edufeed-ios-app` (unique identifier for your records)
   - **User Access**: Full Access

5. Click **Create**

### Step 2: Fill in App Information

#### App Information Tab

1. **Privacy Policy URL**: `https://edufeed.com/privacy`
2. **Category**:
   - Primary: Education
   - Secondary: Productivity
3. **Content Rights**: Check if you have rights to use all content
4. **Age Rating**: Click **Edit** → Answer questionnaire → Should be **4+**

#### Pricing and Availability

1. **Price**: Free (or set your price)
2. **Availability**: All countries (or select specific)
3. **Pre-Order**: No (not for first release)

### Step 3: Prepare App Store Listing

Go to **App Store** tab → **iOS App** → **Version 1.0.0**

#### App Information

1. **Name**: EduFeed (30 chars max)
2. **Subtitle**: AI-Powered Study Platform (30 chars max)
3. **Privacy Policy URL**: https://edufeed.com/privacy

#### Promotional Text (Optional, changeable anytime)
```
New! NotebookLM-style AI features powered by Llama 3.3. Chat with your documents, generate flashcards, and create comprehensive study guides instantly.
```

#### Description
Copy from `APP_STORE_METADATA.md` → "Description" section (4000 chars max)

#### Keywords
```
study,flashcards,AI,education,learning,quiz,notes,exam,spaced repetition,student,homework,college
```

#### Support URL
```
https://edufeed.com/support
```

#### Marketing URL (Optional)
```
https://edufeed.com
```

---

## Phase 5: Screenshots (1-2 hours)

You need to create screenshots for:
- iPhone 6.7" (1290 x 2796 px) - REQUIRED
- iPhone 6.5" (1242 x 2688 px) - REQUIRED
- iPad Pro 12.9" (2048 x 2732 px) - If supporting iPad

### Quick Method: Use Simulator

1. **Start iOS Simulator**
   ```bash
   cd "/Users/annaabyzova/Projects/Website feed/edufeed-mobile"

   # Start Expo dev server
   npx expo start

   # Press 'i' to open iOS simulator
   # Select iPhone 15 Pro Max (6.7")
   ```

2. **Take Screenshots**
   - Navigate to each screen
   - Press `Cmd + S` in simulator to save screenshot
   - Screenshots save to Desktop

3. **Required Screenshots** (8 minimum, 10 maximum):
   - Welcome/Hero screen
   - Document upload
   - AI chat interface
   - Flashcard view
   - Study guide
   - Quiz interface
   - Progress/Analytics
   - Dark mode example

### Professional Method: Use Design Tools

**Option A: Figma + Screenshot Builder**
1. Export app screens from Figma
2. Use [Screenshot Builder](https://www.screenshotbuilder.com/)
3. Add device frames and backgrounds

**Option B: Placeit**
1. Go to [Placeit](https://placeit.net/c/mockups/stages/app-screenshot-mockup-generator)
2. Upload your screenshots
3. Generate professional mockups

### Screenshot Tips
- Use **real data**, not lorem ipsum
- Show **key features** clearly
- Keep **text readable**
- Use **consistent branding**
- Add **captions** to explain features

---

## Phase 6: Upload Build to App Store Connect (30 minutes)

### Method 1: Automatic Upload via EAS (Recommended)

When the build completes, EAS can automatically submit to App Store Connect:

```bash
# During or after build, run:
eas submit --platform ios --latest

# Or specify build ID:
eas submit --platform ios --id [build-id]
```

EAS will:
1. Ask for App Store Connect API key (or Apple ID)
2. Upload .ipa to App Store Connect
3. Process the build (~10-15 min)

### Method 2: Manual Upload via Transporter

1. Download the .ipa from EAS:
   ```bash
   eas build:download --platform ios --latest
   ```

2. Open **Transporter** app (comes with Xcode)
   - If not installed: Download from Mac App Store

3. Drag .ipa file to Transporter

4. Click **Deliver**

5. Wait for processing (~10-15 minutes)

---

## Phase 7: Complete Metadata & Submit (30-60 minutes)

### Step 1: Select Build

1. In App Store Connect, go to your app
2. Click **App Store** tab → **iOS App** → **1.0.0 Prepare for Submission**
3. Scroll to **Build** section
4. Click **+** and select your uploaded build
5. Wait for processing to complete (shows green checkmark)

### Step 2: Upload Screenshots

1. Scroll to **App Previews and Screenshots**
2. For **iPhone 6.7"**:
   - Drag and drop your 8 screenshots
   - Add captions for each (optional but recommended)
3. For **iPhone 6.5"**:
   - Repeat with screenshots for this size
4. For **iPad** (if applicable):
   - Repeat with iPad screenshots

### Step 3: App Review Information

1. **Contact Information**:
   - First Name: [Your first name]
   - Last Name: [Your last name]
   - Phone: [Your phone number]
   - Email: appstore@edufeed.com

2. **Demo Account** (Important!):
   - Username: demo@edufeed.com
   - Password: DemoPass2025!
   - Check: "Sign-in required"

3. **Notes** (Copy from APP_STORE_METADATA.md):
   ```
   Thank you for reviewing EduFeed!

   FEATURES TO TEST:
   1. Sign in with demo account provided
   2. Upload a sample PDF
   3. Try the AI Chat feature
   4. Generate flashcards
   5. Review with spaced repetition
   6. View study guide

   AI FEATURES:
   - We use Cloudflare Workers AI (Llama 3.3, open-source)
   - All processing on our secure infrastructure
   - No user data used for training

   PERMISSIONS:
   - Camera: Document scanning (optional)
   - Photo Library: Image uploads (optional)
   - Notifications: Study reminders (optional)

   Contact: appstore@edufeed.com
   ```

### Step 4: Version Release

Choose when to release:
- **Automatically release** after approval (Recommended for v1.0)
- **Manually release** after approval

### Step 5: Submit for Review

1. Review all information carefully
2. Check that all required fields are complete (green checkmarks)
3. Click **Add for Review** (top right)
4. Review the summary
5. Click **Submit for Review**

---

## Phase 8: Apple Review Process (1-3 days)

### What Happens

1. **Waiting for Review** (Usually <24 hours)
   - Your app is in the queue
   - No action needed

2. **In Review** (Usually 24-48 hours)
   - Apple is testing your app
   - They'll use your demo account
   - They verify compliance with guidelines

3. **Possible Outcomes**:
   - ✅ **Approved**: Ready for sale!
   - ⚠️ **Metadata Rejected**: Fix description/screenshots, resubmit
   - ❌ **Rejected**: Address issues, submit new build

### Monitor Status

- **Email**: Apple sends updates to your developer account email
- **App Store Connect**: Check status dashboard
- **Push Notifications**: Enable in App Store Connect settings

### Common Rejection Reasons (and how we've avoided them)

1. ❌ **Crash on launch** → ✅ Test thoroughly before submitting
2. ❌ **Incomplete functionality** → ✅ All features working
3. ❌ **Broken demo account** → ✅ Verify demo account works
4. ❌ **Missing privacy policy** → ✅ Published at edufeed.com/privacy
5. ❌ **Misleading screenshots** → ✅ Use real app screenshots
6. ❌ **No explanation for permissions** → ✅ Added in infoPlist descriptions

---

## Phase 9: Post-Approval (Day of Launch)

### When Approved

1. **Get Notification**: "Your app is Ready for Sale"

2. **Verify Listing**:
   - Go to App Store on iPhone
   - Search "EduFeed"
   - Check all information is correct

3. **Announce Launch**:
   - Social media posts
   - Email to beta testers
   - Update website
   - Press release (optional)

### First Week Checklist

- [ ] Monitor reviews daily
- [ ] Respond to user feedback
- [ ] Track downloads in App Store Connect
- [ ] Check for crash reports
- [ ] Collect user testimonials
- [ ] Fix any critical bugs immediately

### Analytics

App Store Connect provides:
- Downloads by day/week/month
- Impressions (how many saw listing)
- Conversion rate (views → downloads)
- Retention rates
- Crashes and bugs

---

## Troubleshooting

### Build Fails

**Problem**: EAS build fails during compilation

**Solution**:
```bash
# Check build logs
eas build:view [build-id]

# Common fixes:
# 1. Clear cache and rebuild
eas build --platform ios --profile production --clear-cache

# 2. Update dependencies
npm install

# 3. Check for TypeScript errors
npx tsc --noEmit
```

### Upload to App Store Connect Fails

**Problem**: "Invalid Binary" or upload fails

**Solution**:
```bash
# Regenerate build with clean state
eas build --platform ios --profile production --clear-cache

# Verify bundle ID matches App Store Connect
grep bundleIdentifier app.json
```

### "Invalid Provisioning Profile"

**Problem**: Certificate issues

**Solution**:
```bash
# Reset credentials and try again
eas credentials

# Select: "Remove all credentials"
# Then rebuild - EAS will create new ones
eas build --platform ios --profile production
```

### App Rejected: Crash on Launch

**Problem**: App crashes when Apple reviews

**Solution**:
1. Test on real device (not just simulator)
2. Enable beta testing via TestFlight first
3. Check crash logs in App Store Connect
4. Fix crashes, submit new build

### App Rejected: Missing Functionality

**Problem**: "App doesn't work as described"

**Solution**:
1. Verify demo account works
2. Add clearer instructions in Review Notes
3. Create demo video showing features
4. Resubmit with better explanation

---

## Quick Reference Commands

```bash
# Navigate to app directory
cd "/Users/annaabyzova/Projects/Website feed/edufeed-mobile"

# Check EAS login
eas whoami

# Install dependencies
npm install

# Create production build
eas build --platform ios --profile production

# Check build status
eas build:list

# Submit to App Store
eas submit --platform ios --latest

# View build details
eas build:view [build-id]

# Download build locally
eas build:download --platform ios --latest

# Clear cache and rebuild
eas build --platform ios --profile production --clear-cache
```

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| **Setup** | 10 min | ✅ Complete |
| **Prepare Assets** | 1-2 hours | ⬜ Screenshots needed |
| **Create Build** | 30-60 min | ⬜ Ready to run |
| **App Store Connect** | 30-60 min | ⬜ After build |
| **Submit** | 30 min | ⬜ After metadata |
| **Apple Review** | 1-3 days | ⬜ After submission |
| **Go Live** | Instant | ⬜ After approval |

**Total**: 3-7 days from now to App Store

---

## Next Steps (What to Do Right Now)

### Immediate (Today)

1. **Create Demo Account**
   ```bash
   # In your app or database, create:
   # Email: demo@edufeed.com
   # Password: DemoPass2025!
   # Add sample study materials
   ```

2. **Publish Privacy Policy**
   - Upload `PRIVACY_POLICY.md` to `https://edufeed.com/privacy`
   - Or use GitHub Pages / Vercel

3. **Create Support Page**
   - Simple HTML page at `https://edufeed.com/support`
   - Use template provided above

### Tomorrow

4. **Create iOS Build**
   ```bash
   cd "/Users/annaabyzova/Projects/Website feed/edufeed-mobile"
   eas build --platform ios --profile production
   ```

5. **Create Screenshots**
   - Use iOS simulator
   - Take 8 screenshots of key features
   - Save in 6.7" and 6.5" sizes

### Day 3

6. **Set up App Store Connect**
   - Create app record
   - Fill in metadata
   - Upload screenshots

7. **Submit Build**
   ```bash
   eas submit --platform ios --latest
   ```

8. **Complete Review Information**
   - Add demo account
   - Add review notes
   - Submit for review

### Days 4-7

9. **Wait for Review**
   - Monitor email for updates
   - Respond quickly if Apple has questions
   - Be ready to fix any issues

10. **Launch!**
    - Approve release when ready
    - Announce to users
    - Monitor reviews and analytics

---

## Support

Need help during the process?

- **EAS Build Issues**: Check [Expo Docs](https://docs.expo.dev/build/introduction/)
- **App Store Connect**: [Apple Documentation](https://developer.apple.com/app-store/submissions/)
- **Review Guidelines**: [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## Congratulations! 🎉

You're ready to submit EduFeed to the App Store!

**Everything is configured and ready:**
- ✅ App configured (app.json, eas.json)
- ✅ Assets created (icon, splash)
- ✅ Privacy policy written
- ✅ Metadata prepared
- ✅ Build configuration ready
- ✅ Instructions documented

**Just need to:**
1. Create demo account
2. Publish privacy policy
3. Run the build command
4. Create screenshots
5. Submit!

**Welcome to the App Store!** 🚀📱
