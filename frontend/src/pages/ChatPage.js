import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import theme from "../theme";
import UserSideNav from "../userSide/UserSideNav";
import io from 'socket.io-client';
import axios from 'axios';

const ChatPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token') || localStorage.getItem('chatToken');
    
    if (!storedUser || !token) {
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
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    newSocket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      setUnreadCounts((prev) => ({
        ...prev,
        [message.sender._id]: (prev[message.sender._id] || 0) + 1,
      }));
    });

    newSocket.on('newFollowRequest', (data) => {
      alert(`New follow request from ${data.from}!`);
      loadPendingRequestsCount();
    });

    newSocket.on('adminBroadcast', (data) => {
      alert(`Admin Notification: ${data.message}`);
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
      const headers = { Authorization: `Bearer ${token}` };
      
      // Load conversations (mock data for now)
      setConversations([]);
      
      // Load suggested users
      const suggestionsResponse = await axios.get('http://localhost:5000/api/users/suggested', { headers });
      setSuggestedUsers(suggestionsResponse.data);
      
      // Load pending requests count
      await loadPendingRequestsCount();
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      // Mock messages for now - you can implement actual message loading
      setMessages([]);
      setSelectedUser(userId);
      setUnreadCounts((prev) => ({
        ...prev,
        [userId]: 0,
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
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
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;

    socket.emit("sendMessage", {
      receiverId: selectedUser,
      content: newMessage,
    });
    setNewMessage("");
  };

  const handleFollowRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('chatToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post('http://localhost:5000/api/follow/request', { userId }, { headers });
      
      if (socket) {
        socket.emit("followRequestSent", { receiverId: userId });
      }
      
      alert("Follow request sent!");
      loadUserData(token);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send request");
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('chatToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.post('http://localhost:5000/api/follow/cancel', { userId }, { headers });
      
      alert("Request cancelled!");
      loadUserData(token);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel request");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.page}>
      <UserSideNav />
      <div style={styles.chatContainer}>
        <div style={styles.chatSidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.username}>{user.username}</h2>
            <div style={styles.headerActions}>
              <button 
                style={styles.profileButton}
                onClick={() => navigate('/DashBoard')}
              >
                Dashboard
              </button>
              <button 
                style={styles.logoutButton}
                onClick={() => {
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  localStorage.removeItem('chatToken');
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <div style={styles.sidebarTabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "chat" ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab("chat")}
            >
              Chats
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "suggestions" ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab("suggestions")}
            >
              Suggested
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "search" ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab("search")}
            >
              Search
            </button>
          </div>

          {activeTab === "chat" && (
            <div style={styles.conversationsList}>
              {conversations.length === 0 ? (
                <div style={styles.emptyState}>No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.user.id}
                    style={{
                      ...styles.conversationItem,
                      ...(selectedUser === conv.user.id ? styles.activeConversation : {})
                    }}
                    onClick={() => loadMessages(conv.user.id)}
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
                        {conv.lastMessage.isSender && "You: "}
                        {conv.lastMessage.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "suggestions" && (
            <div style={styles.searchContainer}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Suggested Users</h3>
                <button 
                  onClick={() => loadUserData(localStorage.getItem('token'))} 
                  style={styles.refreshButton}
                >
                  Refresh
                </button>
              </div>

              <div style={styles.searchResults}>
                {suggestedUsers.length === 0 ? (
                  <div style={styles.emptyState}>No suggestions available</div>
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
                        <div style={styles.searchResultUsername}>@{result.username}</div>
                        <div style={styles.searchResultFollowers}>{result.followers} followers</div>
                      </div>
                      <div style={styles.resultActions}>
                        {result.isFollowing ? (
                          <button style={styles.followingButton} disabled>
                            Following
                          </button>
                        ) : result.hasRequested ? (
                          <button
                            style={styles.cancelButton}
                            onClick={() => handleCancelRequest(result.id)}
                          >
                            Cancel Request
                          </button>
                        ) : (
                          <button
                            style={styles.followButton}
                            onClick={() => handleFollowRequest(result.id)}
                          >
                            Follow
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
                <button onClick={handleSearch} style={styles.searchButton}>
                  Search
                </button>
              </div>

              <div style={styles.searchResults}>
                {searchResults.map((result) => (
                  <div key={result.id} style={styles.searchResultItem}>
                    <div style={styles.avatar}>
                      {result.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.searchResultInfo}>
                      <div style={styles.searchResultName}>
                        {result.firstName} {result.lastName}
                      </div>
                      <div style={styles.searchResultUsername}>@{result.username}</div>
                      {result.teamName && (
                        <div style={styles.searchResultTeam}>Team: {result.teamName}</div>
                      )}
                      {result.foundVia && (
                        <div style={styles.searchResultTournament}>Found via: {result.foundVia}</div>
                      )}
                    </div>
                    <div style={styles.resultActions}>
                      {result.isFollowing ? (
                        <button style={styles.followingButton} disabled>
                          Following
                        </button>
                      ) : result.hasRequested ? (
                        <button
                          style={styles.cancelButton}
                          onClick={() => handleCancelRequest(result.id)}
                        >
                          Cancel Request
                        </button>
                      ) : (
                        <button
                          style={styles.followButton}
                          onClick={() => handleFollowRequest(result.id)}
                        >
                          Follow
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.chatMain}>
          {selectedUser ? (
            <>
              <div style={styles.chatMessages}>
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      ...styles.message,
                      ...(msg.sender._id === user._id ? styles.sentMessage : styles.receivedMessage)
                    }}
                  >
                    <div style={styles.messageContent}>{msg.content}</div>
                    <div style={styles.messageTime}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
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
                />
                <button type="submit" style={styles.sendButton}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={styles.noChatSelected}>
              <h3>Select a conversation to start chatting</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: theme.gradients.homeBackground,
    fontFamily: theme.fonts.primary,
    color: theme.colors.white,
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    marginLeft: "250px", // Account for sidebar
  },
  chatSidebar: {
    width: "350px",
    background: theme.gradients.navbarAlt1,
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  username: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold",
    color: theme.colors.white,
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  profileButton: {
    padding: "8px 16px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  logoutButton: {
    padding: "8px 16px",
    background: "#ff4444",
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  sidebarTabs: {
    display: "flex",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  tabButton: {
    flex: 1,
    padding: "15px",
    background: "transparent",
    color: theme.colors.lightGray,
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  activeTab: {
    color: theme.colors.white,
    background: "rgba(255, 255, 255, 0.1)",
    borderBottom: "2px solid #00ffcc",
  },
  conversationsList: {
    flex: 1,
    overflowY: "auto",
  },
  emptyState: {
    padding: "30px 20px",
    textAlign: "center",
    color: theme.colors.lightGray,
    fontSize: "14px",
  },
  conversationItem: {
    padding: "15px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "background 0.2s ease",
  },
  activeConversation: {
    background: "rgba(0, 255, 204, 0.1)",
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
  },
  conversationInfo: {
    flex: 1,
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
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
  },
  conversationLastMessage: {
    fontSize: "12px",
    color: theme.colors.lightGray,
    lineHeight: "1.4",
  },
  searchContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  sectionHeader: {
    padding: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "bold",
    color: theme.colors.white,
  },
  refreshButton: {
    padding: "6px 12px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  searchBox: {
    padding: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    gap: "10px",
  },
  searchInput: {
    flex: 1,
    padding: "10px",
    background: theme.colors.backgroundColor,
    color: theme.colors.white,
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "6px",
    fontSize: "14px",
  },
  searchButton: {
    padding: "10px 16px",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  searchResults: {
    flex: 1,
    overflowY: "auto",
  },
  searchResultItem: {
    padding: "15px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: "14px",
    fontWeight: "600",
    color: theme.colors.white,
    marginBottom: "2px",
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
  searchResultTeam: {
    fontSize: "12px",
    color: "#00ffcc",
    fontWeight: "600",
  },
  searchResultTournament: {
    fontSize: "11px",
    color: "#ffcc00",
    fontStyle: "italic",
  },
  resultActions: {
    display: "flex",
    gap: "8px",
  },
  followButton: {
    padding: "6px 12px",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  followingButton: {
    padding: "6px 12px",
    background: theme.gradients.secondaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    opacity: 0.6,
  },
  cancelButton: {
    padding: "6px 12px",
    background: "#ff4444",
    color: theme.colors.white,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  chatMain: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  chatMessages: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    background: theme.gradients.navbarAlt2,
  },
  message: {
    marginBottom: "15px",
    maxWidth: "70%",
  },
  sentMessage: {
    marginLeft: "auto",
    textAlign: "right",
  },
  receivedMessage: {
    marginRight: "auto",
  },
  messageContent: {
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    padding: "12px 16px",
    borderRadius: "18px",
    fontSize: "14px",
    lineHeight: "1.4",
    wordWrap: "break-word",
  },
  messageTime: {
    fontSize: "11px",
    color: theme.colors.lightGray,
    marginTop: "4px",
  },
  chatInputForm: {
    padding: "20px",
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
    padding: "12px 24px",
    background: theme.gradients.primaryButton,
    color: theme.colors.white,
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  noChatSelected: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.colors.lightGray,
    fontSize: "18px",
  },
};

export default ChatPage;
