/**
 * MP4 Video Playback Test
 * Tests if generated videos can run as proper MP4 files
 *
 * Run with: npx tsx tests/video-mp4-test.ts
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Test video file path (we'll create a simple test)
const TEST_DIR = path.join(__dirname, 'temp');
const TEST_VIDEO = path.join(TEST_DIR, 'test-video.mp4');

interface TestResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Create test directory if it doesn't exist
 */
function ensureTestDir(): void {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

/**
 * Create a simple test MP4 using ffmpeg CLI
 * This creates a 2-second video with a colored background
 */
async function createTestVideo(): Promise<TestResult> {
  return new Promise((resolve) => {
    ensureTestDir();

    // Use ffmpeg to create a simple test video
    // Creates a 2-second video with a lavender color background
    const ffmpeg = spawn('ffmpeg', [
      '-y', // Overwrite output
      '-f', 'lavfi',
      '-i', 'color=c=lavender:duration=2:size=640x480:rate=30',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      TEST_VIDEO
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve({
          passed: true,
          message: 'Test video created successfully',
          details: { path: TEST_VIDEO }
        });
      } else {
        resolve({
          passed: false,
          message: `Failed to create test video (exit code: ${code})`,
          details: { stderr }
        });
      }
    });

    ffmpeg.on('error', (err) => {
      resolve({
        passed: false,
        message: `FFmpeg not found or failed: ${err.message}`,
        details: { error: err.message }
      });
    });
  });
}

/**
 * Verify the video file is a valid MP4
 */
async function verifyMP4Format(): Promise<TestResult> {
  return new Promise((resolve) => {
    if (!fs.existsSync(TEST_VIDEO)) {
      resolve({
        passed: false,
        message: 'Test video file does not exist'
      });
      return;
    }

    // Check file size
    const stats = fs.statSync(TEST_VIDEO);
    if (stats.size === 0) {
      resolve({
        passed: false,
        message: 'Test video file is empty'
      });
      return;
    }

    // Read first bytes to check for MP4 signature
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(TEST_VIDEO, 'r');
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    // MP4 files typically have 'ftyp' at offset 4
    const ftyp = buffer.slice(4, 8).toString('ascii');
    if (ftyp !== 'ftyp') {
      resolve({
        passed: false,
        message: `Invalid MP4 format: expected 'ftyp' at offset 4, got '${ftyp}'`,
        details: { headerBytes: buffer.toString('hex') }
      });
      return;
    }

    resolve({
      passed: true,
      message: 'Valid MP4 format confirmed',
      details: {
        fileSize: stats.size,
        header: buffer.slice(4, 8).toString('ascii')
      }
    });
  });
}

/**
 * Use ffprobe to verify video properties
 */
async function verifyVideoProperties(): Promise<TestResult> {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height,duration,avg_frame_rate',
      '-of', 'json',
      TEST_VIDEO
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        resolve({
          passed: false,
          message: `ffprobe failed with exit code ${code}`,
          details: { stderr }
        });
        return;
      }

      try {
        const probeResult = JSON.parse(stdout);
        const stream = probeResult.streams?.[0];

        if (!stream) {
          resolve({
            passed: false,
            message: 'No video stream found in file'
          });
          return;
        }

        // Check expected properties
        const checks = {
          hasCodec: stream.codec_name === 'h264',
          hasWidth: stream.width === 640,
          hasHeight: stream.height === 480,
          hasDuration: parseFloat(stream.duration) >= 1.5
        };

        const allPassed = Object.values(checks).every(Boolean);

        resolve({
          passed: allPassed,
          message: allPassed
            ? 'Video properties verified successfully'
            : 'Some video properties do not match expected values',
          details: {
            codec: stream.codec_name,
            width: stream.width,
            height: stream.height,
            duration: stream.duration,
            frameRate: stream.avg_frame_rate,
            checks
          }
        });
      } catch (error) {
        resolve({
          passed: false,
          message: `Failed to parse ffprobe output: ${error}`,
          details: { stdout }
        });
      }
    });

    ffprobe.on('error', (err) => {
      resolve({
        passed: false,
        message: `ffprobe not found or failed: ${err.message}`,
        details: { error: err.message }
      });
    });
  });
}

/**
 * Test that the video can be opened and read as binary data
 */
async function testVideoReadable(): Promise<TestResult> {
  try {
    const videoBuffer = fs.readFileSync(TEST_VIDEO);

    // Basic checks
    if (videoBuffer.length === 0) {
      return {
        passed: false,
        message: 'Video file is empty'
      };
    }

    // Check it's not corrupted by verifying we can read the whole file
    const base64 = videoBuffer.toString('base64');

    return {
      passed: true,
      message: 'Video file is readable and can be converted to base64',
      details: {
        fileSize: videoBuffer.length,
        base64Length: base64.length
      }
    };
  } catch (error) {
    return {
      passed: false,
      message: `Failed to read video file: ${error}`
    };
  }
}

/**
 * Cleanup test files
 */
function cleanup(): void {
  try {
    if (fs.existsSync(TEST_VIDEO)) {
      fs.unlinkSync(TEST_VIDEO);
    }
    if (fs.existsSync(TEST_DIR)) {
      fs.rmdirSync(TEST_DIR);
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  console.log('🎬 MP4 Video Playback Test Suite\n');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'Create Test Video', fn: createTestVideo },
    { name: 'Verify MP4 Format', fn: verifyMP4Format },
    { name: 'Verify Video Properties', fn: verifyVideoProperties },
    { name: 'Test Video Readable', fn: testVideoReadable },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 ${test.name}...`);

    try {
      const result = await test.fn();

      if (result.passed) {
        console.log(`   ✅ PASSED: ${result.message}`);
        if (result.details) {
          console.log(`   📊 Details:`, JSON.stringify(result.details, null, 2).split('\n').map(l => '      ' + l).join('\n'));
        }
        passed++;
      } else {
        console.log(`   ❌ FAILED: ${result.message}`);
        if (result.details) {
          console.log(`   📊 Details:`, JSON.stringify(result.details, null, 2).split('\n').map(l => '      ' + l).join('\n'));
        }
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  // Cleanup
  console.log('🧹 Cleaning up test files...');
  cleanup();

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests();
