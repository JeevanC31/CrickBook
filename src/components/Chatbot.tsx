'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import './Chatbot.css';

const Chatbot = () => {
  const { isChatbotOpen, toggleChatbot } = useAppContext();
  const [messages, setMessages] = useState([
    { text: 'Hi! I can help you book turfs, coaches, or buy equipment. Try saying: "Book a net for tomorrow at 6 PM".', isBot: true }
  ]);
  const [input, setInput] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isChatbotOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { text: input, isBot: false }];
    setMessages(newMessages);
    setInput('');
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { text: 'Let me check availability for that...', isBot: true }]);
    }, 1000);
  };

  return (
    <>
      {isChatbotOpen && (
        <div className="chatbot-widget animate-fade-in" data-testid="chatbot-widget">
          <div className="chat-header">
            <span><i className="fa-solid fa-robot"></i> AI Booking Assistant</span>
            <button className="close-chat" onClick={toggleChatbot} data-testid="close-chatbot">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.isBot ? 'bot' : 'user'}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-footer">
            <input 
              type="text" 
              placeholder="Type your prompt..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn-send" onClick={handleSend}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      <button className={`chatbot-fab ${isChatbotOpen ? 'hidden' : ''}`} onClick={toggleChatbot} data-testid="chatbot-fab">
        <i className="fa-solid fa-robot"></i>
      </button>
    </>
  );
};

export default Chatbot;
