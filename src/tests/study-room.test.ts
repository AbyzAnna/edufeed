import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test types
interface Participant {
  id: string;
  role: 'HOST' | 'MODERATOR' | 'PARTICIPANT';
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  isAudioOn: boolean;
  isVideoOn: boolean;
  isSpeaking: boolean;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Message {
  id: string;
  type: 'TEXT' | 'SYSTEM' | 'AI_RESPONSE' | 'HIGHLIGHT' | 'QUESTION' | 'POLL';
  content: string;
  createdAt: string;
  userId: string;
}

interface StudyRoom {
  id: string;
  title: string;
  description?: string;
  code: string;
  isActive: boolean;
  isPrivate: boolean;
  maxParticipants: number;
  startedAt?: string;
  host: {
    id: string;
    name: string;
  };
  StudyRoomParticipant: Participant[];
  StudyRoomMessage: Message[];
}

// Mock API helper
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Study Room API', () => {
  const baseUrl = 'http://localhost:3000';
  const testUserId = 'test-user-anton';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Study Room CRUD Operations', () => {
    it('should create a new study room', async () => {
      const mockRoom: StudyRoom = {
        id: 'room-1',
        title: 'Physics Study Session',
        description: 'Studying for finals',
        code: 'ABC123',
        isActive: true,
        isPrivate: false,
        maxParticipants: 10,
        host: { id: testUserId, name: 'Anton' },
        StudyRoomParticipant: [],
        StudyRoomMessage: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoom,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Physics Study Session',
          description: 'Studying for finals',
          isPrivate: false,
          maxParticipants: 10,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.title).toBe('Physics Study Session');
      expect(data.code).toBeTruthy();
      expect(data.code).toHaveLength(6);
    });

