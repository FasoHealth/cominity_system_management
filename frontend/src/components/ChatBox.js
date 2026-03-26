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
    Mic,
    Square,
    Play,
    Pause,
    X,
    FileIcon,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const AudioPlayer = ({ src, isPlaying, onToggle }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.play().catch(e => console.error("Play failed", e));
        else audioRef.current.pause();
    }, [isPlaying]);

    return (
        <div className="audio-player-bubble">
            <button type="button" onClick={onToggle} className="play-btn">
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <div className="audio-wave">
                <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} />
                <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ animationDelay: '0.1s' }} />
                <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ animationDelay: '0.2s' }} />
                <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ animationDelay: '0.3s' }} />
                <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ animationDelay: '0.4s' }} />
            </div>
            <audio ref={audioRef} src={src} onEnded={onToggle} hidden />
        </div>
    );
};

const AudioPreview = ({ blob, onCancel, onSend, isSending }) => {
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);
    const url = useRef(URL.createObjectURL(blob));

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', () => setPlaying(false));

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            URL.revokeObjectURL(url.current);
        };
    }, []);

    const togglePlay = () => {
        if (playing) audioRef.current.pause();
        else audioRef.current.play();
        setPlaying(!playing);
    };

    const formatTime = (time) => {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="whatsapp-audio-preview">
            <button type="button" className="action-btn delete" onClick={onCancel} title="Supprimer">
                <X size={20} />
            </button>

            <button type="button" className="action-btn play" onClick={togglePlay}>
                {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            <div className="preview-wave-container">
                <div className="waveform-mock">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className={`wave-segment ${playing && (i / 20) < (currentTime / duration) ? 'active' : ''}`}
                            style={{ height: `${10 + Math.random() * 20}px` }}
                        />
                    ))}
                </div>
            </div>

            <span className="timer">{formatTime(currentTime || duration)}</span>

            <div className="mic-indicator">
                <Mic size={16} />
            </div>

            <button type="button" className="send-circle-btn" onClick={onSend} disabled={isSending}>
                {isSending ? <Loader2 className="spin" size={20} /> : <Send size={20} fill="white" />}
            </button>

            <audio ref={audioRef} src={url.current} hidden />
        </div>
    );
};

