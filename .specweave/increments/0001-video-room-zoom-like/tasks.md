# Tasks - Video Room Zoom-like Implementation

## T-001: Verify and fix Web WebRTC integration
**User Story**: US-001, US-002 | **Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US2-01, AC-US2-02 | **Status**: [x] completed
**Test**: Given a user in a study room → When another user joins → Then both see each other's video/audio streams

### Subtasks:
- [x] Verify WebRTC signaling via Supabase Realtime works
- [x] Fix media stream attachment to video elements
- [x] Ensure peer connection establishment works between 2+ users
- [x] Test audio/video toggle functionality
- [x] Add error handling and connection state feedback

---

## T-002: Install and configure react-native-webrtc for mobile
**User Story**: US-006 | **Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03 | **Status**: [x] completed
**Test**: Given an Expo mobile app → When react-native-webrtc is installed → Then the app builds successfully

### Subtasks:
- [x] Install react-native-webrtc package
- [x] Configure Expo dev client for native modules
- [x] Add required permissions for camera/microphone (iOS/Android)
- [x] Create basic test to verify WebRTC APIs are available (verified via expo prebuild)

---

## T-003: Create shared WebRTC hook for mobile
**User Story**: US-001, US-006 | **Satisfies ACs**: AC-US1-02, AC-US6-03 | **Status**: [x] completed
**Test**: Given the mobile app → When using useWebRTCRoom hook → Then video streams are properly managed

### Subtasks:
- [x] Port WebRTCClient class to React Native compatible version
- [x] Create useWebRTCRoom hook for mobile
- [x] Handle React Native specific media stream APIs
- [x] Integrate Supabase Realtime for signaling

---

## T-004: Integrate WebRTC video into mobile VideoTile component
**User Story**: US-001 | **Satisfies ACs**: AC-US1-03, AC-US1-04 | **Status**: [ ] pending
**Test**: Given a participant with video on → When displayed in VideoTile → Then actual video stream shows

### Subtasks:
- [ ] Replace placeholder with RTCView component
- [ ] Handle local vs remote stream display
- [ ] Implement speaking indicator with audio analysis
- [ ] Add connection status indicators

---

## T-005: Implement mobile mute/unmute and video toggle
**User Story**: US-002 | **Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05 | **Status**: [ ] pending
**Test**: Given a user in a call → When tapping mute button → Then audio is disabled and indicator shows

### Subtasks:
- [ ] Connect control buttons to WebRTC client methods
- [ ] Broadcast media state changes via Supabase
- [ ] Update UI to reflect current media state
- [ ] Sync media state with database for persistence

---

## T-006: Add real-time participant sync
**User Story**: US-004 | **Satisfies ACs**: AC-US4-01, AC-US4-02, AC-US4-03, AC-US4-04, AC-US4-05 | **Status**: [ ] pending
**Test**: Given multiple users in a room → When one joins/leaves → Then all see updated participant list

### Subtasks:
- [ ] Use Supabase Presence for participant tracking
- [ ] Update participants list in real-time
- [ ] Show speaking indicators based on audio levels
- [ ] Display host badge and role indicators

---

## T-007: Implement screen sharing (web)
**User Story**: US-003 | **Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03, AC-US3-04, AC-US3-05 | **Status**: [ ] pending
**Test**: Given a user on web → When clicking share screen → Then screen is shared to all participants

### Subtasks:
- [ ] Use getDisplayMedia API for screen capture
- [ ] Replace video track in peer connections
- [ ] Add screen sharing indicator on participant tile
- [ ] Handle screen share stop gracefully

---

## T-008: Implement proper room join/leave flow
**User Story**: US-005 | **Satisfies ACs**: AC-US5-01, AC-US5-02, AC-US5-03, AC-US5-04, AC-US5-05 | **Status**: [ ] pending
**Test**: Given a user leaving a room → When clicking leave → Then all resources are cleaned up properly

### Subtasks:
- [ ] Show connection progress indicators
- [ ] Implement graceful disconnect with cleanup
- [ ] Update participant status in database
- [ ] Handle reconnection on network issues

---

## T-009: Create E2E test suite for video room
**User Story**: All | **Satisfies ACs**: All | **Status**: [ ] pending
**Test**: Given the E2E test suite → When running tests → Then all critical paths pass

### Subtasks:
- [ ] Set up Playwright for web E2E tests
- [ ] Create test for room creation and joining
- [ ] Create test for media toggle functionality
- [ ] Create test for participant list updates
- [ ] Create test for room leave flow

---

## T-010: Cross-platform testing and bug fixes
**User Story**: US-006 | **Satisfies ACs**: AC-US6-01, AC-US6-02, AC-US6-03, AC-US6-04, AC-US6-05 | **Status**: [ ] pending
**Test**: Given web and mobile apps → When users join same room → Then they can communicate

### Subtasks:
- [ ] Test web-to-web video calls
- [ ] Test mobile-to-mobile video calls
- [ ] Test web-to-mobile cross-platform calls
- [ ] Fix any discovered compatibility issues
- [ ] Document any platform-specific limitations
