import React, { useState, useEffect, useMemo } from 'react';
import { 
  Menu, Search, Bell, Upload, User, Home, Compass, 
  PlaySquare, Clock, ThumbsUp, MessageSquare, MoreVertical, 
  X, LogOut, Sun, Moon, Film, Radio, ChevronDown, CheckCircle,
  History, Settings, Share2, Flag, Monitor
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  signOut,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  increment,
  getDoc,
  serverTimestamp,
  limit
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- UTILITIES ---
const formatTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); 
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
};

const formatViews = (views) => {
  if (!views) return '0';
  if (views < 1000) return views.toString();
  if (views < 1000000) return (views / 1000).toFixed(1) + 'K';
  return (views / 1000000).toFixed(1) + 'M';
};

const generateAvatar = (name) => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff`;

// --- COMPONENTS ---

const Sidebar = ({ isOpen, currentView, onViewChange, isMobile }) => {
  const mainItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'trending', icon: Compass, label: 'Trending' },
    { id: 'subscriptions', icon: PlaySquare, label: 'Subscriptions' },
  ];

  const secondaryItems = [
    { id: 'library', icon: Radio, label: 'Library' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'liked', icon: ThumbsUp, label: 'Liked Videos' },
  ];

  if (isMobile && !isOpen) return null;

  return (
    <aside className={`
      fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white dark:bg-[#0f0f0f] 
      overflow-y-auto custom-scrollbar z-40 transition-all duration-300
      ${isOpen ? 'w-60' : 'w-0 lg:w-20'} 
      border-r border-gray-200 dark:border-gray-800
    `}>
      <div className="p-3 space-y-1">
        {mainItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`
              flex items-center w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
              ${currentView === item.id ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''}
              ${!isOpen ? 'lg:justify-center' : ''}
            `}
          >
            <item.icon size={22} className={currentView === item.id ? 'text-red-600' : 'text-gray-900 dark:text-white'} />
            <span className={`ml-5 text-sm ${!isOpen ? 'lg:hidden' : ''} text-gray-900 dark:text-white whitespace-nowrap`}>
              {item.label}
            </span>
          </button>
        ))}
        
        {isOpen && (
          <>
            <div className="my-3 border-t border-gray-200 dark:border-gray-800 mx-2" />
            <div className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-400">
              You
            </div>
            {secondaryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  flex items-center w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                  ${currentView === item.id ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''}
                `}
              >
                <item.icon size={22} className={currentView === item.id ? 'text-red-600' : 'text-gray-900 dark:text-white'} />
                <span className="ml-5 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            ))}
            
            <div className="my-3 border-t border-gray-200 dark:border-gray-800 mx-2" />
            <div className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-400">
              Explore
            </div>
            {['Gaming', 'Music', 'Sports', 'News'].map(cat => (
              <button key={cat} className="flex items-center w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                 <span className="text-sm text-gray-900 dark:text-white ml-2">{cat}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
};

const VideoCard = ({ video, onClick, layout = 'grid' }) => {
  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer flex ${layout === 'row' ? 'gap-4' : 'flex-col gap-3'}`}
    >
      <div className={`
        relative overflow-hidden bg-gray-800 rounded-xl
        ${layout === 'row' ? 'w-40 sm:w-64 aspect-video shrink-0' : 'aspect-video w-full'}
      `}>
        <img 
          src={video.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80"} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => e.target.src = 'https://via.placeholder.com/640x360?text=No+Thumbnail'}
        />
        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          {video.duration || "12:45"}
        </div>
      </div>
      
      <div className={`flex gap-3 ${layout === 'row' ? 'py-1' : 'px-1'}`}>
        {layout !== 'row' && (
          <img 
            src={video.uploaderAvatar || generateAvatar(video.uploaderName)} 
            className="w-9 h-9 rounded-full mt-0.5 bg-gray-700 shrink-0"
            alt="Avatar"
          />
        )}
        <div className="flex flex-col min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-blue-500 transition-colors">
            {video.title}
          </h3>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            <div className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors">
              {video.uploaderName || "Unknown Channel"}
              <CheckCircle size={12} className="ml-1 text-gray-400" />
            </div>
            <div className="flex items-center mt-0.5">
              <span>{formatViews(video.views)} views</span>
              <span className="mx-1.5">•</span>
              <span>{formatTime(video.createdAt)}</span>
            </div>
            {layout === 'row' && video.description && (
              <p className="mt-2 text-xs line-clamp-2 hidden sm:block">{video.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChannelPage = ({ channelId, currentUserId, onVideoClick }) => {
  const [channelData, setChannelData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    // Ideally fetch user profile doc, here we simulate with queries
    const fetchChannel = async () => {
      // 1. Get Videos
      const q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'videos'),
        where('uploaderId', '==', channelId),
        orderBy('createdAt', 'desc')
      );
      
      try {
        const snapshot = await new Promise((resolve, reject) => {
          const unsub = onSnapshot(q, resolve, reject);
        });
        
        const vids = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
        setVideos(vids);
        
        if (vids.length > 0) {
          setChannelData({
            name: vids[0].uploaderName,
            avatar: vids[0].uploaderAvatar,
            subscribers: 125000, // Mock
            description: "Welcome to my official channel! I create tech and coding tutorials.",
            banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80"
          });
        }
        setLoading(false);
      } catch (e) {
        console.error("Channel load error", e);
        setLoading(false);
      }
    };
    fetchChannel();
  }, [channelId]);

  if (loading) return <div className="p-8 text-center">Loading Channel...</div>;
  if (!channelData) return <div className="p-8 text-center">Channel not found</div>;

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="h-32 sm:h-56 w-full bg-gray-800 overflow-hidden">
        <img src={channelData.banner} alt="Banner" className="w-full h-full object-cover" />
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-8 sm:mt-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-[#0f0f0f] overflow-hidden bg-black z-10 shrink-0">
             <img src={channelData.avatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0 space-y-2">
             <h1 className="text-2xl sm:text-3xl font-bold">{channelData.name}</h1>
             <div className="text-sm text-gray-500 flex flex-wrap justify-center sm:justify-start gap-x-2">
               <span>@{channelData.name.replace(/\s/g, '').toLowerCase()}</span>
               <span>•</span>
               <span>{formatViews(channelData.subscribers)} subscribers</span>
               <span>•</span>
               <span>{videos.length} videos</span>
             </div>
             <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl line-clamp-2">
               {channelData.description}
             </p>
             <button className="mt-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
               Subscribe
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mt-8 mb-6 overflow-x-auto">
          {['Home', 'Videos', 'Shorts', 'Playlists', 'Community'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.toLowerCase() 
                  ? 'border-black dark:border-white text-black dark:text-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} onClick={() => onVideoClick(video)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const WatchPage = ({ video, currentUser, onBack, onChannelClick }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likes, setLikes] = useState(video.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    if (!video) return;
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', `comments_${video.id}`),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    try {
      updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'videos', video.id), {
        views: increment(1)
      });
      // Save to history
      if (currentUser) {
        // Implementation for history saving would go here
      }
    } catch(e) { console.warn("Stat update skipped"); }

    return () => unsub();
  }, [video, currentUser]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please login to comment");
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', `comments_${video.id}`), {
        text: newComment,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        userAvatar: currentUser.photoURL,
        createdAt: serverTimestamp()
      });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-[1700px] mx-auto w-full">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative w-full">
          {video.url.includes('youtube') || video.url.includes('youtu.be') ? (
             <iframe 
               src={`https://www.youtube.com/embed/${video.url.split('/').pop().replace('watch?v=', '')}?autoplay=1`}
               className="w-full h-full"
               allowFullScreen
               title={video.title}
             />
          ) : (
            <video controls autoPlay className="w-full h-full">
              <source src={video.url} type="video/mp4" />
            </video>
          )}
        </div>

        <h1 className="text-xl font-bold mt-4 text-gray-900 dark:text-white line-clamp-2">{video.title}</h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 pb-4 border-b border-gray-200 dark:border-gray-800 gap-4">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => onChannelClick(video.uploaderId)}>
            <img 
              src={video.uploaderAvatar || generateAvatar(video.uploaderName)} 
              className="w-10 h-10 rounded-full bg-gray-700" 
              alt=""
            />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white hover:text-gray-700">{video.uploaderName}</h3>
              <p className="text-xs text-gray-500">125K subscribers</p>
            </div>
            <button className="ml-4 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Subscribe
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center bg-gray-100 dark:bg-[#222] rounded-full">
              <button 
                onClick={() => { setLikes(l => hasLiked ? l-1 : l+1); setHasLiked(!hasLiked); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-l-full border-r border-gray-300 dark:border-gray-700"
              >
                <ThumbsUp size={18} className={hasLiked ? "fill-current" : ""} />
                <span className="text-sm font-medium">{formatViews(likes)}</span>
              </button>
              <button className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-r-full">
                 <ThumbsUp size={18} className="rotate-180" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#222] rounded-full hover:bg-gray-200 dark:hover:bg-[#333]">
              <Share2 size={18} />
              <span className="text-sm font-medium hidden sm:inline">Share</span>
            </button>
            <button className="p-2 bg-gray-100 dark:bg-[#222] rounded-full hover:bg-gray-200 dark:hover:bg-[#333]">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 bg-gray-100 dark:bg-[#222] p-3 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-[#333] transition-colors" onClick={() => setIsDescExpanded(!isDescExpanded)}>
           <div className="flex gap-2 text-sm font-bold mb-1">
             <span>{formatViews(video.views)} views</span>
             <span>{formatTime(video.createdAt)}</span>
           </div>
           <p className={`text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap ${!isDescExpanded ? 'line-clamp-2' : ''}`}>
             {video.description || "No description provided."}
           </p>
           <button className="text-sm font-bold mt-1 text-gray-600 dark:text-gray-400">
             {isDescExpanded ? 'Show less' : 'Show more'}
           </button>
        </div>

        <div className="mt-6 hidden lg:block">
          <h3 className="text-xl font-bold mb-6">{comments.length} Comments</h3>
          <div className="flex gap-4 mb-8">
            <img 
              src={currentUser?.photoURL || generateAvatar('Guest')} 
              className="w-10 h-10 rounded-full bg-gray-700" 
              alt=""
            />
            <form onSubmit={handleComment} className="flex-1">
              <input 
                type="text" 
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none pb-2 transition-colors"
              />
              <div className="flex justify-end mt-2 gap-2">
                 <button 
                   type="button"
                   onClick={() => setNewComment("")}
                   className="px-4 py-2 text-sm font-medium rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   disabled={!newComment.trim()}
                   className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Comment
                 </button>
              </div>
            </form>
          </div>
          
          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <img 
                  src={comment.userAvatar || generateAvatar(comment.userName)} 
                  className="w-10 h-10 rounded-full bg-gray-700" 
                  alt=""
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.userName}</span>
                    <span className="text-xs text-gray-500">{formatTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{comment.text}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs hover:text-gray-800 dark:hover:text-white">
                      <ThumbsUp size={14} /> <span>12</span>
                    </button>
                    <button className="text-gray-500 dark:text-gray-400 text-xs hover:text-gray-800 dark:hover:text-white">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Videos */}
      <div className="lg:w-[400px] w-full flex flex-col gap-3">
         {/* Mobile Comments Toggle could go here */}
         <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {['All', 'From ' + video.uploaderName, 'Related', 'Recently Uploaded'].map(pill => (
              <button key={pill} className="px-3 py-1.5 bg-gray-100 dark:bg-[#222] rounded-lg text-sm whitespace-nowrap">
                {pill}
              </button>
            ))}
         </div>
         {/* We reuse VideoCard in row layout for suggestion list logic */}
         <div className="p-4 bg-gray-100 dark:bg-[#222] rounded-xl text-center text-sm text-gray-500 my-2">
            Playing Next feature enabled
         </div>
         {/* This would be a filtered list in a real app */}
         <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse flex gap-2">
                 <div className="w-40 aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl" />
                 <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const UploadPage = ({ currentUser, onCancel, onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please login");
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'videos'), {
        ...formData,
        uploaderId: currentUser.uid,
        uploaderName: currentUser.displayName || 'Anonymous',
        uploaderAvatar: currentUser.photoURL,
        views: 0,
        likes: 0,
        createdAt: serverTimestamp()
      });
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error", error);
      alert("Failed to upload info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 w-full">
      <div className="flex items-center justify-between mb-6">
         <h1 className="text-2xl font-bold">Upload Video</h1>
         <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
           <X size={24} />
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
             <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center bg-gray-50 dark:bg-[#1f1f1f]">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload size={32} className="text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">Drag and drop video files to upload</p>
                <p className="text-xs text-gray-400 mt-2">Your videos will be private until you publish them.</p>
             </div>
             
             <div>
                <label className="block text-sm font-medium mb-1.5">Title (required)</label>
                <input 
                  required
                  placeholder="Add a title that describes your video"
                  className="w-full p-3 rounded-lg bg-transparent border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
             </div>
             
             <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea 
                  placeholder="Tell viewers about your video"
                  className="w-full p-3 rounded-lg bg-transparent border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none h-32 resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1.5">Video URL</label>
                  <input 
                    required
                    placeholder="https://..."
                    className="w-full p-3 rounded-lg bg-transparent border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none"
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1.5">Thumbnail URL</label>
                  <input 
                    placeholder="https://..."
                    className="w-full p-3 rounded-lg bg-transparent border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none"
                    value={formData.thumbnail}
                    onChange={e => setFormData({...formData, thumbnail: e.target.value})}
                  />
               </div>
             </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Publish'}
            </button>
          </div>
        </form>

        <div className="lg:col-span-1">
           <div className="bg-gray-100 dark:bg-[#1f1f1f] rounded-xl overflow-hidden sticky top-20">
              <div className="aspect-video bg-black relative">
                 {formData.thumbnail ? (
                   <img src={formData.thumbnail} className="w-full h-full object-cover opacity-70" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Thumbnail</div>
                 )}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <PlaySquare size={48} className="text-white opacity-80" />
                 </div>
              </div>
              <div className="p-4 space-y-3">
                 <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                 <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                 <div className="flex items-center gap-2 mt-4">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN CONTROLLER ---

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Navigation State
  const [view, setView] = useState('home'); // home, watch, upload, channel, results, history
  const [viewParams, setViewParams] = useState({}); // e.g. { videoId: '...', channelId: '...' }
  const [activeTab, setActiveTab] = useState('all');
  
  // Data State
  const [currentUser, setCurrentUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // History & Liked (Local Simulation for immediate UI, would be Firestore in real implementation)
  const [watchHistory, setWatchHistory] = useState([]);

  // Theme
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // CRITICAL FIX: Auto-login anonymously to ensure Firestore reads are permitted
          await signInAnonymously(auth);
        }
      } catch (e) { console.warn("Auth initialization failed", e); }
    };
    initAuth();
    
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
    });
  }, []);

  // Fetch Main Feed
  useEffect(() => {
    // CRITICAL FIX: Guard against querying before auth is ready
    if (!authInitialized || !currentUser) return;

    let q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'videos'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (view === 'trending') {
       q = query(
        collection(db, 'artifacts', appId, 'public', 'data', 'videos'),
        orderBy('views', 'desc'),
        limit(50)
      );
    }
    
    setLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(vids);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [view, authInitialized, currentUser]);

  // Handlers
  const handleVideoClick = (video) => {
    setView('watch');
    setViewParams({ video });
    // Add to history
    setWatchHistory(prev => [video, ...prev.filter(v => v.id !== video.id)].slice(0, 20));
    window.scrollTo(0, 0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setView('results');
      // In a real app with Algolia/ElasticSearch, we'd fetch here.
      // For this demo, we filter client-side the fetched videos + some mocks
    }
  };

  const filteredVideos = useMemo(() => {
    if (view === 'results') {
      return videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (view === 'subscriptions') {
      // Mock sub logic
      return videos.slice(0, 5); 
    }
    if (view === 'history') {
      return watchHistory;
    }
    if (activeTab !== 'all') {
      // Mock category filtering
      return videos.filter((_, i) => i % 2 === 0);
    }
    return videos;
  }, [view, videos, searchQuery, watchHistory, activeTab]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white font-sans transition-colors duration-200">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-gray-800 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <Menu size={20} />
          </button>
          <div onClick={() => { setView('home'); setSearchQuery(''); }} className="flex items-center gap-1 cursor-pointer">
            <div className="bg-red-600 text-white p-1 rounded-lg">
              <PlaySquare size={20} fill="white" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">Nexus<span className="text-red-600">Stream</span></span>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-4 hidden md:flex justify-center">
          <form onSubmit={handleSearch} className="flex w-full max-w-[600px]">
            <div className="flex-1 flex items-center px-4 bg-gray-100 dark:bg-[#121212] border border-gray-300 dark:border-gray-700 rounded-l-full focus-within:border-blue-500 ml-8 shadow-inner">
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-transparent outline-none py-2 text-sm text-gray-900 dark:text-white"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="px-5 bg-gray-200 dark:bg-[#222] border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-full hover:bg-gray-300 dark:hover:bg-[#333]">
              <Search size={19} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button type="button" className="ml-3 p-2 bg-gray-100 dark:bg-[#181818] rounded-full hover:bg-gray-200 dark:hover:bg-[#303030]">
              <Radio size={19} className="text-gray-900 dark:text-white" />
            </button>
          </form>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full hidden sm:block">
             {darkMode ? <Sun size={22} /> : <Moon size={22} />}
           </button>
           
           {currentUser ? (
             <>
                <button onClick={() => setView('upload')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <Upload size={22} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <Bell size={22} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border-2 border-white dark:border-[#0f0f0f]"></span>
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#222] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2">
                       <div className="px-4 py-2 font-bold border-b border-gray-200 dark:border-gray-700">Notifications</div>
                       <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                    </div>
                  )}
                </div>
                <div className="relative group ml-2">
                  <button className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
                    <img src={currentUser.photoURL || generateAvatar(currentUser.displayName)} alt="Me" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#222] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hidden group-hover:block p-1">
                     <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <img src={currentUser.photoURL || generateAvatar(currentUser.displayName)} className="w-10 h-10 rounded-full" />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{currentUser.displayName || "User"}</p>
                          <p className="text-xs text-gray-500 truncate">{currentUser.email || "@user"}</p>
                        </div>
                     </div>
                     <button onClick={() => { setView('channel'); setViewParams({ channelId: currentUser.uid }); }} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-sm mt-1">
                       <Monitor size={18} /> Your Channel
                     </button>
                     <button className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-sm">
                       <Settings size={18} /> YouTube Studio
                     </button>
                     <button onClick={() => signOut(auth)} className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 text-sm mb-1 text-red-500">
                       <LogOut size={18} /> Sign Out
                     </button>
                  </div>
                </div>
             </>
           ) : (
             <button 
               onClick={() => setShowAuthModal(true)}
               className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium text-sm ml-2"
             >
               <User size={20} />
               <span className="hidden sm:inline">Sign In</span>
             </button>
           )}
        </div>
      </nav>

      <div className="flex pt-14 h-screen overflow-hidden">
        {/* SIDEBAR - Hidden on Watch Page */}
        {view !== 'watch' && (
           <Sidebar 
             isOpen={sidebarOpen} 
             currentView={view} 
             onViewChange={setView}
             isMobile={false}
           />
        )}

        {/* MAIN LAYOUT */}
        <main className={`
          flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0f0f0f]
          ${view !== 'watch' ? (sidebarOpen ? 'lg:ml-60 ml-0' : 'lg:ml-20 ml-0') : 'w-full'} 
          transition-all duration-300
        `}>
          
          {/* FEED VIEWS (Home, Trending, Results, etc.) */}
          {['home', 'trending', 'results', 'subscriptions', 'history'].includes(view) && (
            <div className="p-4 sm:p-6 pb-20">
              {view === 'results' && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Results for "{searchQuery}"</h2>
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                     <button className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium">All</button>
                     <button className="px-4 py-1.5 bg-gray-100 dark:bg-[#222] rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333]">Shorts</button>
                     <button className="px-4 py-1.5 bg-gray-100 dark:bg-[#222] rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333]">Channels</button>
                     <button className="px-4 py-1.5 bg-gray-100 dark:bg-[#222] rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#333]">Playlists</button>
                  </div>
                </div>
              )}

              {view === 'home' && (
                <div className="sticky top-0 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur z-30 -mt-6 pt-4 pb-4 px-0 mb-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800">
                   {['All', 'Gaming', 'Music', 'Live', 'Computer Programming', 'Podcasts', 'News', 'Cooking', 'Recently Uploaded'].map((cat, i) => (
                     <button 
                       key={i}
                       onClick={() => setActiveTab(cat.toLowerCase())}
                       className={`
                         px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                         ${(activeTab === 'all' && i === 0) || activeTab === cat.toLowerCase()
                           ? 'bg-black dark:bg-white text-white dark:text-black' 
                           : 'bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333]'
                         }
                       `}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-3">
                      <div className="aspect-video bg-gray-200 dark:bg-[#222] rounded-xl animate-pulse" />
                      <div className="flex gap-3">
                         <div className="w-9 h-9 bg-gray-200 dark:bg-[#222] rounded-full animate-pulse" />
                         <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-[#222] rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-gray-200 dark:bg-[#222] rounded w-1/2 animate-pulse" />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredVideos.length > 0 ? (
                <div className={`grid ${view === 'results' ? 'grid-cols-1 max-w-5xl' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-4 gap-y-8`}>
                  {filteredVideos.map(video => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      layout={view === 'results' ? 'row' : 'grid'}
                      onClick={() => handleVideoClick(video)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                  <Film size={64} className="mb-4 opacity-20" />
                  <p className="text-xl font-semibold">No videos found</p>
                  <p className="text-sm mt-2">Try searching for something else</p>
                </div>
              )}
            </div>
          )}

          {/* SINGLE PAGE VIEWS */}
          {view === 'watch' && viewParams.video && (
            <WatchPage 
              video={viewParams.video} 
              currentUser={currentUser} 
              onBack={() => setView('home')} 
              onChannelClick={(id) => { setView('channel'); setViewParams({ channelId: id }); }}
            />
          )}

          {view === 'channel' && viewParams.channelId && (
            <ChannelPage 
              channelId={viewParams.channelId} 
              currentUserId={currentUser?.uid} 
              onVideoClick={handleVideoClick} 
            />
          )}

          {view === 'upload' && (
            <UploadPage 
              currentUser={currentUser}
              onCancel={() => setView('home')}
              onUploadSuccess={() => setView('home')}
            />
          )}

        </main>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-md p-8 rounded-2xl shadow-2xl relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X size={20} />
            </button>
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-red-600">
                 <User size={32} />
               </div>
               <h2 className="text-2xl font-bold">Sign In</h2>
               <p className="text-gray-500 mt-2 text-sm">Join the community to comment, upload, and subscribe.</p>
            </div>
            <button 
              onClick={async () => {
                await signInAnonymously(auth);
                setShowAuthModal(false);
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mb-3"
            >
              Continue as Guest (Demo)
            </button>
            <p className="text-xs text-center text-gray-400 mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      )}
      
    </div>
  );
}