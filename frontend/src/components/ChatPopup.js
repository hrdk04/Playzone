import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';
import io from 'socket.io-client';

const ChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user and token from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedToken = localStorage.getItem('token');
    
    setUser(storedUser);
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
      });

      newSocket.on('adminBroadcast', (data) => {
        setNotifications(prev => [data, ...prev.slice(0, 4)]); // Keep only 5 latest
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('PlayZone Notification', {
            body: data.message,
            icon: '/favicon.ico'
          });
        }
      });

      newSocket.on('tournamentJoined', (data) => {
        setNotifications(prev => [{
          message: `${data.teamName} joined ${data.tournamentName} tournament (${data.tournamentId})`,
          type: 'tournament_join',
          timestamp: new Date()
        }, ...prev.slice(0, 4)]);
        setUnreadCount(prev => prev + 1);
      });

      newSocket.on('newFollowRequest', (data) => {
        setNotifications(prev => [{
          message: `New follow request from ${data.from}`,
          type: 'follow_request',
          timestamp: new Date()
        }, ...prev.slice(0, 4)]);
        setUnreadCount(prev => prev + 1);
      });

      setSocket(newSocket);

      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const handleChatClick = () => {
    if (user && token) {
      // Store the token for chat authentication
      localStorage.setItem('chatToken', token);
      navigate('/chat');
    } else {
      alert('Please login to access chat features');
      navigate('/login');
    }
  };

  const handleNotificationClick = (notification) => {
    setUnreadCount(prev => Math.max(0, prev - 1));
    // Handle notification click based on type
    if (notification.type === 'follow_request') {
      navigate('/chat?tab=profile');
    } else if (notification.type === 'tournament_join') {
      navigate('/tournaments');
    } else {
      navigate('/DashBoard');
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Popup Button */}
      <div style={styles.chatButton} onClick={() => setIsOpen(!isOpen)}>
        <div style={styles.chatIcon}>💬</div>
        {unreadCount > 0 && (
          <div style={styles.unreadBadge}>{unreadCount}</div>
        )}
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div style={styles.notificationPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Notifications</h3>
            <div style={styles.panelActions}>
              <button 
                style={styles.clearButton}
                onClick={clearNotifications}
                title="Clear all"
              >
                🗑️
              </button>
              <button 
                style={styles.closeButton}
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <div style={styles.notificationList}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No notifications yet</p>
                <small>You'll see updates here</small>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div 
                  key={index}
                  style={styles.notificationItem}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div style={styles.notificationContent}>
                    <p style={styles.notificationMessage}>{notification.message}</p>
                    <small style={styles.notificationTime}>
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                  <div style={styles.notificationIcon}>
                    {notification.type === 'follow_request' ? '👥' : 
                     notification.type === 'tournament_join' ? '🎮' : '📢'}
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={styles.panelFooter}>
            <button 
              style={styles.chatButton}
              onClick={handleChatClick}
            >
              Open Chat
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  chatButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: theme.gradients.primaryButton,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    zIndex: 1300,
    transition: 'all 0.3s ease',
    fontSize: '24px',
  },
  chatIcon: {
    color: theme.colors.white,
  },
  unreadBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#ff4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  notificationPanel: {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '350px',
    maxHeight: '400px',
    background: theme.gradients.navbarAlt1,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 1299,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  panelHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    margin: 0,
    color: theme.colors.white,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  panelActions: {
    display: 'flex',
    gap: '10px',
  },
  clearButton: {
    background: 'transparent',
    border: 'none',
    color: theme.colors.lightGray,
    cursor: 'pointer',
    fontSize: '14px',
    padding: '5px',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: theme.colors.lightGray,
    cursor: 'pointer',
    fontSize: '16px',
    padding: '5px',
  },
  notificationList: {
    maxHeight: '250px',
    overflowY: 'auto',
  },
  emptyState: {
    padding: '30px 20px',
    textAlign: 'center',
    color: theme.colors.lightGray,
  },
  notificationItem: {
    padding: '15px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'background 0.2s ease',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    margin: 0,
    color: theme.colors.white,
    fontSize: '14px',
    lineHeight: '1.4',
  },
  notificationTime: {
    color: theme.colors.lightGray,
    fontSize: '12px',
  },
  notificationIcon: {
    fontSize: '20px',
  },
  panelFooter: {
    padding: '15px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

export default ChatPopup;
