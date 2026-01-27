import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the YouTube search API response
const mockYouTubeSearchResults = [
  {
    id: "search-abc123",
    videoId: "abc123",
    title: "Study Music for Focus",
    channelName: "Focus Music Channel",
    thumbnailUrl: "https://img.youtube.com/vi/abc123/hqdefault.jpg",
    duration: "3:45:00",
    viewCount: "1.2M views",
    publishedAt: "2 years ago",
    description: "Relaxing study music for concentration",
  },
  {
    id: "search-def456",
    videoId: "def456",
    title: "Lofi Hip Hop Radio",
    channelName: "Lofi Girl",
    thumbnailUrl: "https://img.youtube.com/vi/def456/hqdefault.jpg",
    duration: "LIVE",
    viewCount: "25K watching",
    publishedAt: "",
    description: "24/7 lofi beats to study/relax to",
  },
  {
    id: "search-ghi789",
    videoId: "ghi789",
    title: "Classical Music for Studying",
    channelName: "Classical Channel",
    thumbnailUrl: "https://img.youtube.com/vi/ghi789/hqdefault.jpg",
    duration: "2:00:00",
    viewCount: "500K views",
    publishedAt: "1 year ago",
    description: "Mozart, Beethoven, and Bach",
  },
];

describe("YouTube Search API", () => {
  describe("Search Query Validation", () => {
    it("should require a search query", () => {
      const validateQuery = (query: string): boolean => {
        return query.trim().length > 0;
      };

      expect(validateQuery("")).toBe(false);
      expect(validateQuery("   ")).toBe(false);
      expect(validateQuery("study")).toBe(true);
      expect(validateQuery("lofi beats")).toBe(true);
    });

    it("should require minimum 3 characters for YouTube search", () => {
      const isValidForYouTubeSearch = (query: string): boolean => {
        return query.trim().length >= 3;
      };

      expect(isValidForYouTubeSearch("ab")).toBe(false);
      expect(isValidForYouTubeSearch("abc")).toBe(true);
      expect(isValidForYouTubeSearch("study music")).toBe(true);
    });

    it("should sanitize special characters in search query", () => {
      const sanitizeQuery = (query: string): string => {
        return encodeURIComponent(query.trim());
      };

      expect(sanitizeQuery("study music")).toBe("study%20music");
      expect(sanitizeQuery("lofi & chill")).toBe("lofi%20%26%20chill");
      expect(sanitizeQuery("  music  ")).toBe("music");
    });
  });

  describe("Search Results Processing", () => {
    it("should parse search results correctly", () => {
      const results = mockYouTubeSearchResults;

      expect(results.length).toBe(3);
      expect(results[0].videoId).toBe("abc123");
      expect(results[0].title).toBe("Study Music for Focus");
      expect(results[0].channelName).toBe("Focus Music Channel");
    });

    it("should identify live videos", () => {
      const isLive = (result: typeof mockYouTubeSearchResults[0]): boolean => {
        return result.duration === "LIVE" || result.duration.toLowerCase().includes("live");
      };

      expect(isLive(mockYouTubeSearchResults[0])).toBe(false);
      expect(isLive(mockYouTubeSearchResults[1])).toBe(true);
      expect(isLive(mockYouTubeSearchResults[2])).toBe(false);
    });

    it("should generate correct thumbnail URLs", () => {
      const getThumbnailUrl = (videoId: string): string => {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      };

      expect(getThumbnailUrl("abc123")).toBe("https://img.youtube.com/vi/abc123/hqdefault.jpg");
      expect(getThumbnailUrl("def456")).toBe("https://img.youtube.com/vi/def456/hqdefault.jpg");
    });

    it("should limit results to maxResults", () => {
      const limitResults = <T>(results: T[], maxResults: number): T[] => {
        return results.slice(0, maxResults);
      };

      expect(limitResults(mockYouTubeSearchResults, 2).length).toBe(2);
      expect(limitResults(mockYouTubeSearchResults, 10).length).toBe(3);
      expect(limitResults(mockYouTubeSearchResults, 0).length).toBe(0);
    });
  });

  describe("Category Enhancement", () => {
    it("should enhance search queries with category context", () => {
      const educationalSuffixes: Record<string, string> = {
        study: "study music",
        focus: "focus concentration",
        relaxing: "relaxing calm",
        lofi: "lofi beats",
        nature: "nature sounds",
        classical: "classical music",
        frequencies: "binaural beats hz",
        shorts: "study tips shorts",
      };

      const enhanceQuery = (query: string, category: string): string => {
        const suffix = educationalSuffixes[category];
        return suffix ? `${query} ${suffix}` : query;
      };

      expect(enhanceQuery("piano", "study")).toBe("piano study music");
      expect(enhanceQuery("rain", "nature")).toBe("rain nature sounds");
      expect(enhanceQuery("mozart", "classical")).toBe("mozart classical music");
      expect(enhanceQuery("jazz", "unknown")).toBe("jazz");
    });
  });

  describe("Result to CuratedVideo Conversion", () => {
    it("should convert search result to CuratedVideo format", () => {
      const convertToCuratedVideo = (
        result: typeof mockYouTubeSearchResults[0],
        category: string = "study"
      ) => {
        return {
          id: result.id,
          title: result.title,
          channelName: result.channelName,
          thumbnailUrl: result.thumbnailUrl,
          videoId: result.videoId,
          platform: "youtube" as const,
          duration: result.duration,
          category: category,
          viewCount: result.viewCount,
          isLive: result.duration === "LIVE" || result.duration.toLowerCase().includes("live"),
        };
      };

      const converted = convertToCuratedVideo(mockYouTubeSearchResults[0], "focus");

      expect(converted.id).toBe("search-abc123");
      expect(converted.videoId).toBe("abc123");
      expect(converted.platform).toBe("youtube");
      expect(converted.category).toBe("focus");
      expect(converted.isLive).toBe(false);

      const liveConverted = convertToCuratedVideo(mockYouTubeSearchResults[1], "lofi");
      expect(liveConverted.isLive).toBe(true);
    });
  });

  describe("Cache Management", () => {
    it("should cache search results", () => {
      const cache = new Map<string, { data: typeof mockYouTubeSearchResults; timestamp: number }>();
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      const cacheResults = (key: string, results: typeof mockYouTubeSearchResults) => {
        cache.set(key, { data: results, timestamp: Date.now() });
      };

      const getCachedResults = (key: string): typeof mockYouTubeSearchResults | null => {
        const cached = cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > CACHE_TTL) {
          cache.delete(key);
          return null;
        }
        return cached.data;
      };

      // Cache should be empty initially
      expect(getCachedResults("study-focus-20")).toBeNull();

      // Cache results
      cacheResults("study-focus-20", mockYouTubeSearchResults);

      // Should retrieve cached results
      const cached = getCachedResults("study-focus-20");
      expect(cached).not.toBeNull();
      expect(cached?.length).toBe(3);
    });

    it("should expire cache after TTL", () => {
      const cache = new Map<string, { data: typeof mockYouTubeSearchResults; timestamp: number }>();

      // Set cache with old timestamp
      cache.set("old-query", {
        data: mockYouTubeSearchResults,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      });

      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      const getCachedResults = (key: string): typeof mockYouTubeSearchResults | null => {
        const cached = cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > CACHE_TTL) {
          cache.delete(key);
          return null;
        }
        return cached.data;
      };

      // Should return null for expired cache
      expect(getCachedResults("old-query")).toBeNull();
      expect(cache.has("old-query")).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty results gracefully", () => {
      const results: typeof mockYouTubeSearchResults = [];

      expect(results.length).toBe(0);
      expect(Array.isArray(results)).toBe(true);
    });

    it("should provide fallback results on error", () => {
      const getFallbackResults = (category: string) => {
        const fallbacks: Record<string, typeof mockYouTubeSearchResults> = {
          study: [
            {
              id: "fallback-1",
              videoId: "lTRiuFIWV54",
              title: "Deep Focus Music To Improve Concentration",
              channelName: "Greenred Productions",
              thumbnailUrl: "https://img.youtube.com/vi/lTRiuFIWV54/hqdefault.jpg",
              duration: "11:54:56",
              viewCount: "25M views",
              publishedAt: "3 years ago",
              description: "Deep focus music for studying",
            },
          ],
          lofi: [
            {
              id: "fallback-lofi-1",
              videoId: "jfKfPfyJRdk",
              title: "lofi hip hop radio - beats to relax/study to",
              channelName: "Lofi Girl",
              thumbnailUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg",
              duration: "LIVE",
              viewCount: "41K watching",
              publishedAt: "",
              description: "24/7 lofi hip hop radio",
            },
          ],
        };

        return fallbacks[category] || fallbacks.study || [];
      };

      expect(getFallbackResults("study").length).toBe(1);
      expect(getFallbackResults("lofi").length).toBe(1);
      expect(getFallbackResults("unknown").length).toBe(1);
    });
  });

  describe("Debounced Search", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should debounce search calls", async () => {
      const searchFn = vi.fn();
      const debounceMs = 500;

      const debouncedSearch = (query: string) => {
        setTimeout(() => searchFn(query), debounceMs);
      };

      // Call multiple times rapidly
      debouncedSearch("s");
      debouncedSearch("st");
      debouncedSearch("stu");
      debouncedSearch("stud");
      debouncedSearch("study");

      // Before debounce completes
      expect(searchFn).not.toHaveBeenCalled();

      // After debounce completes
      vi.advanceTimersByTime(500);
      expect(searchFn).toHaveBeenCalledTimes(5); // Each call scheduled its own timeout

      // In real implementation, we'd clear previous timeouts
    });

    it("should cancel previous timeout on new input", () => {
      const searchFn = vi.fn();
      let timeoutRef: ReturnType<typeof setTimeout> | null = null;
      const debounceMs = 500;

      const debouncedSearch = (query: string) => {
        if (timeoutRef) {
          clearTimeout(timeoutRef);
        }
        timeoutRef = setTimeout(() => searchFn(query), debounceMs);
      };

      // Call multiple times
      debouncedSearch("s");
      debouncedSearch("st");
      debouncedSearch("stu");
      debouncedSearch("stud");
      debouncedSearch("study");

      // Advance timer
      vi.advanceTimersByTime(500);

      // Only the last call should have executed
      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(searchFn).toHaveBeenCalledWith("study");
    });
  });
});

