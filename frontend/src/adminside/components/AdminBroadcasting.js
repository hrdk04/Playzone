import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from "../../config/apiConfig";

const AdminBroadcasting = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [tournamentId, setTournamentId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    loadTemplates();
    loadTournaments();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/broadcast/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadTournaments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/tournaments`);
      setTournaments(response.data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    setMessage(template.message);
    setType(template.type);
  };

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const broadcastData = {
        message: message.trim(),
        type,
        ...(tournamentId && { tournamentId })
      };

      const response = await axios.post(`${API_BASE_URL}/admin/broadcast`, broadcastData);
      
      alert(`Broadcast sent successfully!\nRecipients: ${response.data.recipients}\nSuccess: ${response.data.successCount}\nFailed: ${response.data.failureCount}`);
      
      // Reset form
      setMessage('');
      setType('general');
      setTournamentId('');
      setSelectedTemplate('');
      setIsOpen(false);
    } catch (error) {
      console.error('Broadcast failed:', error);
      alert('Failed to send broadcast: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Broadcasting Button */}
      <button 
        style={styles.broadcastButton}
        onClick={() => setIsOpen(true)}
        title="Send Broadcast Notification"
      >
        📢 Broadcast
      </button>

      {/* Broadcasting Modal */}
      {isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📢 Send Broadcast Notification</h2>
              <button 
                style={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Template Selection */}
              <div style={styles.section}>
                <label style={styles.label}>Quick Templates:</label>
                <div style={styles.templateGrid}>
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      style={{
                        ...styles.templateButton,
                        ...(selectedTemplate === template.id ? styles.selectedTemplate : {})
                      }}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div style={styles.templateTitle}>{template.title}</div>
                      <div style={styles.templateType}>{template.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div style={styles.section}>
                <label style={styles.label}>Message:</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your broadcast message..."
                  style={styles.messageInput}
                  rows={4}
                />
              </div>

              {/* Type Selection */}
              <div style={styles.section}>
                <label style={styles.label}>Notification Type:</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="general">General Update</option>
                  <option value="tournament">Tournament</option>
                  <option value="results">Results</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="prize">Prize Distribution</option>
                  <option value="event">Special Event</option>
                </select>
              </div>

              {/* Tournament Selection (Optional) */}
              <div style={styles.section}>
                <label style={styles.label}>Send to Specific Tournament (Optional):</label>
                <select
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="">All Users</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament._id} value={tournament.t_id}>
                      {tournament.t_id} - {tournament.game} ({tournament.participants?.length || 0} participants)
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              {message && (
                <div style={styles.section}>
                  <label style={styles.label}>Preview:</label>
                  <div style={styles.preview}>
                    <div style={styles.previewHeader}>
                      🎮 PLAYZONE Notification - {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                    <div style={styles.previewMessage}>{message}</div>
                    <div style={styles.previewFooter}>
                      {tournamentId ? `Sent to: ${tournamentId} participants` : 'Sent to: All users'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelButton}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button 
                style={styles.sendButton}
                onClick={handleSendBroadcast}
                disabled={loading || !message.trim()}
              >
                {loading ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  broadcastButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
    transition: 'all 0.3s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'linear-gradient(135deg, #2c3e50, #34495e)',
    borderRadius: '15px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    padding: '20px 25px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#bbb',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px',
  },
  modalContent: {
    padding: '25px',
  },
  section: {
    marginBottom: '25px',
  },
  label: {
    display: 'block',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
  },
  templateButton: {
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  selectedTemplate: {
    background: 'rgba(0, 255, 204, 0.2)',
    border: '1px solid #00ffcc',
  },
  templateTitle: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  templateType: {
    color: '#bbb',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  messageInput: {
    width: '100%',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  selectInput: {
    width: '100%',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: 'gray',
    fontSize: '14px',
  },
  preview: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '15px',
  },
  previewHeader: {
    color: '#00ffcc',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  previewMessage: {
    color: 'white',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '10px',
  },
  previewFooter: {
    color: '#bbb',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  modalFooter: {
    padding: '20px 25px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
  },
  cancelButton: {
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  sendButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #00ffcc, #0077ff)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(0, 255, 204, 0.3)',
    opacity: 1,
    transition: 'all 0.3s ease',
  },
};

export default AdminBroadcasting;