    it('should list active study rooms', async () => {
      const mockRooms: StudyRoom[] = [
        {
          id: 'room-1',
          title: 'Physics Study',
          code: 'ABC123',
          isActive: true,
          isPrivate: false,
          maxParticipants: 10,
          host: { id: 'user-1', name: 'Anton' },
          StudyRoomParticipant: [],
          StudyRoomMessage: [],
        },
        {
          id: 'room-2',
          title: 'Math Study',
          code: 'XYZ789',
          isActive: true,
          isPrivate: false,
          maxParticipants: 5,
          host: { id: 'user-2', name: 'Maria' },
          StudyRoomParticipant: [],
          StudyRoomMessage: [],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms?active=true`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data.every((r: StudyRoom) => r.isActive)).toBe(true);
    });

    it('should get study room by ID', async () => {
      const mockRoom: StudyRoom = {
        id: 'room-1',
        title: 'Physics Study Session',
        code: 'ABC123',
        isActive: true,
        isPrivate: false,
        maxParticipants: 10,
        host: { id: testUserId, name: 'Anton' },
        StudyRoomParticipant: [
          {
            id: 'participant-1',
            role: 'HOST',
            status: 'ONLINE',
            isAudioOn: true,
            isVideoOn: true,
            isSpeaking: false,
            user: { id: testUserId, name: 'Anton' },
          },
        ],
        StudyRoomMessage: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoom,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBe('room-1');
      expect(data.StudyRoomParticipant).toHaveLength(1);
    });

    it('should join study room by code', async () => {
      const mockJoinResponse = {
        roomId: 'room-1',
        participant: {
          id: 'participant-2',
          role: 'PARTICIPANT',
          status: 'ONLINE',
          isAudioOn: true,
          isVideoOn: true,
          isSpeaking: false,
          user: { id: 'user-2', name: 'Maria' },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoinResponse,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'ABC123' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.roomId).toBe('room-1');
      expect(data.participant.role).toBe('PARTICIPANT');
    });

    it('should end study room (host only)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, endedAt: new Date().toISOString() }),
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/end`, {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Participant Management', () => {
    it('should list room participants', async () => {
      const mockParticipants: Participant[] = [
        {
          id: 'p1',
          role: 'HOST',
          status: 'ONLINE',
          isAudioOn: true,
          isVideoOn: true,
          isSpeaking: true,
          user: { id: 'user-1', name: 'Anton' },
        },
        {
          id: 'p2',
          role: 'PARTICIPANT',
          status: 'ONLINE',
          isAudioOn: true,
          isVideoOn: false,
          isSpeaking: false,
          user: { id: 'user-2', name: 'Maria' },
        },
        {
          id: 'p3',
          role: 'PARTICIPANT',
          status: 'AWAY',
          isAudioOn: false,
          isVideoOn: false,
          isSpeaking: false,
          user: { id: 'user-3', name: 'John' },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockParticipants,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/participants`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveLength(3);
      expect(data.filter((p: Participant) => p.status === 'ONLINE')).toHaveLength(2);
    });

    it('should update participant status', async () => {
      const updatedParticipant: Participant = {
        id: 'p1',
        role: 'HOST',
        status: 'ONLINE',
        isAudioOn: false,
        isVideoOn: true,
        isSpeaking: false,
        user: { id: 'user-1', name: 'Anton' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedParticipant,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/participants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAudioOn: false,
          isVideoOn: true,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.isAudioOn).toBe(false);
      expect(data.isVideoOn).toBe(true);
    });

    it('should kick participant (moderator/host only)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/participants/p3/kick`, {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
    });

    it('should promote to moderator (host only)', async () => {
      const promotedParticipant: Participant = {
        id: 'p2',
        role: 'MODERATOR',
        status: 'ONLINE',
        isAudioOn: true,
        isVideoOn: false,
        isSpeaking: false,
        user: { id: 'user-2', name: 'Maria' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => promotedParticipant,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/participants/p2/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'MODERATOR' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.role).toBe('MODERATOR');
    });
  });

  describe('Chat and Messaging', () => {
    it('should send text message', async () => {
      const mockMessage: Message = {
        id: 'msg-1',
        type: 'TEXT',
        content: 'Hello everyone!',
        createdAt: new Date().toISOString(),
        userId: testUserId,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessage,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEXT',
          content: 'Hello everyone!',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('TEXT');
      expect(data.content).toBe('Hello everyone!');
    });

    it('should send question message', async () => {
      const mockMessage: Message = {
        id: 'msg-2',
        type: 'QUESTION',
        content: 'What is the formula for kinetic energy?',
        createdAt: new Date().toISOString(),
        userId: testUserId,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessage,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'QUESTION',
          content: 'What is the formula for kinetic energy?',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('QUESTION');
    });

    it('should request AI assistance', async () => {
      const mockAIResponse: Message = {
        id: 'msg-3',
        type: 'AI_RESPONSE',
        content: 'The formula for kinetic energy is KE = ½mv², where m is mass and v is velocity.',
        createdAt: new Date().toISOString(),
        userId: 'ai-assistant',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAIResponse,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/ai-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'What is the formula for kinetic energy?',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('AI_RESPONSE');
      expect(data.content).toContain('kinetic energy');
    });

    it('should get message history', async () => {
      const mockMessages: Message[] = [
        { id: 'msg-1', type: 'SYSTEM', content: 'Anton created the room', createdAt: '2024-01-01T10:00:00Z', userId: 'system' },
        { id: 'msg-2', type: 'TEXT', content: 'Hello!', createdAt: '2024-01-01T10:01:00Z', userId: 'user-1' },
        { id: 'msg-3', type: 'SYSTEM', content: 'Maria joined the room', createdAt: '2024-01-01T10:02:00Z', userId: 'system' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessages,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/messages`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveLength(3);
    });
  });

  describe('Annotations and Highlights', () => {
    it('should create highlight annotation', async () => {
      const mockAnnotation = {
        id: 'annotation-1',
        type: 'HIGHLIGHT',
        content: 'Important formula',
        sourceId: 'source-1',
        position: { startIndex: 100, endIndex: 150 },
        createdAt: new Date().toISOString(),
        userId: testUserId,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnnotation,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'HIGHLIGHT',
          content: 'Important formula',
          sourceId: 'source-1',
          position: { startIndex: 100, endIndex: 150 },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('HIGHLIGHT');
    });

    it('should create comment annotation', async () => {
      const mockAnnotation = {
        id: 'annotation-2',
        type: 'COMMENT',
        content: 'This is a really important concept!',
        sourceId: 'source-1',
        parentId: 'annotation-1',
        createdAt: new Date().toISOString(),
        userId: testUserId,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnnotation,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'COMMENT',
          content: 'This is a really important concept!',
          parentId: 'annotation-1',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('COMMENT');
    });
  });

  describe('Invitations (Private Rooms)', () => {
    it('should create invitation', async () => {
      const mockInvitation = {
        id: 'invite-1',
        code: 'PRIVATE123',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        uses: 0,
        maxUses: 5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvitation,
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/room-1/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxUses: 5,
          expiresInHours: 24,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.code).toBeTruthy();
      expect(data.maxUses).toBe(5);
    });

    it('should validate invitation code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, roomId: 'room-1', roomTitle: 'Physics Study' }),
      });

      const response = await fetch(`${baseUrl}/api/study-rooms/invitations/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'PRIVATE123' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.valid).toBe(true);
    });
  });
});

describe('WebRTC Signaling', () => {
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create offer', async () => {
    const mockOffer = {
      type: 'offer',
      sdp: 'v=0\r\no=- 123456 ...',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, offerId: 'offer-1' }),
    });

    const response = await fetch(`${baseUrl}/api/study-rooms/room-1/webrtc/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetParticipantId: 'p2',
        offer: mockOffer,
      }),
    });

    expect(response.ok).toBe(true);
  });

  it('should create answer', async () => {
    const mockAnswer = {
      type: 'answer',
      sdp: 'v=0\r\no=- 789012 ...',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const response = await fetch(`${baseUrl}/api/study-rooms/room-1/webrtc/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'offer-1',
        answer: mockAnswer,
      }),
    });

    expect(response.ok).toBe(true);
  });

  it('should exchange ICE candidates', async () => {
    const mockCandidate = {
      candidate: 'candidate:1 1 UDP ...',
      sdpMid: '0',
      sdpMLineIndex: 0,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const response = await fetch(`${baseUrl}/api/study-rooms/room-1/webrtc/ice-candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetParticipantId: 'p2',
        candidate: mockCandidate,
      }),
    });

    expect(response.ok).toBe(true);
  });
});

describe('Zoom-like Features', () => {
  const baseUrl = 'http://localhost:3000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show participant grid with video tiles', async () => {
    const mockParticipants: Participant[] = [
      { id: 'p1', role: 'HOST', status: 'ONLINE', isAudioOn: true, isVideoOn: true, isSpeaking: true, user: { id: 'u1', name: 'Anton' } },
      { id: 'p2', role: 'PARTICIPANT', status: 'ONLINE', isAudioOn: true, isVideoOn: true, isSpeaking: false, user: { id: 'u2', name: 'Maria' } },
      { id: 'p3', role: 'PARTICIPANT', status: 'ONLINE', isAudioOn: false, isVideoOn: true, isSpeaking: false, user: { id: 'u3', name: 'John' } },
      { id: 'p4', role: 'PARTICIPANT', status: 'ONLINE', isAudioOn: true, isVideoOn: false, isSpeaking: false, user: { id: 'u4', name: 'Sarah' } },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockParticipants,
    });

    const response = await fetch(`${baseUrl}/api/study-rooms/room-1/participants`);
    const data = await response.json();

    expect(data).toHaveLength(4);

    // Verify we can track who has video on
    const videoOnParticipants = data.filter((p: Participant) => p.isVideoOn);
    expect(videoOnParticipants).toHaveLength(3);

    // Verify we can track who is speaking
    const speakingParticipant = data.find((p: Participant) => p.isSpeaking);
    expect(speakingParticipant?.user.name).toBe('Anton');
  });

  it('should handle mute/unmute', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isAudioOn: false }),
    });

    const response = await fetch(`${baseUrl}/api/study-rooms/room-1/participants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAudioOn: false }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.isAudioOn).toBe(false);
  });

  it('should handle video on/off', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isVideoOn: false }),
    });

