// frontend/src/components/ChatBox.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Check,
    CheckCheck,
    MessageSquare,
    Inbox,
    Send,
    Paperclip,
    Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { useTranslation } from 'react-i18next';

const ChatBox = ({ incidentId }) => {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const scrollRef = useRef();

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const { data } = await axios.get(`/api/messages/${incidentId}`);
                if (data.success) {
                    setMessages(data.messages);
                }
            } catch (err) {
                console.error('Erreur chargement messages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [incidentId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text) return;

        setNewMessage('');

        try {
            const { data } = await axios.post(`/api/messages/${incidentId}`, {
                content: text
            });
            if (data.success) {
                setMessages(prev => [...prev, data.message]);
            }
        } catch (err) {
            console.error('Erreur envoi message:', err);
            setNewMessage(text);
        }
    };

    const renderTicks = (msg) => {
        if (msg.sender?._id !== user._id) return null;
        const isRead = msg.readBy.length > 1;

        return (
            <div className={`chat-ticks ${isRead ? 'read' : 'delivered'}`}>
                {isRead ? <CheckCheck size={14} /> : <Check size={14} />}
            </div>
        );
    };

    if (loading) return (
        <div className="chat-loading-shimmer">
            <div className="shimmer-line"></div>
            <div className="shimmer-line short"></div>
        </div>
    );

    return (
        <div className="premium-chat-box">
            <div className="chat-header-banner">
                <div className="chat-icon-wrapper">
                    <MessageSquare size={18} />
                </div>
                <div className="chat-info">
                    <h3>{t('chat.official_title')}</h3>
                    <p>{user.role === 'admin' ? t('chat.support_role') : t('chat.admin_discussion')}</p>
                </div>
            </div>

            <div className="chat-messages-viewport" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="chat-welcome">
                        <div className="welcome-icon">
                            <Inbox size={48} opacity={0.2} />
                        </div>
                        <h4>{t('chat.empty_title')}</h4>
                        <p>{user.role === 'admin'
                            ? t('chat.empty_admin')
                            : t('chat.empty_citizen')}
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.sender?._id === user._id;
                        const senderName = msg.sender?.role === 'admin' ? t('chat.administration') : msg.sender?.name;

                        return (
                            <div key={i} className={`message-row ${isMe ? 'me' : 'them'}`}>
                                {!isMe && <div className="sender-tag">{senderName}</div>}
                                <div className="bubble-context">
                                    <div className="message-bubble">
                                        {msg.content}
                                    </div>
                                    <div className="message-meta-data">
                                        <span className="msg-time">
                                            {new Date(msg.createdAt).toLocaleTimeString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {renderTicks(msg)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form className="chat-composer" onSubmit={handleSendMessage}>
                <div className="composer-wrapper">
                    <button type="button" className="btn-icon" style={{ color: 'var(--text-muted)' }}>
                        <Paperclip size={18} />
                    </button>
                    <input
                        type="text"
                        placeholder={t('chat.placeholder')}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        autoComplete="off"
                    />
                    <button type="submit" disabled={!newMessage.trim()}>
                        <Send size={18} />
                    </button>
                </div>
            </form>

            <style>{`
                .premium-chat-box {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    height: 500px;
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                    position: relative;
                }

                .chat-header-banner {
                    padding: 16px 20px;
                    background: var(--brand-navy);
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .chat-icon-wrapper {
                    width: 40px;
                    height: 40px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }

                .chat-info h3 { font-size: 0.95rem; margin: 0; font-weight: 700; letter-spacing: 0.5px; }
                .chat-info p { font-size: 0.75rem; margin: 0; opacity: 0.7; }

                .chat-messages-viewport {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    background: var(--bg-primary);
                    background-image: radial-gradient(var(--border) 1px, transparent 1px);
                    background-size: 20px 20px;
                }

                .chat-welcome {
                    margin: auto;
                    text-align: center;
                    max-width: 280px;
                    opacity: 0.6;
                }
                .welcome-icon { font-size: 2rem; margin-bottom: 12px; }

                .message-row {
                    display: flex;
                    flex-direction: column;
                    max-width: 80%;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .message-row.me { align-self: flex-end; }
                .message-row.them { align-self: flex-start; }

                .sender-tag {
                    font-size: 0.65rem;
                    font-weight: 800;
                    margin-bottom: 4px;
                    color: var(--brand-orange);
                    letter-spacing: 0.8px;
                    margin-left: 4px;
                }

                .message-bubble {
                    padding: 12px 16px;
                    border-radius: 18px;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    position: relative;
                }

                .me .message-bubble {
                    background: var(--brand-orange);
                    color: white;
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 4px 12px rgba(232, 84, 26, 0.2);
                }

                .them .message-bubble {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border-bottom-left-radius: 4px;
                    border: 1px solid var(--border);
                    box-shadow: var(--shadow-sm);
                }

                .message-meta-data {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 4px;
                    margin-top: 4px;
                    padding: 0 4px;
                }

                .msg-time { font-size: 0.65rem; opacity: 0.5; font-weight: 500; }

                .chat-ticks { display: flex; font-size: 0.7rem; }
                .chat-ticks.delivered { color: var(--text-muted); }
                .chat-ticks.read { color: #34b7f1; }
                .tick { margin-left: -4px; font-weight: 700; }

                .chat-composer {
                    padding: 16px 20px;
                    background: var(--bg-secondary);
                    border-top: 1px solid var(--border);
                }

                .composer-wrapper {
                    background: var(--bg-primary);
                    border-radius: 24px;
                    padding: 4px 4px 4px 16px;
                    display: flex;
                    align-items: center;
                    border: 1.5px solid var(--border);
                    transition: all 0.2s;
                }

                .composer-wrapper:focus-within {
                    border-color: var(--brand-orange);
                    box-shadow: 0 0 0 3px rgba(232, 84, 26, 0.1);
                }

                .composer-wrapper input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 10px 0;
                    outline: none;
                    font-size: 0.9rem;
                    color: var(--text-primary);
                }

                .composer-wrapper button {
                    width: 36px;
                    height: 36px;
                    background: var(--brand-orange);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .composer-wrapper button:hover:not(:disabled) { transform: scale(1.05); }
                .composer-wrapper button:disabled { opacity: 0.3; cursor: default; }
            `}</style>
        </div>
    );
};

export default ChatBox;
