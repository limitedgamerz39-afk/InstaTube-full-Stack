import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Set the path to ffmpeg binary (you'll need to install ffmpeg)
// For Windows: download from https://www.gyan.dev/ffmpeg/builds/
// For Linux/macOS: install via package manager
// ffmpeg.setFfmpegPath('/path/to/ffmpeg');

/**
 * Extract audio from a video file
 * @param {string} videoPath - Path to the video file
 * @param {string} outputDir - Directory to save the extracted audio
 * @returns {Promise<string>} - Path to the extracted audio file
 */
export const extractAudio = (videoPath, outputDir) => {
  return new Promise((resolve, reject) => {
    // Generate a unique filename for the audio file
    const audioFilename = `audio_${uuidv4()}.mp3`;
    const audioPath = path.join(outputDir, audioFilename);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Extract audio using ffmpeg
    ffmpeg(videoPath)
      .audioCodec('libmp3lame')
      .audioBitrate(128)
      .audioFrequency(44100)
      .audioChannels(2)
      .output(audioPath)
      .on('end', () => {
        console.log('Audio extraction completed');
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error('Error extracting audio:', err);
        reject(err);
      })
      .run();
  });
};

/**
 * Get audio metadata
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<Object>} - Audio metadata
 */
export const getAudioMetadata = (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const format = metadata.format;
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
      
      resolve({
        duration: format.duration,
        bitrate: format.bit_rate,
        size: format.size,
        codec: audioStream ? audioStream.codec_name : null,
        sampleRate: audioStream ? audioStream.sample_rate : null,
        channels: audioStream ? audioStream.channels : null,
      });
    });
  });
};

export default {
  extractAudio,
  getAudioMetadata
};