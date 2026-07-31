import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserSideNav from "./UserSideNav";
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import "./ChatPage.css"; 

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token') || localStorage.getItem('chatToken');
    
    if (!storedUser || !token) {
      toast.error('Please login to access chat');
      navigate('/login');
      return;
    }

    setUser(storedUser);
    initializeSocket(token);
    loadUserData(token);
  }, [navigate]);

  const initializeSocket = (token) => {
    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsOnline(true);
      toast.success('Connected to chat server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsOnline(false);
    });

    newSocket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      setUnreadCounts((prev) => ({
        ...prev,
        [message.sender._id]: (prev[message.sender._id] || 0) + 1,
      }));
      
      if (selectedUser === message.sender._id) {
        scrollToBottom();
      }
    });

    newSocket.on('newFollowRequest', (data) => {
      toast.success(`New follow request from ${data.from}!`);
      loadPendingRequestsCount();
    });

    newSocket.on('adminBroadcast', (data) => {
      toast(`📢 Admin: ${data.message}`, {
        icon: '🎮',
        duration: 5000,
      });
    });

    newSocket.on('error', (error) => {
      toast.error(`Socket error: ${error.message}`);
    });

    setSocket(newSocket);
  };

  const loadPendingRequestsCount = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('chatToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const pendingResponse = await axios.get('http://localhost:5000/api/follow/pending', { headers });
      setPendingRequestsCount(pendingResponse.data.length);
    } catch (error) {
      console.error('Failed to load pending requests count:', error);
    }
  };

  const loadUserData = async (token) => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      setConversations([]);
      
      const suggestionsResponse = await axios.get('http://localhost:5000/api/users/suggested', { headers });
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
      setUnreadCounts((prev) => ({
        ...prev,
        [userId]: 0,
      }));
      
      // Load user info for chat header
      const userInfo = suggestedUsers.find(u => u.id === userId) || 
                      searchResults.find(u => u.id === userId);
      if (userInfo) {
        setSelectedUserInfo(userInfo);
      }
      
      // Focus input after loading
      setTimeout(() => {
        inputRef.current?.focus();
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
      const token = localStorage.getItem('token') || localStorage.getItem('chatToken');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:5000/api/users/search?q=${searchQuery}`, { headers });
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
    }, (error) => {
      if (error) {
        toast.error('Failed to send message');
      } else {
        setNewMessage("");
        toast.success('Message sent');
      }
      setSendingMessage(false);
    });
  };

  const handleFollowRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('chatToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post('http://localhost:5000/api/follow/request', { userId }, { headers });
      
      if (socket) {
        socket.emit("followRequestSent", { receiverId: userId });
      }
      
      toast.success('Follow request sent!');
      loadUserData(token);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('chatToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post('http://localhost:5000/api/follow/cancel', { userId }, { headers });
      
      toast.success('Request cancelled');
      loadUserData(token);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel request");
    }
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

  if (loading) {
    return (
      <div className="chat-page-wrapper">
        <UserSideNav />
        <div className="chat-loading-wrapper">
          <div className="chat-loading-spinner"></div>
          <p className="chat-loading-text">Connecting to Squad Hub...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="chat-loading-state">Initializing Secure Connection...</div>;
  }

  return (
    <div className="chat-page-wrapper">
      {/* Top Navigation */}
      <UserSideNav />
      
      {/* Main Chat Layout */}
      <div className="chat-layout-container">
        
        {/* SIDEBAR */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-user-info">
              <h2 className="sidebar-username">@{user.username}</h2>
              <div className="connection-status">
                <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                <span className="status-text">{isOnline ? 'Online' : 'Connecting...'}</span>
              </div>
            </div>
            {pendingRequestsCount > 0 && (
              <div className="pending-requests-badge">
                {pendingRequestsCount}
              </div>
            )}
          </div>

          <div className="sidebar-tabs">
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
              🔥 Suggested
            </button>
            <button
              className={`chat-tab-btn ${activeTab === "search" ? "active" : ""}`}
              onClick={() => setActiveTab("search")}
            >
              🔍 Search
            </button>
          </div>

          {/* CHATS TAB */}
          {activeTab === "chat" && (
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="empty-icon">💬</div>
                  <p>No conversations yet</p>
                  <p className="empty-sub">Find players in Suggested or Search</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.user.id}
                    className={`conversation-item ${selectedUser === conv.user.id ? "active" : ""}`}
                    onClick={() => loadMessages(conv.user.id)}
                  >
                    <div className="chat-avatar">
                      {conv.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-name">
                        {conv.user.firstName} {conv.user.lastName}
                        {unreadCounts[conv.user.id] > 0 && (
                          <span className="unread-badge">{unreadCounts[conv.user.id]}</span>
                        )}
                      </div>
                      <div className="conversation-last-message">
                        {conv.lastMessage.isSender && "You: "}
                        {conv.lastMessage.content}
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
                <h3 className="sidebar-section-title">🔥 Suggested Players</h3>
                <button className="chat-refresh-btn" onClick={() => loadUserData(localStorage.getItem('token'))}>
                  ⟳ Sync
                </button>
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
                      <div className="chat-avatar">
                        {result.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="search-result-info">
                        <div className="search-result-name">
                          {result.firstName} {result.lastName}
                        </div>
                        <div className="search-result-username">@{result.username}</div>
                        <div className="search-result-meta">👥 {result.followers} followers</div>
                      </div>
                      <div className="result-action-btns">
                        {result.isFollowing ? (
                          <button className="chat-following-btn" disabled>✓ Following</button>
                        ) : result.hasRequested ? (
                          <button className="chat-cancel-btn" onClick={() => handleCancelRequest(result.id)}>
                            ✕ Cancel
                          </button>
                        ) : (
                          <button className="chat-follow-btn" onClick={() => handleFollowRequest(result.id)}>
                            + Follow
                          </button>
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
                <button onClick={handleSearch} className="chat-search-submit">
                  🔍
                </button>
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
                      <div className="chat-avatar">
                        {result.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="search-result-info">
                        <div className="search-result-name">
                          {result.firstName} {result.lastName}
                        </div>
                        <div className="search-result-username">@{result.username}</div>
                        {result.teamName && (
                          <div className="search-result-team">🏆 Team: {result.teamName}</div>
                        )}
                        {result.foundVia && (
                          <div className="search-result-tournament">🎮 Found via: {result.foundVia}</div>
                        )}
                      </div>
                      <div className="result-action-btns">
                        {result.isFollowing ? (
                          <button className="chat-following-btn" disabled>✓ Following</button>
                        ) : result.hasRequested ? (
                          <button className="chat-cancel-btn" onClick={() => handleCancelRequest(result.id)}>
                            ✕ Cancel
                          </button>
                        ) : (
                          <button className="chat-follow-btn" onClick={() => handleFollowRequest(result.id)}>
                            + Follow
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* MAIN CHAT AREA */}
        <div className="chat-main-area">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <div className="chat-header-avatar">
                  {selectedUserInfo?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="chat-header-info">
                  <h3 className="chat-header-name">
                    {selectedUserInfo?.firstName} {selectedUserInfo?.lastName}
                  </h3>
                  <p className="chat-header-username">@{selectedUserInfo?.username}</p>
                </div>
              </div>
              
              <div className="chat-messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <div className="no-messages-icon">💬</div>
                    <p>Start the conversation!</p>
                    <p className="no-messages-sub">Say hello to your squad mate</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.sender._id === user._id;
                    return (
                      <div key={msg._id} className={`message-bubble-wrapper ${isSent ? "sent" : "received"}`}>
                        <div className="message-content">{msg.content}</div>
                        <div className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <h3>Squad Hub</h3>
              <p>Connect with your squad and coordinate your next tournament.</p>
              <div className="no-chat-tips">
                <p>💡 Tip: Use Suggested or Search to find players</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;