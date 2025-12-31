# 📱 App Store Submission Checklist

## ✅ Completed (Already Done!)

- [x] App configuration (app.json with iOS settings)
- [x] Build configuration (eas.json with production profile)
- [x] App icon created (1024x1024)
- [x] Splash screen configured
- [x] Privacy policy written (PRIVACY_POLICY.md)
- [x] App Store metadata prepared (APP_STORE_METADATA.md)
- [x] Build instructions documented (IOS_BUILD_INSTRUCTIONS.md)
- [x] EAS CLI installed and logged in
- [x] All assets verified and present

---

## 🔴 REQUIRED - Before You Can Submit

### Must Complete Before Building

- [ ] **Create Demo Account**
  - Email: demo@edufeed.com
  - Password: DemoPass2025!
  - Add 2-3 sample documents
  - Create some flashcards
  - Status: ⬜ NOT STARTED

- [ ] **Publish Privacy Policy**
  - Upload PRIVACY_POLICY.md to: https://edufeed.com/privacy
  - Verify URL works in browser
  - Status: ⬜ NOT STARTED

- [ ] **Create Support Page**
  - Upload support.html to: https://edufeed.com/support
  - Include contact email and FAQ
  - Status: ⬜ NOT STARTED

---

## 🟡 REQUIRED - During Submission

### Build & Upload

- [ ] **Create iOS Build**
  ```bash
  cd edufeed-mobile
  eas build --platform ios --profile production
  ```
  - Status: ⬜ NOT STARTED
  - Expected time: 30-60 minutes

- [ ] **Submit to App Store Connect**
  ```bash
  eas submit --platform ios --latest
  ```
  - Status: ⬜ NOT STARTED
  - Expected time: 10-15 minutes

### App Store Connect Setup

- [ ] **Create App Record**
  - Go to App Store Connect
  - Create new iOS app
  - Bundle ID: com.edufeed.app
  - Status: ⬜ NOT STARTED

- [ ] **Create Screenshots**
  - 8 screenshots (iPhone 6.7")
  - 8 screenshots (iPhone 6.5")
  - Status: ⬜ NOT STARTED
  - Expected time: 1-2 hours

- [ ] **Upload Screenshots**
  - Add to App Store Connect
  - Add captions (optional)
  - Status: ⬜ NOT STARTED

- [ ] **Complete Metadata**
  - App description (copy from APP_STORE_METADATA.md)
  - Keywords
  - Support URL: https://edufeed.com/support
  - Privacy URL: https://edufeed.com/privacy
  - Status: ⬜ NOT STARTED

- [ ] **Add Review Information**
  - Demo account credentials
  - Review notes
  - Contact information
  - Status: ⬜ NOT STARTED

- [ ] **Submit for Review**
  - Final check of all information
  - Click "Submit for Review"
  - Status: ⬜ NOT STARTED

---

## 🟢 OPTIONAL - Recommended

- [ ] **Test on Real Device**
  - Use TestFlight for beta testing
  - Test all features work correctly

- [ ] **Create App Preview Video**
  - 15-30 second demo video
  - Professional but not required

- [ ] **Prepare Launch Announcement**
  - Social media posts ready
  - Email template for users
  - Press release (if applicable)

- [ ] **Set Up Analytics**
  - App Store Connect analytics
  - In-app analytics (if applicable)

---

## 📊 Progress Tracker

### Overall Progress: 9/23 Tasks Complete (39%)

**Pre-Build**: 0/3 ⬜⬜⬜
**Build Phase**: 0/2 ⬜⬜
**App Store Connect**: 0/8 ⬜⬜⬜⬜⬜⬜⬜⬜
**Optional**: 0/4 ⬜⬜⬜⬜

---

## 🗓️ Suggested Timeline

### Day 1 (Today) - Pre-Build Setup
**Time**: 1-2 hours

- [ ] Create demo account (30 min)
- [ ] Publish privacy policy (30 min)
- [ ] Create support page (30 min)

**When done**: ✅ Ready to build!

---

### Day 2 - Build & Screenshots
**Time**: 3-4 hours total (mostly waiting)

Morning:
- [ ] Run build command (5 min active, 30-60 min waiting)
- [ ] Create App Store Connect record (15 min)

Afternoon:
- [ ] Create screenshots (1-2 hours)
- [ ] Upload build to App Store Connect (15 min)

**When done**: ✅ Ready for metadata!

---

### Day 3 - Complete Submission
**Time**: 1-2 hours

- [ ] Upload screenshots to App Store Connect (20 min)
- [ ] Fill in all metadata (30 min)
- [ ] Add review information (15 min)
- [ ] Final review and submit (15 min)

**When done**: ✅ Submitted for review!

---

### Days 4-7 - Apple Review
**Time**: No action needed (just monitoring)

- [ ] Monitor email for updates
- [ ] Respond quickly if Apple has questions
- [ ] Prepare for launch

**When done**: ✅ APPROVED! 🎉

---

## 🎯 Next Action

**RIGHT NOW**: Start with Day 1 tasks

1. Open your app and create: demo@edufeed.com account
2. Upload PRIVACY_POLICY.md to your website
3. Create and upload support.html

**Once those 3 are done**, you can proceed to build!

---

## ⚠️ Blockers

**Cannot build until:**
- Demo account created ❌
- Privacy policy published ❌
- Support page live ❌

**Cannot submit until:**
- Build completed ❌
- Screenshots created ❌
- App Store Connect set up ❌

---

## 📞 Quick Reference

**Build Command:**
```bash
cd "/Users/annaabyzova/Projects/Website feed/edufeed-mobile"
eas build --platform ios --profile production
```

**Submit Command:**
```bash
eas submit --platform ios --latest
```

**Check Build Status:**
```bash
eas build:list
```

**App Store Connect:**
https://appstoreconnect.apple.com/

**Documentation:**
- Full guide: [IOS_BUILD_INSTRUCTIONS.md](IOS_BUILD_INSTRUCTIONS.md)
- Metadata: [APP_STORE_METADATA.md](APP_STORE_METADATA.md)
- Ready guide: [APP_STORE_READY.md](APP_STORE_READY.md)

---

## ✅ Completion Tracking

As you complete each task, mark it with [x] and update the status!

**Update this file** as you progress to keep track of where you are.

---

**Start with Day 1 tasks above!** 👆

Good luck! 🍀