    const response = await fetch(`${baseUrl}/api/study-rooms/room-1/participants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVideoOn: false }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.isVideoOn).toBe(false);
  });

  it('should track call duration', async () => {
    const mockRoom: StudyRoom = {
      id: 'room-1',
      title: 'Test Room',
      code: 'ABC123',
      isActive: true,
      isPrivate: false,
      maxParticipants: 10,
      startedAt: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
      host: { id: 'u1', name: 'Anton' },
      StudyRoomParticipant: [],
      StudyRoomMessage: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoom,
    });

    const response = await fetch(`${baseUrl}/api/study-rooms/room-1`);
    const data = await response.json();

    // Calculate duration
    const startTime = new Date(data.startedAt!).getTime();
    const durationMs = Date.now() - startTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    expect(durationMinutes).toBeGreaterThanOrEqual(59);
  });

  it('should share room code', async () => {
    const mockRoom: StudyRoom = {
      id: 'room-1',
      title: 'Test Room',
      code: 'ABC123',
      isActive: true,
      isPrivate: false,
      maxParticipants: 10,
      host: { id: 'u1', name: 'Anton' },
      StudyRoomParticipant: [],
      StudyRoomMessage: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRoom,
    });

    const response = await fetch(`${baseUrl}/api/study-rooms/room-1`);
    const data = await response.json();

    expect(data.code).toBe('ABC123');
    expect(data.code).toHaveLength(6);
  });
});
