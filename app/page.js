"use client";
import { useState, useEffect } from "react";
import io from "socket.io-client";

const Chat = () => {
  const [room, setRoom] = useState("");
  const [senderId, setSenderId] = useState("66532448bd77a67dfa14bea6"); // Sender ID
  const [receiverId, setReceiverId] = useState(""); // Receiver ID
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [socket, setSocket] = useState(null);
  const [jwtToken, setJwtToken] = useState("");

  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    newSocket.on("newPrivateMessage", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      newSocket.off("newPrivateMessage");
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = (e) => {
    e.preventDefault();
    if (room) {
      socket.emit("joinRoom", room);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("sender", senderId);
    formData.append("receiver", receiverId);
    formData.append("content", message);
    if (audioBlob) {
      formData.append("files", audioBlob, "voiceMessage.ogg");
    }

    try {
      const response = await fetch("http://localhost:4000/messages", {
        method: "POST",
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error sending message");
      }

      const result = await response.json();
      console.log("Message sent:", result);

      // Emit message to socket.io
      socket.emit("sendPrivateMessage", {
        sender: senderId,
        receiver: receiverId,
        content: message,
        voiceUrls: result.voiceUrls || [],
      });

      setMessage("");
      setAudioBlob(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    setMediaRecorder(mediaRecorder);

    mediaRecorder.ondataavailable = (event) => {
      setAudioBlob(event.data);
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Chat Room</h1>
      <form onSubmit={joinRoom}>
        <input
          type="text"
          placeholder="Enter room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            color: "black",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          Join Room
        </button>
      </form>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Receiver ID"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            color: "black",
          }}
        />
        <input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            color: "black",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          Send
        </button>
      </form>
      <div>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: isRecording ? "#dc3545" : "#ffc107",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M12 14c1.656 0 3-1.344 3-3V5c0-1.656-1.344-3-3-3s-3 1.344-3 3v6c0 1.656 1.344 3 3 3zm5-3v-2h-2v2c0 2.756-2.243 5-5 5s-5-2.244-5-5v-2H7v2c0 3.309 2.691 6 6 6s6-2.691 6-6z" />
            <path d="M12 16c-3.313 0-6-2.686-6-6v-2H4v2c0 4.411 3.589 8 8 8s8-3.589 8-8v-2h-2v2c0 3.314-2.687 6-6 6zm0 2v-2h2v2h-2z" />
          </svg>
          {isRecording ? " Stop Recording" : " Start Recording"}
        </button>
        {audioBlob && (
          <audio
            src={URL.createObjectURL(audioBlob)}
            controls
            style={{ width: "100%" }}
          />
        )}
      </div>
      <div>
        <h2 style={{ color: "black" }}>Messages</h2>
        <ul style={{ listStyleType: "none", padding: "0" }}>
          {messages.map((msg, index) => (
            <li
              key={index}
              style={{
                marginBottom: "10px",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                color: "black",
              }}
            >
              <p style={{ margin: "0" }}>{msg.content}</p>
              {msg.voiceUrls &&
                msg.voiceUrls.map((url, idx) => (
                  <audio
                    key={idx}
                    src={url}
                    controls
                    style={{ width: "100%", marginTop: "10px" }}
                  />
                ))}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Chat;
