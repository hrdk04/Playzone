import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import theme from "../theme";
import UserSideNav from "./UserSideNav";
import io from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

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
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // ✅ CRITICAL: Use refs to track current chat state in socket handlers
  const selectedUserRef = useRef(selectedUser);
  const userRef = useRef(user);

  // Keep refs updated
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ============================
  // 📱 RESPONSIVE HANDLER
  // ============================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && selectedUser) {
        setShowSidebar(false);
      } else if (!mobile) {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [selectedUser]);

  // ============================
  // 🔥 INITIALIZATION
  // ============================
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      console.error('❌ No user or token found, redirecting to login');
      navigate('/login');
      return;
    }

    console.log('✅ User found:', storedUser);
    setUser(storedUser);
    initializeSocket(token, storedUser);
    loadUserData(token);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [navigate]);

  // ============================
  // 🌐 SOCKET INITIALIZATION (COMPLETELY FIXED)
  // ============================
  const initializeSocket = (token, currentUser) => {
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
    });

    // ✅ FIXED: This is the key handler for auto-displaying messages
    newSocket.on('receiveMessage', (message) => {
      console.log('📩 NEW MESSAGE RECEIVED:', {
        from: message.sender._id,
        to: message.receiver._id,
        content: message.content,
        currentUser: userRef.current?._id,
        selectedUser: selectedUserRef.current
      });
      
      // Get current state from refs
      const currentUserId = userRef.current?._id;
      const currentSelectedUser = selectedUserRef.current;
      
      // ✅ Check if this message is part of the currently open conversation
      const isSentByMe = message.sender._id === currentUserId;
      const isSentToMe = message.receiver._id === currentUserId;
      const isSentBySelected = message.sender._id === currentSelectedUser;
      const isSentToSelected = message.receiver._id === currentSelectedUser;
      
      // Message belongs to current chat if:
      // 1. I sent it to the selected user, OR
      // 2. The selected user sent it to me
      const belongsToCurrentChat = 
        (isSentByMe && isSentToSelected) || 
        (isSentBySelected && isSentToMe);
      
      console.log('🔍 Message belongs to current chat?', belongsToCurrentChat);
      
      if (belongsToCurrentChat) {
        // ✅ ADD MESSAGE TO CURRENT CHAT IMMEDIATELY
        setMessages((prevMessages) => {
          // Remove temporary message if it exists
          const withoutTemp = prevMessages.filter(msg => 
            !(msg.isTemp && msg.content === message.content && msg.sender._id === message.sender._id)
          );
          
          // Check if message already exists
          const exists = withoutTemp.some(msg => msg._id === message._id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping');
            return withoutTemp;
          }
          
          console.log('✅ ADDING MESSAGE TO CHAT');
          return [...withoutTemp, message];
        });
        
        // Clear unread count for this conversation since we're viewing it
        if (isSentBySelected && isSentToMe) {
          setUnreadCounts((prev) => ({
            ...prev,
            [currentSelectedUser]: 0,
          }));
        }
      } else {
        // Message is for a different conversation - update unread count
        if (isSentToMe && !isSentByMe) {
          console.log('📬 Message for different chat, updating unread count');
          setUnreadCounts((prev) => ({
            ...prev,
            [message.sender._id]: (prev[message.sender._id] || 0) + 1,
          }));
        }
      }
      
      // Always reload conversations to update last message
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        loadConversations(currentToken);
      }
    });

    newSocket.on('newFollowRequest', (data) => {
      console.log('🔔 New follow request:', data);
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        loadPendingRequests(currentToken);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    setSocket(newSocket);
  };

  // ============================
  // 📊 LOAD USER DATA
  // ============================
  const loadUserData = async (token) => {
    try {
      await Promise.all([
        loadConversations(token),
        loadSuggestedUsers(token),
        loadPendingRequests(token)
      ]);
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
    }
  };

  // ============================
  // 💬 LOAD CONVERSATIONS
  // ============================
  const loadConversations = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/conversations`, { headers });
      setConversations(response.data);
      console.log('✅ Loaded conversations:', response.data.length);
    } catch (error) {
      console.error('❌ Failed to load conversations:', error.response?.data || error.message);
    }
  };

  // ============================
  // 👥 LOAD SUGGESTED USERS
  // ============================
  const loadSuggestedUsers = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/users/suggested`, { headers });
      setSuggestedUsers(response.data);
      console.log('✅ Loaded suggested users:', response.data.length);
    } catch (error) {
      console.error('❌ Failed to load suggested users:', error.response?.data || error.message);
    }
  };

  // ============================
  // 🔔 LOAD PENDING REQUESTS
  // ============================
  const loadPendingRequests = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/follow/pending`, { headers });
      const requests = response.data.filter(req => req !== null);
      setPendingRequests(requests);
      console.log('✅ Loaded pending requests:', requests.length);
    } catch (error) {
      console.error('❌ Failed to load pending requests:', error.response?.data || error.message);
    }
  };

  // ============================
  // 📨 LOAD MESSAGES
  // ============================
  const loadMessages = async (userId, userInfo) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`${API_URL}/api/conversations/${userId}/messages`, { headers });
      setMessages(response.data);
      setSelectedUser(userId);
      setSelectedUserInfo(userInfo);
      
      if (isMobile) {
        setShowSidebar(false);
      }
      
      setUnreadCounts((prev) => ({
        ...prev,
        [userId]: 0,
      }));
      
      if (socket) {
        socket.emit('markAsRead', { senderId: userId });
      }
      
      console.log('✅ Loaded messages:', response.data.length);
    } catch (error) {
      console.error('❌ Failed to load messages:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // 🔙 BACK TO CONVERSATIONS (MOBILE)
  // ============================
  const handleBackToConversations = () => {
    setSelectedUser(null);
    setSelectedUserInfo(null);
    setMessages([]);
    setShowSidebar(true);
  };

  // ============================
  // 🔍 HANDLE SEARCH
  // ============================
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/users/search?q=${searchQuery}`, { headers });
      setSearchResults(response.data);
      console.log('✅ Search results:', response.data.length);
    } catch (error) {
      console.error('❌ Search failed:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // 📤 SEND MESSAGE (WITH OPTIMISTIC UPDATE)
  // ============================
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;

    const messageContent = newMessage.trim();
    console.log('📤 Sending message to:', selectedUser);
    
    // ✅ Create temporary message for immediate display
    const tempMessage = {
      _id: 'temp_' + Date.now(),
      content: messageContent,
      sender: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName
      },
      receiver: {
        _id: selectedUser
      },
      createdAt: new Date().toISOString(),
      isRead: false,
      isTemp: true
    };
    
    // ✅ Immediately add to messages for instant feedback
    setMessages((prev) => [...prev, tempMessage]);
    
    // Clear input immediately
    setNewMessage("");
    
    // Send to server
    socket.emit("sendMessage", {
      receiverId: selectedUser,
      content: messageContent,
    });
    
    // Focus input for next message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // ============================
  // 👤 FOLLOW REQUEST
  // ============================
  const handleFollowRequest = async (userId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('📤 Sending follow request to:', userId);
      
      const response = await axios.post(`${API_URL}/api/follow/request`, { userId }, { headers });
      
      if (socket) {
        socket.emit("followRequestSent", { receiverId: userId });
      }
      
      alert("✅ " + (response.data.message || "Follow request sent!"));
      
      const newToken = localStorage.getItem('token');
      await Promise.all([
        loadSuggestedUsers(newToken),
        loadUserData(newToken)
      ]);
    } catch (error) {
      console.error('❌ Follow request error:', error.response?.data || error.message);
      alert(error.response?.data?.message || "❌ Failed to send request");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // ❌ CANCEL REQUEST
  // ============================
  const handleCancelRequest = async (userId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('❌ Cancelling follow request to:', userId);
      
      const response = await axios.post(`${API_URL}/api/follow/cancel`, { userId }, { headers });
      
      alert("✅ " + (response.data.message || "Request cancelled!"));
      
      const newToken = localStorage.getItem('token');
      await Promise.all([
        loadSuggestedUsers(newToken),
        loadUserData(newToken)
      ]);
    } catch (error) {
      console.error('❌ Cancel request error:', error.response?.data || error.message);
      alert(error.response?.data?.message || "❌ Failed to cancel request");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // ✅ ACCEPT FOLLOW REQUEST
  // ============================
  const handleAcceptRequest = async (userId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('✅ Accepting follow request from:', userId);
      
      const response = await axios.post(`${API_URL}/api/follow/accept`, { userId }, { headers });
      
      console.log('✅ Accept response:', response.data);
      
      alert("✅ " + (response.data.message || "Request accepted! You can now chat."));
      
      // Reload all data
      const newToken = localStorage.getItem('token');
      await Promise.all([
        loadPendingRequests(newToken),
        loadConversations(newToken),
        loadSuggestedUsers(newToken),
        loadUserData(newToken)
      ]);
      
      // Switch to chat tab to see the new conversation
      setActiveTab("chat");
      
    } catch (error) {
      console.error('❌ Accept request error:', error.response?.data || error.message);
      alert(error.response?.data?.message || "❌ Failed to accept request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // ❌ REJECT FOLLOW REQUEST
  // ============================
  const handleRejectRequest = async (userId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('❌ Rejecting follow request from:', userId);
      
      const response = await axios.post(`${API_URL}/api/follow/reject`, { userId }, { headers });
      
      alert("✅ " + (response.data.message || "Request rejected."));
      
      const newToken = localStorage.getItem('token');
      await Promise.all([
        loadPendingRequests(newToken),
        loadUserData(newToken)
      ]);
    } catch (error) {
      console.error('❌ Reject request error:', error.response?.data || error.message);
      alert(error.response?.data?.message || "❌ Failed to reject request");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================
  // 📜 AUTO SCROLL (SMOOTH)
  // ============================
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {!isMobile && <UserSideNav />}
      
      <div style={{
        ...styles.chatContainer,
        margin: isMobile ? '20px 10px' : '100px',
      }}>
        {showSidebar && (
          <div style={{
            ...styles.chatSidebar,
            width: isMobile ? '100%' : '350px',
          }}>
            <div style={styles.sidebarHeader}>
              <div style={styles.headerTop}>
                <h2 style={styles.username}>💬 {user.username}</h2>
                {isMobile && (
                  <button 
                    style={styles.menuButton}
                    onClick={() => navigate('/DashBoard')}
                  >
                    ☰
                  </button>
                )}
              </div>
              {!isMobile && (
                <button 
                  style={styles.dashboardButton}
                  onClick={() => navigate('/DashBoard')}
                >
                  🏠 Dashboard
                </button>
              )}
            </div>

            <div style={{
              ...styles.sidebarTabs,
              overflowX: isMobile ? 'auto' : 'visible',
              whiteSpace: isMobile ? 'nowrap' : 'normal',
            }}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "chat" ? styles.activeTab : {})
                }}
                onClick={() => setActiveTab("chat")}
              >
                💬
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "requests" ? styles.activeTab : {})
                }}
                onClick={() => setActiveTab("requests")}
              >
                🔔 {pendingRequests.length > 0 && `(${pendingRequests.length})`}
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "suggestions" ? styles.activeTab : {})
                }}
                onClick={() => setActiveTab("suggestions")}
              >
                👥
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(activeTab === "search" ? styles.activeTab : {})
                }}
                onClick={() => setActiveTab("search")}
              >
                🔍
              </button>
            </div>

            {activeTab === "chat" && (
              <div style={styles.conversationsList}>
                {conversations.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>💬</div>
                    <div>No conversations yet</div>
                    <div style={styles.emptyHint}>Accept a follow request to start chatting!</div>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.user.id}
                      style={{
                        ...styles.conversationItem,
                        ...(selectedUser === conv.user.id ? styles.activeConversation : {})
                      }}
                      onClick={() => loadMessages(conv.user.id, conv.user)}
                    >
                      <div style={styles.avatar}>
                        {conv.user.username.charAt(0).toUpperCase()}
                      </div>
                      <div style={styles.conversationInfo}>
                        <div style={styles.conversationName}>
                          {conv.user.firstName} {conv.user.lastName}
                          {unreadCounts[conv.user.id] > 0 && (
                            <span style={styles.unreadBadge}>{unreadCounts[conv.user.id]}</span>
                          )}
                        </div>
                        <div style={styles.conversationLastMessage}>
                          {conv.lastMessage.content || "Start chatting..."}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "requests" && (
              <div style={styles.searchContainer}>
                <div style={styles.sectionHeader}>
                  <h3 style={styles.sectionTitle}>Follow Requests ({pendingRequests.length})</h3>
                  <button 
                    onClick={() => loadPendingRequests(localStorage.getItem('token'))} 
                    style={styles.refreshButton}
                    disabled={isLoading}
                  >
                    {isLoading ? '⏳' : '🔄'}
                  </button>
                </div>

                <div style={styles.searchResults}>
                  {pendingRequests.length === 0 ? (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>🔔</div>
                      <div>No pending requests</div>
                    </div>
                  ) : (
                    pendingRequests.map((request) => (
                      <div key={request._id} style={styles.searchResultItem}>
                        <div style={styles.avatar}>
                          {request.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div style={styles.searchResultInfo}>
                          <div style={styles.searchResultName}>
                            {request.fullName || 'Unknown User'}
                          </div>
                          <div style={styles.searchResultUsername}>@{request.username || 'unknown'}</div>
                        </div>
                        <div style={styles.resultActions}>
                          <button
                            style={styles.acceptButton}
                            onClick={() => handleAcceptRequest(request._id)}
                            disabled={isLoading}
                          >
                            {isLoading ? '⏳' : '✅'}
                          </button>
                          <button
                            style={styles.rejectButton}
                            onClick={() => handleRejectRequest(request._id)}
                            disabled={isLoading}
                          >
                            {isLoading ? '⏳' : '❌'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "suggestions" && (
                <div style={styles.searchContainer}>
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Suggested ({suggestedUsers.length})</h3>
                    <button 
                      onClick={() => loadSuggestedUsers(localStorage.getItem('token'))} 
                      style={styles.refreshButton}
                      disabled={isLoading}
                    >
                      {isLoading ? '⏳' : '🔄'}
                    </button>
                  </div>

                  <div style={styles.searchResults}>
                    {suggestedUsers.length === 0 ? (
                      <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>👥</div>
                        <div>No suggestions</div>
                        <div style={styles.emptyHint}>
                          Play tournaments to find teammates!
                        </div>
                      </div>
                    ) : (
                      suggestedUsers.map((result) => (
                        <div key={result.id} style={styles.searchResultItem}>
                          <div style={styles.avatar}>
                            {result.username.charAt(0).toUpperCase()}
                          </div>
                          <div style={styles.searchResultInfo}>
                            <div style={styles.searchResultName}>
                              {result.firstName} {result.lastName}
                            </div>
                            <div style={styles.searchResultUsername}>
                              @{result.username}
                            </div>
                            
                            {/* Tournament Info */}
                            {result.tournamentsCount > 0 ? (
                              <div style={styles.tournamentInfo}>
                                <div style={styles.tournamentBadge}>
                                  🎮 Played {result.tournamentsCount} tournament{result.tournamentsCount > 1 ? 's' : ''} together
                                </div>
                                <div style={styles.tournamentList}>
                                  {result.tournaments.slice(0, 2).map((tournament, idx) => (
                                    <span key={idx} style={styles.tournamentTag}>
                                      {tournament.game} ({tournament.t_id})
                                    </span>
                                  ))}
                                  {result.tournaments.length > 2 && (
                                    <span style={styles.tournamentMore}>
                                      +{result.tournaments.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={styles.searchResultFollowers}>
                                {result.followers} followers
                              </div>
                            )}
                          </div>
                          <div style={styles.resultActions}>
                            {result.isFollowing ? (
                              <button style={styles.followingButton} disabled>
                                ✅
                              </button>
                            ) : result.hasRequested ? (
                              <button
                                style={styles.cancelButton}
                                onClick={() => handleCancelRequest(result.id)}
                                disabled={isLoading}
                              >
                                {isLoading ? '⏳' : '❌'}
                              </button>
                            ) : (
                              <button
                                style={styles.followButton}
                                onClick={() => handleFollowRequest(result.id)}
                                disabled={isLoading}
                              >
                                {isLoading ? '⏳' : '➕'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            {activeTab === "search" && (
              <div style={styles.searchContainer}>
                <div style={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    style={styles.searchInput}
                  />
                  <button onClick={handleSearch} style={styles.searchButton} disabled={isLoading}>
                    {isLoading ? '⏳' : '🔍'}
                  </button>
                </div>

                <div style={styles.searchResults}>
                  {searchResults.length === 0 && searchQuery ? (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>🔍</div>
                      <div>No results found</div>
                    </div>
                  ) : (
                    searchResults.map((result) => (
                      <div key={result.id} style={styles.searchResultItem}>
                        <div style={styles.avatar}>
                          {result.username.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.searchResultInfo}>
                          <div style={styles.searchResultName}>
                            {result.firstName} {result.lastName}
                          </div>
                          <div style={styles.searchResultUsername}>@{result.username}</div>
                        </div>
                        <div style={styles.resultActions}>
                          {result.isFollowing ? (
                            <button style={styles.followingButton} disabled>
                              ✅
                            </button>
                          ) : result.hasRequested ? (
                            <button
                              style={styles.cancelButton}
                              onClick={() => handleCancelRequest(result.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? '⏳' : '❌'}
                            </button>
                          ) : (
                            <button
                              style={styles.followButton}
                              onClick={() => handleFollowRequest(result.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? '⏳' : '➕'}
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
        )}

        {(!isMobile || !showSidebar) && (
          <div style={{
            ...styles.chatMain,
            width: isMobile ? '100%' : 'auto',
          }}>
            {selectedUser ? (
              <>
                <div style={styles.chatHeader}>
                  {isMobile && (
                    <button 
                      style={styles.backButton}
                      onClick={handleBackToConversations}
                    >
                      ← Back
                    </button>
                  )}
                  <div style={styles.avatar}>
                    {selectedUserInfo?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex: 1}}>
                    <div style={styles.chatHeaderName}>
                      {selectedUserInfo?.firstName} {selectedUserInfo?.lastName}
                    </div>
                    <div style={styles.chatHeaderUsername}>
                      @{selectedUserInfo?.username}
                    </div>
                  </div>
                </div>

                <div style={styles.chatMessages}>
                  {isLoading ? (
                    <div style={styles.loadingMessages}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>💬</div>
                      <div>No messages yet</div>
                      <div style={styles.emptyHint}>Start the conversation!</div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        style={{
                          ...styles.message,
                          ...(msg.sender._id === user._id ? styles.sentMessage : styles.receivedMessage)
                        }}
                      >
                        <div style={msg.sender._id === user._id ? styles.sentMessageContent : styles.receivedMessageContent}>
                          {msg.content}
                        </div>
                        <div style={styles.messageTime}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender._id === user._id && (
                            <span style={styles.messageStatus}>
                              {msg.isTemp ? ' ⏳' : msg.isRead ? ' ✓✓' : ' ✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form style={styles.chatInputForm} onSubmit={handleSendMessage}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    style={styles.chatInput}
                    autoFocus={!isMobile}
                  />
                  <button type="submit" style={styles.sendButton} disabled={!newMessage.trim()}>
                    {isMobile ? '📤' : '📤 Send'}
                  </button>
                </form>
              </>
            ) : (
              <div style={styles.noChatSelected}>
                <div style={styles.emptyIcon}>💬</div>
                <h3>Select a conversation</h3>
                <p style={styles.emptyHint}>Choose from your conversations or search for users</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================
// 🎨 STYLES
// ============================
const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: theme.gradients.homeBackground,
    fontFamily: theme.fonts.primary,
    color: theme.colors.white,
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: theme.gradients.homeBackground,
  },
  loadingText: {
    fontSize: "20px",
    color: theme.colors.white,
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    transition: "margin-left 0.3s ease",
  },
  chatSidebar: {
    background: theme.gradients.navbarAlt1,
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
  },
  sidebarHeader: {
    padding: "15px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  username: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "bold",
    color: theme.colors.white,
  },
  menuButton: {
    padding: "8px 12px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "18px",
  },
   tournamentInfo: {
    marginTop: "6px",
    fontSize: "11px",
  },
  tournamentBadge: {
    display: "inline-block",
    background: "rgba(0, 255, 204, 0.15)",
    color: "#00ffcc",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  tournamentList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginTop: "4px",
  },
  tournamentTag: {
    background: "rgba(255, 255, 255, 0.1)",
    color: theme.colors.lightGray,
    padding: "2px 6px",
    borderRadius: "6px",
    fontSize: "9px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  tournamentMore: {
    color: theme.colors.lightGray,
    fontSize: "9px",
    fontStyle: "italic",
    padding: "2px 4px",
  },
  dashboardButton: {
    width: "100%",
    padding: "10px 16px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  sidebarTabs: {
    display: "flex",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  tabButton: {
    flex: 1,
    padding: "12px 6px",
    background: "transparent",
    color: theme.colors.lightGray,
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    minWidth: "60px",
  },
  activeTab: {
    color: theme.colors.white,
    background: "rgba(0, 255, 204, 0.1)",
    borderBottom: "2px solid #00ffcc",
  },
  conversationsList: {
    flex: 1,
    overflowY: "auto",
  },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
    color: theme.colors.lightGray,
    fontSize: "14px",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  emptyHint: {
    fontSize: "12px",
    color: theme.colors.lightGray,
    marginTop: "8px",
    opacity: 0.7,
  },
  conversationItem: {
    padding: "12px 15px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "background 0.2s ease",
  },
  activeConversation: {
    background: "rgba(0, 255, 204, 0.15)",
    borderLeft: "3px solid #00ffcc",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: theme.gradients.primaryButton,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
    color: theme.colors.white,
    flexShrink: 0,
  },
  conversationInfo: {
    flex: 1,
    minWidth: 0,
  },
  conversationName: {
    fontSize: "14px",
    fontWeight: "600",
    color: theme.colors.white,
    marginBottom: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  unreadBadge: {
    background: "#ff4444",
    color: "white",
    borderRadius: "50%",
    minWidth: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "0 5px",
  },
  conversationLastMessage: {
    fontSize: "12px",
    color: theme.colors.lightGray,
    lineHeight: "1.4",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  searchContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  sectionHeader: {
    padding: "15px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "bold",
    color: theme.colors.white,
  },
  refreshButton: {
    padding: "6px 10px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  searchBox: {
    padding: "15px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    gap: "8px",
  },
  searchInput: {
    flex: 1,
    padding: "10px",
    background: theme.colors.backgroundColor,
    color: theme.colors.white,
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    fontSize: "14px",
  },
  searchButton: {
    padding: "10px 16px",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },
  searchResults: {
    flex: 1,
    overflowY: "auto",
  },
  searchResultItem: {
    padding: "12px 15px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  searchResultInfo: {
    flex: 1,
    minWidth: 0,
  },
  searchResultName: {
    fontSize: "14px",
    fontWeight: "600",
    color: theme.colors.white,
    marginBottom: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  searchResultUsername: {
    fontSize: "12px",
    color: theme.colors.lightGray,
    marginBottom: "2px",
  },
  searchResultFollowers: {
    fontSize: "11px",
    color: theme.colors.lightGray,
  },
  resultActions: {
    display: "flex",
    gap: "6px",
  },
  followButton: {
    padding: "8px 12px",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  followingButton: {
    padding: "8px 12px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    opacity: 0.6,
  },
  cancelButton: {
    padding: "8px 12px",
    background: "#ff6b6b",
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  acceptButton: {
    padding: "8px 12px",
    background: "#4CAF50",
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  rejectButton: {
    padding: "8px 12px",
    background: "#f44336",
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  chatMain: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: theme.gradients.navbarAlt2,
  },
  chatHeader: {
    padding: "15px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: theme.gradients.navbarAlt1,
  },
  backButton: {
    padding: "8px 12px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  chatHeaderName: {
    fontSize: "15px",
    fontWeight: "600",
    color: theme.colors.white,
  },
  chatHeaderUsername: {
    fontSize: "12px",
    color: theme.colors.lightGray,
  },
  chatMessages: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  loadingMessages: {
    textAlign: "center",
    color: theme.colors.lightGray,
    padding: "20px",
  },
  message: {
    marginBottom: "12px",
    maxWidth: "85%",
    display: "flex",
    flexDirection: "column",
  },
  sentMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  sentMessageContent: {
    background: "linear-gradient(135deg, #00ffcc, #0099ff)",
    color: "#000",
    padding: "10px 14px",
    borderRadius: "16px 16px 4px 16px",
    fontSize: "14px",
    lineHeight: "1.4",
    wordWrap: "break-word",
    fontWeight: "500",
  },
  receivedMessageContent: {
    background: "rgba(255, 255, 255, 0.1)",
    color: theme.colors.white,
    padding: "10px 14px",
    borderRadius: "16px 16px 16px 4px",
    fontSize: "14px",
    lineHeight: "1.4",
    wordWrap: "break-word",
  },
  messageTime: {
    fontSize: "10px",
    color: theme.colors.lightGray,
    marginTop: "4px",
    paddingLeft: "4px",
  },
  messageStatus: {
    color: "#00ffcc",
  },
  chatInputForm: {
    padding: "12px 15px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    gap: "10px",
    background: theme.gradients.navbarAlt1,
  },
  chatInput: {
    flex: 1,
    padding: "12px 16px",
    background: theme.colors.backgroundColor,
    color: theme.colors.white,
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "25px",
    fontSize: "14px",
    outline: "none",
  },
  sendButton: {
    padding: "12px 20px",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
  },
  noChatSelected: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: theme.colors.lightGray,
    padding: "20px",
  },
};

export default ChatPage;