import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UserSideNav from "./UserSideNav";
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import "./ChatPage.css";
import API_BASE_URL from "../config/apiConfig";

const ChatPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('chatToken');
  const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = getToken();
    
    if (!storedUser || !token) {
      toast.error('Please login to access chat');
      navigate('/login');
      return;
    }

    setUser(storedUser);
    initializeSocket(token);
    loadUserData();
  }, [navigate]);

  const initializeSocket = (token) => {
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsOnline(true);
    });

    newSocket.on('disconnect', () => {
      setIsOnline(false);
    });

    newSocket.on('onlineUsers', (userIds) => {
      setOnlineUsers(userIds);
    });

    newSocket.on('receiveMessage', (message) => {
      // Add message to current thread if it matches
      setMessages((prev) => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });

      // Update unread count if not the selected user
      const senderId = message.sender?._id || message.sender;
      if (selectedUser !== senderId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }

      // Refresh conversations
      loadConversations();
    });

    newSocket.on('newFollowRequest', (data) => {
      toast.success(`New follow request from ${data.from}!`);
      loadPendingRequestsCount();
    });

    newSocket.on('adminBroadcast', (data) => {
      toast(`📢 Admin: ${data.message}`, { icon: '🎮', duration: 5000 });
    });

    newSocket.on('error', (error) => {
      toast.error(`Socket error: ${error.message}`);
    });

    setSocket(newSocket);
  };

  const loadConversations = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/conversations`, { headers: getHeaders() });
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  const loadPendingRequestsCount = async () => {
    try {
      const pendingResponse = await axios.get(`${API_BASE_URL}/api/follow/pending`, { headers: getHeaders() });
      setPendingRequestsCount(pendingResponse.data.length);
    } catch (error) {
      console.error('Failed to load pending requests count:', error);
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      await loadConversations();
      
      const suggestionsResponse = await axios.get(`${API_BASE_URL}/api/users/suggested`, { headers: getHeaders() });
      setSuggestedUsers(suggestionsResponse.data);
      
      await loadPendingRequestsCount();
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      setMessages([]);
      setSelectedUser(userId);
      setUnreadCounts((prev) => ({ ...prev, [userId]: 0 }));

      // Load user info
      const userInfo = suggestedUsers.find(u => u.id === userId) || 
                      searchResults.find(u => u.id === userId) ||
                      conversations.find(c => c.user.id === userId)?.user;
      if (userInfo) {
        setSelectedUserInfo(userInfo);
      }

      // Fetch message history
      const res = await axios.get(`${API_BASE_URL}/api/messages/${userId}`, { headers: getHeaders() });
      setMessages(res.data);

      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/search?q=${searchQuery}`, { headers: getHeaders() });
      setSearchResults(response.data);
      toast.success(`Found ${response.data.length} players`);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) {
      toast.error('Please select a user and type a message');
      return;
    }

    setSendingMessage(true);
    
    socket.emit("sendMessage", {
      receiverId: selectedUser,
      content: newMessage,
    }, (response) => {
      if (response?.ok) {
        setNewMessage("");
        // Message already added via receiveMessage event
      } else {
        toast.error(response?.error || 'Failed to send message');
      }
      setSendingMessage(false);
    });
  };

  const handleFollowRequest = async (userId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/follow/request`, { userId }, { headers: getHeaders() });
      
      if (socket) {
        socket.emit("followRequestSent", { receiverId: userId });
      }
      
      toast.success('Follow request sent!');
      loadUserData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/follow/cancel`, { userId }, { headers: getHeaders() });
      toast.success('Request cancelled');
      loadUserData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel request");
    }
  };

  const handleStartChat = (result) => {
    setActiveTab("chat");
    loadMessages(result.id);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="chat-page-wrapper">
        <UserSideNav />
        <div className="chat-loading-wrapper">
          <div className="chat-loading-spinner"></div>
          <p className="chat-loading-text">Connecting to Squad Command...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="chat-loading-state">Initializing Secure Connection...</div>;
  }

  return (
    <div className="chat-page-wrapper">
      <UserSideNav />
      
      <div className="chat-container">
        {/* LEFT PANEL - Squad List */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-user-info">
              <h2 className="sidebar-username">@{user.username}</h2>
              <div className="connection-status">
                <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                <span className="status-text">{isOnline ? 'Online' : 'Connecting...'}</span>
              </div>
            </div>
            {pendingRequestsCount > 0 && (
              <div className="pending-requests-badge">{pendingRequestsCount}</div>
            )}
          </div>

          <nav className="sidebar-tabs">
            <button 
              className={`chat-tab-btn ${activeTab === "chat" ? "active" : ""}`} 
              onClick={() => setActiveTab("chat")}
            >
              💬 Chats
            </button>
            <button 
              className={`chat-tab-btn ${activeTab === "suggestions" ? "active" : ""}`} 
              onClick={() => setActiveTab("suggestions")}
            >
              🔥 Squad
            </button>
            <button 
              className={`chat-tab-btn ${activeTab === "search" ? "active" : ""}`} 
              onClick={() => setActiveTab("search")}
            >
              🔍 Find
            </button>
          </nav>

          {/* CHATS TAB */}
          {activeTab === "chat" && (
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="empty-icon">💬</div>
                  <p>No conversations yet</p>
                  <p className="empty-sub">Find players in Squad or Find tabs</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.user.id}
                    className={`conversation-item ${selectedUser === conv.user.id ? "active" : ""}`}
                    onClick={() => loadMessages(conv.user.id)}
                  >
                    <div className="conversation-item-content">
                      <div className="chat-avatar">
                        {conv.user.username.charAt(0).toUpperCase()}
                        {onlineUsers.includes(conv.user.id) && <span className="avatar-online-dot"></span>}
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-name">
                          <span className="name-text">{conv.user.firstName} {conv.user.lastName}</span>
                          {unreadCounts[conv.user.id] > 0 && (
                            <span className="unread-badge">{unreadCounts[conv.user.id]}</span>
                          )}
                        </div>
                        <div className="conversation-last-message">
                          <span className="message-preview">
                            {conv.lastMessage.isSender && "You: "}
                            {conv.lastMessage.content}
                          </span>
                          <span className="conversation-time">{formatTime(conv.lastMessage.time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SUGGESTIONS TAB */}
          {activeTab === "suggestions" && (
            <div className="sidebar-search-container">
              <div className="sidebar-section-header">
                <h3 className="sidebar-section-title">🔥 Squad Suggestions</h3>
                <button className="chat-refresh-btn" onClick={loadUserData}>⟳ Sync</button>
              </div>
              <div className="search-results-list">
                {suggestedUsers.length === 0 ? (
                  <div className="chat-empty-state">
                    <div className="empty-icon">🎮</div>
                    <p>No suggestions available</p>
                  </div>
                ) : (
                  suggestedUsers.map((result) => (
                    <div key={result.id} className="search-result-item">
                      <div className="chat-avatar">{result.username.charAt(0).toUpperCase()}</div>
                      <div className="search-result-info">
                        <div className="search-result-name">{result.firstName} {result.lastName}</div>
                        <div className="search-result-username">@{result.username}</div>
                        <div className="search-result-meta">👥 {result.followers} followers</div>
                      </div>
                      <div className="result-action-btns">
                        <button className="chat-message-btn" onClick={() => handleStartChat(result)}>💬</button>
                        {result.isFollowing ? (
                          <button className="chat-following-btn" disabled>✓</button>
                        ) : result.hasRequested ? (
                          <button className="chat-cancel-btn" onClick={() => handleCancelRequest(result.id)}>✕</button>
                        ) : (
                          <button className="chat-follow-btn" onClick={() => handleFollowRequest(result.id)}>+</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SEARCH TAB */}
          {activeTab === "search" && (
            <div className="sidebar-search-container">
              <div className="sidebar-search-box">
                <input
                  type="text"
                  placeholder="Find players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="chat-search-input"
                />
                <button onClick={handleSearch} className="chat-search-submit">🔍</button>
              </div>
              <div className="search-results-list">
                {searchResults.length === 0 && searchQuery ? (
                  <div className="chat-empty-state">
                    <div className="empty-icon">🔍</div>
                    <p>No players found</p>
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <div key={result.id} className="search-result-item">
                      <div className="chat-avatar">{result.username.charAt(0).toUpperCase()}</div>
                      <div className="search-result-info">
                        <div className="search-result-name">{result.firstName} {result.lastName}</div>
                        <div className="search-result-username">@{result.username}</div>
                        {result.teamName && <div className="search-result-team">🏆 Team: {result.teamName}</div>}
                        {result.foundVia && <div className="search-result-tournament">🎮 Found via: {result.foundVia}</div>}
                      </div>
                      <div className="result-action-btns">
                        <button className="chat-message-btn" onClick={() => handleStartChat(result)}>💬</button>
                        {result.isFollowing ? (
                          <button className="chat-following-btn" disabled>✓</button>
                        ) : result.hasRequested ? (
                          <button className="chat-cancel-btn" onClick={() => handleCancelRequest(result.id)}>✕</button>
                        ) : (
                          <button className="chat-follow-btn" onClick={() => handleFollowRequest(result.id)}>+</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>

        {/* MAIN CHAT AREA */}
        <main className="chat-main-area">
          {selectedUser ? (
            <>
              <header className="chat-header">
                <div className="chat-header-avatar">
                  {selectedUserInfo?.username?.charAt(0).toUpperCase() || '?'}
                  {onlineUsers.includes(selectedUser) && <span className="header-online-dot"></span>}
                </div>
                <div className="chat-header-info">
                  <h3 className="chat-header-name">
                    {selectedUserInfo?.firstName} {selectedUserInfo?.lastName}
                  </h3>
                  <p className="chat-header-username">@{selectedUserInfo?.username}</p>
                </div>
                <div className="chat-header-status">
                  {onlineUsers.includes(selectedUser) ? '🟢 Online' : '⚪ Offline'}
                </div>
              </header>
              
              <div className="chat-messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <div className="no-messages-icon">💬</div>
                    <p>Start the conversation!</p>
                    <p className="no-messages-sub">Say hello to your squad mate</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const isSent = senderId === user._id;
                    return (
                      <div 
                        key={msg._id} 
                        className={`message-bubble-wrapper ${isSent ? "sent" : "received"}`}
                      >
                        <div className="message-content">
                          <div className="message-text">{msg.content}</div>
                          <div className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="chat-typing-input"
                  disabled={sendingMessage}
                />
                <button type="submit" className="chat-send-btn" disabled={sendingMessage || !newMessage.trim()}>
                  {sendingMessage ? '...' : '🚀'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon">💬</div>
              <h3>Squad Command</h3>
              <p>Connect with your squad and coordinate your next tournament.</p>
              <div className="no-chat-tips">
                <p>💡 Tip: Use Squad or Find tabs to discover players</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