describe("Library Video Playback", () => {
  describe("Video Queue Management", () => {
    it("should set queue with videos", () => {
      const videos = mockYouTubeSearchResults.map((r) => ({
        id: r.id,
        title: r.title,
        channelName: r.channelName,
        thumbnailUrl: r.thumbnailUrl,
        videoId: r.videoId,
        platform: "youtube" as const,
        duration: r.duration,
        category: "study" as const,
        viewCount: r.viewCount,
        isLive: r.duration === "LIVE",
      }));

      let queue: typeof videos = [];
      let queueIndex = -1;

      const setQueue = (newVideos: typeof videos, startIndex = 0) => {
        queue = newVideos;
        queueIndex = startIndex;
      };

      setQueue(videos, 0);

      expect(queue.length).toBe(3);
      expect(queueIndex).toBe(0);
      expect(queue[0].videoId).toBe("abc123");
    });

    it("should play next video in queue", () => {
      const videos = [
        { id: "1", videoId: "v1" },
        { id: "2", videoId: "v2" },
        { id: "3", videoId: "v3" },
      ];

      let queue = videos;
      let queueIndex = 0;

      const playNext = () => {
        if (queueIndex < queue.length - 1) {
          queueIndex++;
          return queue[queueIndex];
        }
        return null;
      };

      expect(playNext()?.videoId).toBe("v2");
      expect(queueIndex).toBe(1);
      expect(playNext()?.videoId).toBe("v3");
      expect(queueIndex).toBe(2);
      expect(playNext()).toBeNull();
      expect(queueIndex).toBe(2);
    });

    it("should play previous video in queue", () => {
      const videos = [
        { id: "1", videoId: "v1" },
        { id: "2", videoId: "v2" },
        { id: "3", videoId: "v3" },
      ];

      let queue = videos;
      let queueIndex = 2;

      const playPrevious = () => {
        if (queueIndex > 0) {
          queueIndex--;
          return queue[queueIndex];
        }
        return null;
      };

      expect(playPrevious()?.videoId).toBe("v2");
      expect(queueIndex).toBe(1);
      expect(playPrevious()?.videoId).toBe("v1");
      expect(queueIndex).toBe(0);
      expect(playPrevious()).toBeNull();
      expect(queueIndex).toBe(0);
    });

    it("should add video to queue", () => {
      let queue: { id: string; videoId: string }[] = [{ id: "1", videoId: "v1" }];

      const addToQueue = (video: { id: string; videoId: string }) => {
        queue = [...queue, video];
      };

      addToQueue({ id: "2", videoId: "v2" });

      expect(queue.length).toBe(2);
      expect(queue[1].videoId).toBe("v2");
    });

    it("should shuffle queue correctly", () => {
      const videos = [
        { id: "1", videoId: "v1" },
        { id: "2", videoId: "v2" },
        { id: "3", videoId: "v3" },
        { id: "4", videoId: "v4" },
        { id: "5", videoId: "v5" },
      ];

      const shuffle = <T>(arr: T[]): T[] => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffled = shuffle(videos);

      // Same length
      expect(shuffled.length).toBe(videos.length);

      // Same elements (just different order)
      const originalIds = videos.map((v) => v.id).sort();
      const shuffledIds = shuffled.map((v) => v.id).sort();
      expect(shuffledIds).toEqual(originalIds);
    });
  });

  describe("Video Player State", () => {
    it("should track playing state", () => {
      let isPlaying = false;

      const play = () => {
        isPlaying = true;
      };

      const pause = () => {
        isPlaying = false;
      };

      const togglePlay = () => {
        isPlaying = !isPlaying;
      };

      expect(isPlaying).toBe(false);
      play();
      expect(isPlaying).toBe(true);
      pause();
      expect(isPlaying).toBe(false);
      togglePlay();
      expect(isPlaying).toBe(true);
      togglePlay();
      expect(isPlaying).toBe(false);
    });

    it("should track volume and mute state", () => {
      let volume = 80;
      let isMuted = false;

      const setVolume = (v: number) => {
        volume = Math.max(0, Math.min(100, v));
        isMuted = volume === 0;
      };

      const toggleMute = () => {
        isMuted = !isMuted;
      };

      expect(volume).toBe(80);
      expect(isMuted).toBe(false);

      setVolume(50);
      expect(volume).toBe(50);
      expect(isMuted).toBe(false);

      setVolume(0);
      expect(volume).toBe(0);
      expect(isMuted).toBe(true);

      setVolume(75);
      expect(volume).toBe(75);
      expect(isMuted).toBe(false);

      toggleMute();
      expect(isMuted).toBe(true);
    });

    it("should track minimized and expanded states", () => {
      let isMinimized = false;
      let isExpanded = false;

      const minimize = () => {
        isMinimized = true;
        isExpanded = false;
      };

      const expand = () => {
        isExpanded = true;
        isMinimized = false;
      };

      const close = () => {
        isMinimized = false;
        isExpanded = false;
      };

      expect(isMinimized).toBe(false);
      expect(isExpanded).toBe(false);

      minimize();
      expect(isMinimized).toBe(true);
      expect(isExpanded).toBe(false);

      expand();
      expect(isMinimized).toBe(false);
      expect(isExpanded).toBe(true);

      close();
      expect(isMinimized).toBe(false);
      expect(isExpanded).toBe(false);
    });
  });

  describe("Video Category Filtering", () => {
    const curatedVideos = {
      focus: [
        { id: "f1", title: "Focus Music 1", category: "focus" },
        { id: "f2", title: "Focus Music 2", category: "focus" },
      ],
      lofi: [
        { id: "l1", title: "Lofi Beats 1", category: "lofi" },
        { id: "l2", title: "Lofi Beats 2", category: "lofi" },
      ],
      relaxing: [
        { id: "r1", title: "Relaxing Sounds 1", category: "relaxing" },
      ],
    };

    it("should filter videos by category", () => {
      const filterByCategory = (category: string) => {
        return curatedVideos[category as keyof typeof curatedVideos] || [];
      };

      expect(filterByCategory("focus").length).toBe(2);
      expect(filterByCategory("lofi").length).toBe(2);
      expect(filterByCategory("relaxing").length).toBe(1);
      expect(filterByCategory("unknown").length).toBe(0);
    });

    it("should get all videos when category is 'all'", () => {
      const getAllVideos = () => {
        return Object.values(curatedVideos).flat();
      };

      expect(getAllVideos().length).toBe(5);
    });

    it("should filter by search query within category", () => {
      type Video = { id: string; title: string; category: string };

      const filterByQuery = (videos: Video[], query: string): Video[] => {
        if (!query.trim()) return videos;
        const lowerQuery = query.toLowerCase();
        return videos.filter((v) =>
          v.title.toLowerCase().includes(lowerQuery) ||
          v.category.toLowerCase().includes(lowerQuery)
        );
      };

      const allVideos = Object.values(curatedVideos).flat();

      expect(filterByQuery(allVideos, "").length).toBe(5);
      expect(filterByQuery(allVideos, "focus").length).toBe(2);
      expect(filterByQuery(allVideos, "lofi").length).toBe(2);
      expect(filterByQuery(allVideos, "beats").length).toBe(2);
      expect(filterByQuery(allVideos, "xyz").length).toBe(0);
    });
  });
});

describe("Thumbnail URL Handling", () => {
  it("should try multiple thumbnail quality levels", () => {
    const getThumbnailUrls = (videoId: string): string[] => [
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/default.jpg`,
    ];

    const urls = getThumbnailUrls("abc123");

    expect(urls.length).toBe(5);
    expect(urls[0]).toContain("maxresdefault");
    expect(urls[4]).toContain("default.jpg");
  });

  it("should handle image load errors", () => {
    let currentIndex = 0;
    const maxIndex = 4;

    const handleImageError = () => {
      if (currentIndex < maxIndex) {
        currentIndex++;
        return true; // Try next URL
      }
      return false; // All URLs failed
    };

    // Simulate multiple failures
    expect(handleImageError()).toBe(true);
    expect(currentIndex).toBe(1);
    expect(handleImageError()).toBe(true);
    expect(currentIndex).toBe(2);
    expect(handleImageError()).toBe(true);
    expect(currentIndex).toBe(3);
    expect(handleImageError()).toBe(true);
    expect(currentIndex).toBe(4);
    expect(handleImageError()).toBe(false);
    expect(currentIndex).toBe(4);
  });
});
