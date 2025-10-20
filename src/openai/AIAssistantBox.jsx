import React, { useState, useRef, useEffect } from "react";
import "./AIAssistantBox.css";

const AIAssistantBox = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("aiHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const videoRef = useRef(null);

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("http://localhost:5000/ai-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer supersecret123",
        },
        body: JSON.stringify({ prompt: question }),
      });

      const data = await res.json();
      if (!data.answer) throw new Error("No AI response");

      setAnswer(data.answer);
      const updatedHistory = [{ q: question, a: data.answer }, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("aiHistory", JSON.stringify(updatedHistory));

      speakText(data.answer);
    } catch (err) {
      console.error("❌ AI error:", err.message);
      setAnswer("❌ AI is not available at the moment.");
    }

    setLoading(false);
  };

  const detectLang = (text) => /[ăâîșț]/i.test(text) ? "ro-RO" : "en-US";

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = detectLang(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("🎙️ Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "auto";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      askAI();
    };

    recognition.onerror = (event) => {
      console.error("❌ Mic error:", event.error);
      setAnswer("🎤 Microphone error.");
    };

    recognition.start();
  };

  const clearAll = () => {
    setQuestion("");
    setAnswer("");
    setHistory([]);
    localStorage.removeItem("aiHistory");
  };

  useEffect(() => {
    if (cameraOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          console.warn("🎥 Camera error:", err.message);
        });
    } else if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, [cameraOn]);

  return (
    <div className="ai-box cosmic-bg">
      <h2 className="ai-header">
        <div className="ai-avatar-container">
          <svg className="ai-avatar-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" className="ai-avatar-glow" />
            <circle cx="50" cy="50" r="28" fill="#0f0f0f" stroke="#2bdcff" strokeWidth="2" />
            <circle cx="40" cy="45" r="3" fill="#2bdcff" />
            <circle cx="60" cy="45" r="3" fill="#2bdcff" />
            <path d="M40 60 Q50 70 60 60" stroke="#2bdcff" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <span className="neon-text">BitSwapDEX AI Assistant</span>
      </h2>

      <input
        type="text"
        className="ai-input"
        value={question}
        placeholder="Type or speak your question..."
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && askAI()}
      />

      <div className="ai-buttons">
        <button className="ai-button" onClick={askAI}>🚀 Ask</button>
        <button className="ai-button mic" onClick={handleMic}>🎤 Mic</button>
        <button className="ai-button clear" onClick={clearAll}>🧹 Clear</button>
        <button className="ai-button camera-toggle" onClick={() => setCameraOn(!cameraOn)}>
          {cameraOn ? "📴 Turn Off Camera" : "📷 Turn On Camera"}
        </button>
      </div>

      {loading && (
        <div className="ai-response typing"><span>⏳ Thinking...</span></div>
      )}

      {answer && (
        <div className="ai-response fade-in"><span>{answer}</span></div>
      )}

      {history.length > 0 && (
        <div className="ai-history">
          <h4 className="history-title">📜 History</h4>
          {history.map((item, index) => (
            <div className="history-item" key={index}>
              <p><strong>Q:</strong> {item.q}</p>
              <p><strong>A:</strong> {item.a}</p>
              <hr />
            </div>
          ))}
        </div>
      )}

      <div className="video-preview">
        <video ref={videoRef} autoPlay muted width="220" height="160" />
        <p className="camera-label">🎥 Camera Live</p>
      </div>
    </div>
  );
};

export default AIAssistantBox;
