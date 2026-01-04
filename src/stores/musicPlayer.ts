import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VideoCategory = "focus" | "relaxing" | "lofi" | "nature" | "study" | "shorts" | "classical" | "frequencies";

export interface CuratedVideo {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoId: string;
  platform: "youtube" | "dailymotion" | "instagram";
  duration: string;
  category: VideoCategory;
  viewCount?: string;
  isLive?: boolean;
  isShort?: boolean;
}

interface MusicPlayerState {
  // Current video
  currentVideo: CuratedVideo | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;

  // Player visibility
  isExpanded: boolean; // Full screen player
  isMinimized: boolean; // Mini player at bottom

  // Queue
  queue: CuratedVideo[];
  queueIndex: number;

  // Actions
  playVideo: (video: CuratedVideo) => void;
  pauseVideo: () => void;
  resumeVideo: () => void;
  togglePlay: () => void;
  stopVideo: () => void;

  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;

  expandPlayer: () => void;
  minimizePlayer: () => void;
  closePlayer: () => void;

  // Queue management
  setQueue: (videos: CuratedVideo[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (video: CuratedVideo) => void;
  clearQueue: () => void;
}

export const useMusicPlayer = create<MusicPlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentVideo: null,
      isPlaying: false,
      isMuted: false,
      volume: 80,
      isExpanded: false,
      isMinimized: false,
      queue: [],
      queueIndex: -1,

      // Play a video
      playVideo: (video) => {
        set({
          currentVideo: video,
          isPlaying: true,
          isExpanded: false,
          isMinimized: true, // Show mini player
        });
      },

      // Pause
      pauseVideo: () => {
        set({ isPlaying: false });
      },

      // Resume
      resumeVideo: () => {
        set({ isPlaying: true });
      },

      // Toggle play/pause
      togglePlay: () => {
        const { isPlaying } = get();
        set({ isPlaying: !isPlaying });
      },

      // Stop and clear
      stopVideo: () => {
        set({
          currentVideo: null,
          isPlaying: false,
          isMinimized: false,
          isExpanded: false,
        });
      },

      // Mute controls
      setMuted: (muted) => set({ isMuted: muted }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

      // Player visibility
      expandPlayer: () => set({ isExpanded: true, isMinimized: false }),
      minimizePlayer: () => set({ isExpanded: false, isMinimized: true }),
      closePlayer: () => set({
        isExpanded: false,
        isMinimized: false,
        isPlaying: false,
        currentVideo: null,
      }),

      // Queue management
      setQueue: (videos, startIndex = 0) => {
        set({
          queue: videos,
          queueIndex: startIndex,
          currentVideo: videos[startIndex] || null,
          isPlaying: true,
          isMinimized: true,
        });
      },

      playNext: () => {
        const { queue, queueIndex } = get();
        if (queueIndex < queue.length - 1) {
          const nextIndex = queueIndex + 1;
          set({
            queueIndex: nextIndex,
            currentVideo: queue[nextIndex],
            isPlaying: true,
          });
        }
      },

      playPrevious: () => {
        const { queue, queueIndex } = get();
        if (queueIndex > 0) {
          const prevIndex = queueIndex - 1;
          set({
            queueIndex: prevIndex,
            currentVideo: queue[prevIndex],
            isPlaying: true,
          });
        }
      },

      addToQueue: (video) => {
        set((state) => ({
          queue: [...state.queue, video],
        }));
      },

      clearQueue: () => {
        set({ queue: [], queueIndex: -1 });
      },
    }),
    {
      name: 'music-player-storage',
      partialize: (state) => ({
        // Only persist these values
        volume: state.volume,
        isMuted: state.isMuted,
        // Don't persist currentVideo or playing state - let user choose fresh each session
      }),
    }
  )
);
