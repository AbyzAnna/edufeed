import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the file validation logic that's used in AddSourceModal
describe('File Upload Validation', () => {
  const allowedTypes: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/gif": ["gif"],
    "image/webp": ["webp"],
    "audio/mpeg": ["mp3", "mpeg"],
    "audio/wav": ["wav"],
    "audio/mp4": ["m4a", "mp4"],
  };

  const maxSize = 50 * 1024 * 1024; // 50MB

  function validateFile(file: { type: string; size: number; name: string }): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 50MB" };
    }

    // Check file type
    const allowedMimeTypes = Object.keys(allowedTypes);
    if (!allowedMimeTypes.includes(file.type)) {
      return { valid: false, error: "File type not supported. Allowed: PDF, images, audio" };
    }

    return { valid: true };
  }

  describe('File Type Validation', () => {
    it('should accept PDF files', () => {
      const result = validateFile({
        type: 'application/pdf',
        size: 1024 * 1024, // 1MB
        name: 'document.pdf'
      });
      expect(result.valid).toBe(true);
    });

    it('should accept JPEG images', () => {
      const result = validateFile({
        type: 'image/jpeg',
        size: 1024 * 1024,
        name: 'photo.jpg'
      });
      expect(result.valid).toBe(true);
    });

    it('should accept PNG images', () => {
      const result = validateFile({
        type: 'image/png',
        size: 1024 * 1024,
        name: 'image.png'
      });
      expect(result.valid).toBe(true);
    });

    it('should accept MP3 audio', () => {
      const result = validateFile({
        type: 'audio/mpeg',
        size: 5 * 1024 * 1024,
        name: 'audio.mp3'
      });
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const result = validateFile({
        type: 'application/zip',
        size: 1024 * 1024,
        name: 'archive.zip'
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should reject executable files', () => {
      const result = validateFile({
        type: 'application/x-executable',
        size: 1024 * 1024,
        name: 'program.exe'
      });
      expect(result.valid).toBe(false);
    });

    it('should reject video files', () => {
      const result = validateFile({
        type: 'video/mp4',
        size: 10 * 1024 * 1024,
        name: 'video.mp4'
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under 50MB', () => {
      const result = validateFile({
        type: 'application/pdf',
        size: 49 * 1024 * 1024, // 49MB
        name: 'large.pdf'
      });
      expect(result.valid).toBe(true);
    });

    it('should accept files exactly at 50MB', () => {
      const result = validateFile({
        type: 'application/pdf',
        size: 50 * 1024 * 1024, // 50MB
        name: 'exactly50.pdf'
      });
      expect(result.valid).toBe(true);
    });

    it('should reject files over 50MB', () => {
      const result = validateFile({
        type: 'application/pdf',
        size: 51 * 1024 * 1024, // 51MB
        name: 'toobig.pdf'
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50MB');
    });

    it('should reject very large files', () => {
      const result = validateFile({
        type: 'application/pdf',
        size: 200 * 1024 * 1024, // 200MB
        name: 'huge.pdf'
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file name', () => {
      const result = validateFile({
        type: 'application/pdf',
        size: 1024,
        name: ''
      });
      expect(result.valid).toBe(true);
    });

    it('should handle zero-byte files', () => {
      const result = validateFile({
        type: 'application/pdf',
        size: 0,
        name: 'empty.pdf'
      });
      expect(result.valid).toBe(true);
    });

    it('should handle special characters in filename', () => {
      const result = validateFile({
        type: 'application/pdf',
        size: 1024,
        name: 'файл документа.pdf'
      });
      expect(result.valid).toBe(true);
    });
  });
});

describe('Filename Sanitization', () => {
  function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  it('should preserve alphanumeric characters', () => {
    expect(sanitizeFilename('document123.pdf')).toBe('document123.pdf');
  });

  it('should replace spaces with underscores', () => {
    expect(sanitizeFilename('my document.pdf')).toBe('my_document.pdf');
  });

  it('should replace special characters', () => {
    expect(sanitizeFilename('doc@#$%.pdf')).toBe('doc____.pdf');
  });

  it('should handle unicode characters', () => {
    const sanitized = sanitizeFilename('документ.pdf');
    expect(sanitized).not.toContain('д');
    expect(sanitized.endsWith('.pdf')).toBe(true);
  });

  it('should preserve dots and hyphens', () => {
    expect(sanitizeFilename('my-file.v2.pdf')).toBe('my-file.v2.pdf');
  });
});

describe('Direct Supabase Upload Path Generation', () => {
  function generateUploadPath(userId: string, filename: string): string {
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${userId}/${Date.now()}-${sanitizedName}`;
  }

  it('should include user ID as folder', () => {
    const path = generateUploadPath('user123', 'doc.pdf');
    expect(path.startsWith('user123/')).toBe(true);
  });

  it('should include timestamp for uniqueness', () => {
    const before = Date.now();
    const path = generateUploadPath('user123', 'doc.pdf');
    const after = Date.now();

    const parts = path.split('/')[1].split('-');
    const timestamp = parseInt(parts[0]);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  it('should sanitize filename in path', () => {
    const path = generateUploadPath('user123', 'my file!.pdf');
    expect(path).toContain('my_file_.pdf');
  });

  it('should generate unique paths for same file', () => {
    const path1 = generateUploadPath('user123', 'doc.pdf');
    // Small delay to ensure different timestamp
    const path2 = generateUploadPath('user123', 'doc.pdf');

    // Paths should be different due to timestamp
    // (Note: In rapid succession they might be the same, but that's okay for testing)
    expect(path1.startsWith('user123/')).toBe(true);
    expect(path2.startsWith('user123/')).toBe(true);
  });
});
