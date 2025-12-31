# Full Zoom-like Video Room Implementation

## Overview

Implement a fully functional video conferencing system with Zoom-like capabilities, working seamlessly on both mobile (React Native/Expo) and web (Next.js) platforms.

## User Stories

### US-001: Real-time Video Conferencing
As a user, I want to join a video room and see/hear other participants in real-time, so that I can collaborate effectively.

**Acceptance Criteria:**
- [ ] AC-US1-01: Users can see their own video preview before joining
- [ ] AC-US1-02: Users can see and hear all other participants in real-time
- [ ] AC-US1-03: Video grid adapts dynamically based on participant count
- [ ] AC-US1-04: Participant video tiles show name and media status indicators
- [ ] AC-US1-05: Connection status is clearly indicated (connecting, connected, reconnecting)

### US-002: Audio/Video Controls
As a user, I want to control my audio and video, so that I can manage my presence in the meeting.

**Acceptance Criteria:**
- [ ] AC-US2-01: Users can mute/unmute their microphone with immediate effect
- [ ] AC-US2-02: Users can enable/disable their camera with immediate effect
- [ ] AC-US2-03: Audio/video state is synced across all participants in real-time
- [ ] AC-US2-04: Visual indicators show muted/video-off state on participant tiles
- [ ] AC-US2-05: Media controls work consistently on both web and mobile

### US-003: Screen Sharing
As a user, I want to share my screen, so that I can present content to other participants.

**Acceptance Criteria:**
- [ ] AC-US3-01: Users can initiate screen sharing from web browser
- [ ] AC-US3-02: Screen share replaces or supplements video stream
- [ ] AC-US3-03: Other participants see the shared screen clearly
- [ ] AC-US3-04: Screen sharing indicator shows on participant tile
- [ ] AC-US3-05: User can stop screen sharing and return to camera

### US-004: Participant Management
As a user, I want to see who is in the room, so that I know who I'm meeting with.

**Acceptance Criteria:**
- [ ] AC-US4-01: Participants list shows all users currently in the room
- [ ] AC-US4-02: Host is distinguished from other participants
- [ ] AC-US4-03: Real-time updates when participants join/leave
- [ ] AC-US4-04: Audio/video status visible for each participant
- [ ] AC-US4-05: Speaking indicator shows who is currently talking

### US-005: Room Connection Flow
As a user, I want a smooth experience joining and leaving rooms, so that meetings start and end gracefully.

**Acceptance Criteria:**
- [ ] AC-US5-01: Pre-join screen allows media setup before entering
- [ ] AC-US5-02: Joining shows connection progress
- [ ] AC-US5-03: Leave button properly disconnects and cleans up resources
- [ ] AC-US5-04: Reconnection is automatic on temporary network issues
- [ ] AC-US5-05: Room state persists correctly in database

### US-006: Cross-Platform Compatibility
As a user, I want the same experience on mobile and web, so that I can join from any device.

**Acceptance Criteria:**
- [ ] AC-US6-01: Mobile app can join rooms created on web
- [ ] AC-US6-02: Web can join rooms created on mobile
- [ ] AC-US6-03: Video/audio works between web and mobile participants
- [ ] AC-US6-04: UI adapts appropriately to device form factor
- [ ] AC-US6-05: Same room code works across platforms

## Technical Requirements

### WebRTC Implementation
- Use native WebRTC APIs for web (RTCPeerConnection)
- Use react-native-webrtc for mobile
- Supabase Realtime for signaling (offers, answers, ICE candidates)
- Mesh topology for small groups (2-4 participants)
- Proper ICE server configuration for NAT traversal

### Signaling Protocol
- Channel: `study-room:{roomId}`
- Message types: offer, answer, ice-candidate, media-state, join, leave
- Presence API for participant tracking

### Media Handling
- getUserMedia for camera/microphone access
- getDisplayMedia for screen sharing (web)
- MediaStream management with proper cleanup
- Audio level detection for speaking indicators

### State Management
- Local state for media controls
- Supabase Realtime for cross-participant sync
- Database persistence for room/participant status

## Out of Scope (Future Increments)
- Recording functionality
- Virtual backgrounds
- Breakout rooms
- Whiteboard/annotations during call
- AI-powered features (transcription, summaries)
- SFU/MCU for large groups (>6 participants)

## Dependencies
- Supabase project configured
- STUN/TURN servers accessible
- react-native-webrtc package for mobile
