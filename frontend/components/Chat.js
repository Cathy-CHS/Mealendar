import React, { useState, useEffect, useRef } from "react";

const Chat = ({ selectedDate }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messageListRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom when new messages are added
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim()) {
      const newMessages = [...messages, { text: input, sender: "user" }];
      setMessages(newMessages);
      setInput("");

      // Call to backend AI agent
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        credentials: "include", // Send cookies to get calendar context
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input, selected_date: selectedDate }),
      });
      const data = await response.json();

      if (data.response) {
        setMessages([...newMessages, { text: data.response, sender: "ai" }]);
      } else {
        console.error("Error from AI:", data.error);
        setMessages([
          ...newMessages,
          { text: "Sorry, I encountered an error.", sender: "ai" },
        ]);
      }
    }
  };

  return (
    <div className="panel-container">
      <h2 className="panel-title">AI Chat</h2>
      <div className="message-list" ref={messageListRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-row ${msg.sender === "user" ? "user" : "ai"}`}
          >
            <div className="message-bubble">
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about your schedule..."
          className="chat-input"
        />
        <button onClick={handleSend} className="send-button">
          Send
        </button>
      </div>
      <style jsx>{`
        .panel-container {
          background-color: var(--panel-background-color);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-md);
          padding: 1.5rem;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .panel-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .message-list {
          flex-grow: 1;
          overflow-y: auto;
          margin-bottom: 1rem;
          padding-right: 0.5rem; /* For scrollbar */
        }
        .message-row {
          display: flex;
          margin-bottom: 0.75rem;
        }
        .message-row.user {
          justify-content: flex-end;
        }
        .message-row.ai {
          justify-content: flex-start;
        }
        .message-bubble {
          padding: 0.75rem 1rem;
          border-radius: var(--border-radius);
          max-width: 80%;
          word-wrap: break-word;
        }
        .message-row.user .message-bubble {
          background-color: var(--accent-color);
          color: white;
        }
        .message-row.ai .message-bubble {
          background-color: #e9ecef;
          color: var(--text-color);
        }
        .message-bubble p {
          margin: 0;
        }
        .chat-input-area {
          display: flex;
          gap: 0.5rem;
        }
        .chat-input {
          flex-grow: 1;
          border: 1px solid var(--border-color);
          border-radius: 0.25rem;
          padding: 0.75rem;
          font-size: 1rem;
        }
        .chat-input:focus {
          outline: 2px solid var(--accent-color);
          border-color: transparent;
        }
        .send-button {
          background-color: var(--accent-color);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.25rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .send-button:hover {
          background-color: var(--accent-color-dark);
        }
      `}</style>
    </div>
  );
};

export default Chat;
