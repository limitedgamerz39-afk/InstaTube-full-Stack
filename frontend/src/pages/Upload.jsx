import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { postAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AiOutlineCloudUpload } from 'react-icons/ai';
import { useAuth } from '../context/AuthContext';

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState('image');
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [madeForKids, setMadeForKids] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [videoLanguage, setVideoLanguage] = useState('en');
  const [license, setLicense] = useState('standard');
  const [topicCategory, setTopicCategory] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [paidPromotion, setPaidPromotion] = useState(false);
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [allowEmbedding, setAllowEmbedding] = useState(true);
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const routerLocation = useLocation();
  const [videoStartSec, setVideoStartSec] = useState(0);
  const [videoEndSec, setVideoEndSec] = useState(60);
  const [playbackRate, setPlaybackRate] = useState(1);

  const recordStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    // Category-based constraints
    const isPrivileged = ['creator', 'business', 'admin'].includes(user?.role);
    if (category === 'long' && !isPrivileged) {
      toast.error('Only creators, business, or admin can upload long videos');
      return;
    }

    if (category === 'image') {
      if (selectedFiles.length > 10) {
        toast.error('Maximum 10 images allowed');
        return;
      }
      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) {
          toast.error('Only images allowed for Image posts');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Each image should be less than 10MB');
          return;
        }
      }
    } else {
      if (selectedFiles.length !== 1) {
        toast.error('Only one video allowed for Shorts/Long');
        return;
      }
      const file = selectedFiles[0];
      if (!file.type.startsWith('video/')) {
        toast.error('Only video allowed for Shorts/Long');
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        toast.error('Video should be less than 200MB');
        return;
      }
    }

    setFiles(selectedFiles);

    // Create previews and validate video duration if needed
    const previewPromises = selectedFiles.map((file) => {
      return new Promise((resolve, reject) => {
        if (file.type.startsWith('video/')) {
          const url = URL.createObjectURL(file);
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.src = url;
          video.onloadedmetadata = () => {
            const durationSec = Math.round(video.duration || 0);
            const limit = category === 'short' ? 60 : 3600;
            if (category !== 'image' && (durationSec === 0 || durationSec > limit)) {
              URL.revokeObjectURL(url);
              reject(new Error(category === 'short' ? 'Shorts must be ≤ 60s' : 'Long must be ≤ 1 hour'));
              return;
            }
            resolve({ url, type: file.type, durationSec });
          };
          video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load video metadata'));
          };
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ url: reader.result, type: file.type });
          };
          reader.readAsDataURL(file);
        }
      });
    });

    try {
      const results = await Promise.all(previewPromises);
      setPreviews(results);
    } catch (err) {
      toast.error(err.message);
      setFiles([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('media', file);
      });
      formData.append('title', title);
      formData.append('description', description);
      formData.append('caption', caption);
      formData.append('tags', tags);
      formData.append('location', location);
      formData.append('visibility', visibility);
      formData.append('madeForKids', String(madeForKids));
      formData.append('allowComments', String(allowComments));
      if (thumbnailFile) { formData.append('thumbnail', thumbnailFile); }
      formData.append('category', category);
      if (scheduledAt) formData.append('scheduledAt', scheduledAt);
      formData.append('videoLanguage', videoLanguage);
      formData.append('license', license);
      if (topicCategory) formData.append('topicCategory', topicCategory);
      if (playlistName) formData.append('playlistName', playlistName);
      formData.append('paidPromotion', String(paidPromotion));
      formData.append('ageRestricted', String(ageRestricted));
      formData.append('allowEmbedding', String(allowEmbedding));
      if (locationLat) formData.append('locationLat', String(locationLat));
      if (locationLng) formData.append('locationLng', String(locationLng));

      // Remix support
      try {
        const remixOf = new URLSearchParams(routerLocation.search).get('remixOf');
        if (remixOf) {
          formData.append('derivedFrom', remixOf);
          formData.append('remixType', 'duet');
          if (category === 'image') {
            // force short video category for duet
            formData.set('category', 'short');
          }
        }
      } catch {}

      // Simple video editor metadata
      if (category !== 'image') {
        formData.append('videoStartSec', String(videoStartSec || 0));
        formData.append('videoEndSec', String(videoEndSec || 0));
        formData.append('playbackRate', String(playbackRate || 1));
      }

      await postAPI.createPost(formData);
      toast.success('Post created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const clearPreview = () => {
    setPreviews([]);
    setFiles([]);
  };

  const removeFile = (index) => {
    setPreviews(previews.filter((_, i) => i !== index));
    setFiles(files.filter((_, i) => i !== index));
  };

  // Camera Recording (Video)
  const startCameraRecording = async () => {
    try {
      if (category === 'image') {
        toast.error('Switch to Shorts/Long to record video');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      recordStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recordChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(recordChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
        // Generate preview
        const url = URL.createObjectURL(blob);
        setPreviews(prev => [...prev, { url, type: 'video/webm', durationSec: recordSeconds }]);
        setFiles(prev => [...prev, file]);
        // Cleanup
        recordChunksRef.current = [];
        if (recordStreamRef.current) {
          recordStreamRef.current.getTracks().forEach(t => t.stop());
          recordStreamRef.current = null;
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          const limit = category === 'short' ? 60 : 3600;
          if (s + 1 >= limit) {
            stopCameraRecording();
            return s + 1;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Camera/mic permission denied');
    }
  };

  const stopCameraRecording = () => {
    try { recorderRef.current?.stop(); } catch {}
    setIsRecording(false);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
            <div className="flex gap-2">
              <button type="button" className={`btn-outline ${category === 'image' ? 'ring-2 ring-primary' : ''}`} onClick={() => { setCategory('image'); clearPreview(); }}>Image</button>
              <button type="button" className={`btn-outline ${category === 'short' ? 'ring-2 ring-primary' : ''}`} onClick={() => { setCategory('short'); clearPreview(); }}>Short (≤ 1 min)</button>
              <button type="button" disabled={!['creator','business','admin'].includes(user?.role)} className={`btn-outline ${category === 'long' ? 'ring-2 ring-primary' : ''} ${!['creator','business','admin'].includes(user?.role) ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => { if(['creator','business','admin'].includes(user?.role)){ setCategory('long'); clearPreview(); } }}>Long (≤ 1 hour)</button>
            </div>
            {!['creator','business','admin'].includes(user?.role) && (
              <div className="text-xs text-yellow-700 mt-2">
                Want to upload long videos? Upgrade to Creator in Settings.
              </div>
            )}
          </div>

          {/* File Upload */}
          {previews.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition">
              <label htmlFor="file-upload" className="cursor-pointer">
                <AiOutlineCloudUpload size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Click to upload photo or video
                </p>
                <p className="text-sm text-gray-400">Max file size: {category === 'image' ? '10MB/image' : '200MB video'}</p>
                <input
                  id="file-upload"
                  type="file"
                  accept={category === 'image' ? 'image/*' : 'video/*'}
                  multiple={category === 'image'}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {/* Camera Quick Capture (Mobile) */}
              <div className="mt-4 flex items-center justify-center gap-3">
                {category === 'image' ? (
                  <label className="btn-outline cursor-pointer">
                    Take Photo
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  </label>
                ) : (
                  <>
                    <label className="btn-outline cursor-pointer">
                      Capture Video
                      <input type="file" accept="video/*" capture="user" className="hidden" onChange={handleFileChange} />
                    </label>
                    <button type="button" onClick={startCameraRecording} className="btn-outline">
                      Record (Camera)
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Preview Grid */}
              <div className={`grid gap-4 mb-4 ${
                previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {preview.type.startsWith('video/') ? (
                      <video
                        src={preview.url}
                        controls
                        className="w-full max-h-64 object-contain rounded-lg bg-black"
                      />
                    ) : (
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full max-h-64 object-contain rounded-lg bg-black"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {index + 1} / {previews.length}
                    </div>
                    {preview.type.startsWith('video/') && preview.durationSec && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {Math.floor(preview.durationSec/60)}:{String(preview.durationSec%60).padStart(2,'0')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {previews.length < 10 && category === 'image' && (
                <label htmlFor="add-more" className="btn-outline block text-center cursor-pointer mb-4">
                  + Add More (Max 10)
                  <input
                    id="add-more"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files);
                      if (files.length + newFiles.length > 10) {
                        toast.error('Maximum 10 images allowed');
                        return;
                      }
                      handleFileChange(e);
                    }}
                    className="hidden"
                  />
                </label>
              )}

              {/* Recording Controls */}
              {isRecording && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-red-500 text-white rounded-full">REC {String(recordSeconds).padStart(2,'0')}s</span>
                  <button type="button" onClick={stopCameraRecording} className="btn-secondary">Stop</button>
                </div>
              )}

              {/* Simple Video Editor */}
              {category !== 'image' && previews.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                  <p className="text-sm font-semibold dark:text-white">Simple Editor</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Start (sec)</label>
                      <input type="number" min="0" value={videoStartSec} onChange={(e)=>setVideoStartSec(parseInt(e.target.value||'0',10))} className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">End (sec)</label>
                      <input type="number" min="0" value={videoEndSec} onChange={(e)=>setVideoEndSec(parseInt(e.target.value||'0',10))} className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Speed</label>
                      <select value={playbackRate} onChange={(e)=>setPlaybackRate(parseFloat(e.target.value))} className="input-field">
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Note: Editing metadata is applied on playback; the uploaded file is not trimmed on server.</p>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title"
              className="input-field"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your content (supports #hashtags and @mentions)"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              maxLength={5000}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/5000</p>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Short social caption (optional)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <button
              type="button"
              onClick={() => {
                const tagList = (tags || '').split(',').map(t=>t.trim()).filter(Boolean);
                const auto = tagList.slice(0,3).map(t=>`#${t.replace(/\s+/g,'')}`).join(' ');
                setCaption(prev => prev ? prev : auto ? `${auto}\n` : '');
                toast.success('Caption suggested');
              }}
              className="mt-2 btn-outline"
            >
              Auto Caption
            </button>
          </div>

          {/* Location, Visibility & Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Details
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location..."
                className="input-field"
              />
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Visibility</label>
                <select value={visibility} onChange={(e)=>setVisibility(e.target.value)} className="input-field">
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={madeForKids} onChange={(e)=>setMadeForKids(e.target.checked)} />
                Made for kids
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allowComments} onChange={(e)=>setAllowComments(e.target.checked)} />
                Allow comments
              </label>
            </div>

            {/* Advanced Settings */}
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Schedule publish</label>
                  <input type="datetime-local" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Video language</label>
                  <select value={videoLanguage} onChange={(e)=>setVideoLanguage(e.target.value)} className="input-field">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ur">Urdu</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">License</label>
                  <select value={license} onChange={(e)=>setLicense(e.target.value)} className="input-field">
                    <option value="standard">Standard YouTube License</option>
                    <option value="creative_commons">Creative Commons</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Category</label>
                  <select value={topicCategory} onChange={(e)=>setTopicCategory(e.target.value)} className="input-field">
                    <option value="">Select category</option>
                    <option value="Education">Education</option>
                    <option value="Music">Music</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Comedy">Comedy</option>
                    <option value="News">News</option>
                    <option value="Sports">Sports</option>
                    <option value="Travel">Travel</option>
                    <option value="Tech">Tech</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Playlist</label>
                  <input type="text" value={playlistName} onChange={(e)=>setPlaylistName(e.target.value)} placeholder="Playlist name" className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Custom thumbnail</label>
                  <input type="file" accept="image/*" onChange={(e)=>{const f=e.target.files?.[0]; if(!f) return; if(!f.type.startsWith('image/')){toast.error('Only image files allowed'); return;} setThumbnailFile(f); const reader=new FileReader(); reader.onloadend=()=>setThumbnailPreview(reader.result); reader.readAsDataURL(f);}} className="input-field" />
                </div>
              </div>
              {thumbnailPreview && (
                <div className="mt-2">
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-40 h-24 object-cover rounded border" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Latitude (optional)</label>
                  <input type="number" value={locationLat} onChange={(e)=>setLocationLat(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Longitude (optional)</label>
                  <input type="number" value={locationLng} onChange={(e)=>setLocationLng(e.target.value)} className="input-field" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={paidPromotion} onChange={(e)=>setPaidPromotion(e.target.checked)} />
                  Contains paid promotion
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ageRestricted} onChange={(e)=>setAgeRestricted(e.target.checked)} />
                  Age-restricted (18+)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={allowEmbedding} onChange={(e)=>setAllowEmbedding(e.target.checked)} />
                  Allow embedding
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="nature, travel, food"
              className="input-field"
            />
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Pro Tips:</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 ml-5 list-disc">
              <li>Use #hashtags to reach more people</li>
              <li>Mention @username to tag someone</li>
              <li>Upload up to 10 images/videos</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading || files.length === 0}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Uploading...' : `Share ${files.length > 1 ? `${files.length} items` : 'Post'}`}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