const ChatBox = ({ incidentId }) => {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const { user } = useAuth();
    const scrollRef = useRef();
    const fileInputRef = useRef();

    // Multimedia states
    const [recording, setRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [activeAudioId, setActiveAudioId] = useState(null);

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
    }, [messages, filePreview, audioBlob]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                setAudioBlob(blob);
            };
            mediaRecorder.start();
            setRecorder(mediaRecorder);
            setRecording(true);
        } catch (err) {
            alert(t('chat.mic_permission_error', "Accès micro refusé."));
        }
    };

    const stopRecording = () => {
        if (recorder) {
            recorder.stop();
            recorder.stream.getTracks().forEach(t => t.stop());
            setRecording(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
            setAudioBlob(null);
        }
    };

    const clearMedia = () => {
        setAudioBlob(null);
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = newMessage.trim();
        if (!text && !selectedFile && !audioBlob) return;

        setSending(true);
        const formData = new FormData();
        if (text) formData.append('content', text);

        if (audioBlob) {
            formData.append('file', audioBlob, 'vocal.wav');
            formData.append('type', 'audio');
        } else if (selectedFile) {
            formData.append('file', selectedFile);
        }

        setNewMessage('');
        clearMedia();

        try {
            const { data } = await axios.post(`/api/messages/${incidentId}`, formData);
            if (data.success) {
                setMessages(prev => [...prev, data.message]);
            }
        } catch (err) {
            console.error('Erreur envoi message:', err);
        } finally {
            setSending(false);
        }
    };

    const renderMessageContent = (msg) => {
        const file = msg.attachments?.[0];

        // Robust fallback: if there's no attachment, we just show the text content
        // This prevents crashes on older messages or malformed data
        if (!file) return msg.content;

        switch (msg.type) {
            case 'audio':
                return (
                    <AudioPlayer
                        src={file.path}
                        isPlaying={activeAudioId === msg._id}
                        onToggle={() => setActiveAudioId(prev => prev === msg._id ? null : msg._id)}
                    />
                );
            case 'image':
                return (
                    <div className="chat-media-content">
                        <img src={file.path} alt="" onClick={() => window.open(file.path, '_blank')} />
                        {msg.content && <div className="media-caption">{msg.content}</div>}
                    </div>
                );
            case 'video':
                return (
                    <div className="chat-media-content">
                        <video src={file.path} controls />
                        {msg.content && <div className="media-caption">{msg.content}</div>}
                    </div>
                );
            case 'text':
                return msg.content;
            default:
                return (
                    <div className="chat-file-link" onClick={() => window.open(file.path, '_blank')}>
                        <FileIcon size={18} /> <span>{file.filename || t('chat.download_file', 'Télécharger le fichier')}</span>
                    </div>
                );
        }
    };

    const renderTicks = (msg) => {
        if (msg.sender?._id !== user._id) return null;
        const isRead = msg.readBy?.length > 1;
        return (
            <div className={`chat-ticks ${isRead ? 'read' : 'delivered'}`}>
                {isRead ? <CheckCheck size={14} /> : <Check size={14} />}
            </div>
        );
    };

    if (loading) return <div className="chat-loading-shimmer"><div className="shimmer-line" /><div className="shimmer-line short" /></div>;

    return (
        <div className="premium-chat-box">
            <div className="chat-header-banner">
                <div className="chat-icon-wrapper"><MessageSquare size={18} /></div>
                <div className="chat-info">
                    <h3>{t('chat.official_title')}</h3>
                    <p>{user.role === 'admin' ? t('chat.support_role') : t('chat.admin_discussion')}</p>
                </div>
            </div>

            <div className="chat-messages-viewport" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="chat-welcome">
                        <div className="welcome-icon"><Inbox size={48} opacity={0.2} /></div>
                        <h4>{t('chat.empty_title')}</h4>
                        <p>{user.role === 'admin' ? t('chat.empty_admin') : t('chat.empty_citizen')}</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`message-row ${msg.sender?._id === user._id ? 'me' : 'them'}`}>
                            {msg.sender?._id !== user._id && <div className="sender-tag">{msg.sender?.role === 'admin' ? t('chat.administration') : msg.sender?.name}</div>}
                            <div className="bubble-context">
                                <div className={`message-bubble ${msg.type !== 'text' ? 'media-type' : ''}`}>
                                    {renderMessageContent(msg)}
                                </div>
                                <div className="message-meta-data">
                                    <span className="msg-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {renderTicks(msg)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Media Preview before send */}
            {filePreview && !audioBlob && (
                <div className="chat-media-preview-bar">
                    <div className="preview-bubble">
                        <img src={filePreview} alt="" />
                        <button type="button" onClick={clearMedia} className="close-preview"><X size={12} /></button>
                    </div>
                </div>
            )}

            {/* WhatsApp style Audio Preview */}
            {audioBlob && (
                <div className="audio-preview-overlay">
                    <AudioPreview
                        blob={audioBlob}
                        onCancel={clearMedia}
                        onSend={() => handleSendMessage()}
                        isSending={sending}
                    />
                </div>
            )}

            {!audioBlob && (
                <form className="chat-composer" onSubmit={handleSendMessage}>
                    <div className="composer-wrapper">
                        {!recording ? (
                            <>
                                <button type="button" className="btn-icon" onClick={() => fileInputRef.current.click()}><Paperclip size={18} /></button>
                                <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} accept="image/*,video/*,audio/*" />

                                <input
                                    type="text" placeholder={t('chat.placeholder')}
                                    value={newMessage} onChange={e => setNewMessage(e.target.value)}
                                    autoComplete="off"
                                />

                                {!newMessage.trim() && !filePreview ? (
                                    <button type="button" className="btn-mic" onClick={startRecording}><Mic size={18} /></button>
                                ) : (
                                    <button type="submit" className="btn-send" disabled={sending}>
                                        {sending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="recording-mode">
                                <div className="record-indicator" />
                                <span>{t('chat.recording', 'Enregistrement...')}</span>
                                <div className="recording-timer">
                                    <button type="button" className="btn-stop-record" onClick={stopRecording}><Square size={16} fill="white" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            )}

            <style>{`
                .premium-chat-box { background: var(--bg-secondary); border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; height: 500px; overflow: hidden; box-shadow: var(--shadow-lg); font-family: inherit; }
                .chat-header-banner { padding: 16px 20px; background: var(--brand-navy); color: white; display: flex; align-items: center; gap: 12px; }
                .chat-icon-wrapper { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .chat-info h3 { font-size: 0.9rem; margin: 0; font-weight: 700; }
                .chat-info p { font-size: 0.7rem; margin: 0; opacity: 0.7; }
                .chat-messages-viewport { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; background: var(--bg-primary); }
                .message-row { display: flex; flex-direction: column; max-width: 85%; align-self: flex-start; }
                .message-row.me { align-self: flex-end; }
                .sender-tag { font-size: 0.65rem; font-weight: 700; color: var(--brand-orange); margin-bottom: 4px; margin-left: 4px; }
                .message-bubble { padding: 10px 14px; border-radius: 16px; font-size: 0.92rem; line-height: 1.4; border: 1px solid var(--border); transition: all 0.2s; }
                .me .message-bubble { background: var(--brand-orange); color: white; border-bottom-right-radius: 2px; border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .them .message-bubble { background: white; color: #1f2937; border-bottom-left-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .message-bubble.media-type { padding: 4px; background: white; color: #1f2937; }
                .me .message-bubble.media-type { background: var(--brand-orange); color: white; }
                .chat-media-content img, .chat-media-content video { max-width: 100%; border-radius: 12px; display: block; }
                .media-caption { padding: 8px 10px; font-size: 0.85rem; }
                .message-meta-data { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 4px; font-size: 0.72rem; color: rgba(255,255,255,0.7); }
                .me .message-meta-data { color: rgba(255,255,255,0.9); }
                .chat-ticks { display: flex; align-items: center; color: rgba(255,255,255,0.5); }
                .chat-ticks.read { color: #38bdf8; }
                .audio-player-bubble { display: flex; alignItems: center; gap: 10px; padding: 6px 12px; min-width: 180px; }
                .play-btn { width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255,255,255,0.2); color: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .audio-wave { flex: 1; display: flex; align-items: center; gap: 3px; }
                .wave-bar { width: 3px; height: 12px; background: currentColor; opacity: 0.3; border-radius: 2px; }
                .wave-bar.animating { animation: wave 0.5s infinite alternate; }
                @keyframes wave { to { height: 20px; opacity: 0.8; } }
                .chat-composer { padding: 12px 16px; background: var(--bg-secondary); border-top: 1px solid var(--border); }
                .composer-wrapper { background: var(--bg-primary); border-radius: 24px; padding: 4px; display: flex; align-items: center; border: 1px solid var(--border); }
                .composer-wrapper input { flex: 1; border: none; background: transparent; padding: 8px 12px; outline: none; color: var(--text-primary); }
                .btn-icon { width: 36px; height: 36px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .btn-send, .btn-mic { width: 36px; height: 36px; border: none; border-radius: 50%; background: var(--brand-orange); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .recording-mode { flex: 1; display: flex; align-items: center; gap: 12px; padding: 0 16px; color: #ef4444; font-weight: 600; font-size: 0.85rem; }
                .record-indicator { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: blink 0.8s infinite; }
                @keyframes blink { to { opacity: 0.3; } }
                .chat-media-preview-bar { padding: 10px 20px; background: var(--bg-secondary); display: flex; }
                .preview-bubble { position: relative; width: 60px; height: 60px; border-radius: 8px; border: 1px solid var(--border); background: white; display: flex; align-items: center; justify-content: center; }
                .preview-bubble img { width: 100%; height: 100%; object-fit: cover; border-radius: 7px; }
                .close-preview { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: var(--red); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }

                /* WhatsApp Style Audio Preview */
                .audio-preview-overlay { padding: 8px 16px; background: var(--bg-secondary); border-top: 1px solid var(--border); }
                .whatsapp-audio-preview { display: flex; align-items: center; gap: 12px; background: var(--bg-primary); border-radius: 30px; padding: 6px 12px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
                .action-btn { width: 36px; height: 36px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s; }
                .action-btn:hover { background: var(--bg-secondary); }
                .action-btn.delete { color: var(--red); }
                .action-btn.play { color: var(--brand-orange); }
                .preview-wave-container { flex: 1; height: 30px; display: flex; align-items: center; overflow: hidden; }
                .waveform-mock { display: flex; align-items: center; gap: 2px; }
                .wave-segment { width: 2px; background: var(--border); border-radius: 1px; }
                .wave-segment.active { background: var(--brand-orange); }
                .timer { font-size: 0.8rem; font-weight: 600; min-width: 35px; color: var(--text-secondary); }
                .mic-indicator { color: var(--red); margin: 0 4px; }
                .send-circle-btn { width: 42px; height: 42px; border: none; border-radius: 50%; background: var(--brand-orange); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, opacity 0.2s; }
                .send-circle-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .send-circle-btn:hover:not(:disabled) { transform: scale(1.05); }
                
                .recording-mode { flex: 1; display: flex; align-items: center; justify-content: space-between; }
                .recording-timer { display: flex; align-items: center; gap: 10px; }
            `}</style>
        </div>
    );
};

export default ChatBox;
