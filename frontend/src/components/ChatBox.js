// frontend/src/components/ChatBox.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ChatBox = ({ incidentId }) => {
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
        const interval = setInterval(fetchMessages, 4000); // Polling plus rapide
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

        // Vider l'input immédiatement pour une meilleure UX
        setNewMessage('');

        try {
            const { data } = await axios.post(`/api/messages/${incidentId}`, {
                content: text
            });
            if (data.success) {
                // On ajoute le message à la liste locale (avec ses ticks initiaux)
                setMessages(prev => [...prev, data.message]);
            }
        } catch (err) {
            console.error('Erreur envoi message:', err);
            // Optionnel: remettre le texte si erreur
            setNewMessage(text);
        }
    };

    const renderTicks = (msg) => {
        // Seulement pour les messages envoyés par l'utilisateur actuel
        if (msg.sender._id !== user._id) return null;

        const isRead = msg.readBy.length > 1; // Lu par quelqu'un d'autre (l'autre partie)

        if (isRead) {
            return (
                <span className="chat-ticks read" title="Lu">
                    <span className="tick"></span>
                    <span className="tick"></span>
                </span>
            );
        }

        return (
            <span className="chat-ticks delivered" title="Reçu">
                <span className="tick"></span>
                <span className="tick"></span>
            </span>
        );
    };

    if (loading) return <div className="chat-loading">Chargement de la conversation...</div>;

    return (
        <div className="chat-container fade-in">
            <div className="chat-header">
                <h3>💬 Discussion avec {user.role === 'admin' ? 'le déclarant' : 'l\'administration'}</h3>
            </div>

            <div className="chat-messages" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <p>Aucun message pour le moment.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{user.role === 'admin' ? 'Demandez plus de précisions à la victime.' : 'L\'administration pourra vous poser des questions ici.'}</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`chat-bubble-wrapper ${msg.sender._id === user._id ? 'sent' : 'received'}`}>
                            <div className="chat-sender-info">
                                {msg.sender.name}
                            </div>
                            <div className="chat-bubble">
                                {msg.content}
                                <div className="chat-meta-msg">
                                    <span className="chat-time">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {renderTicks(msg)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    autoComplete="off"
                />
                <button type="submit" className="btn btn-primary btn-sm">Envoyer</button>
            </form>
        </div>
    );
};

export default ChatBox;
