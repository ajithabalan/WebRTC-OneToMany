import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import "./App.css";

function App() {
  const [peerId, setPeerId] = useState("");
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [manualId, setManualId] = useState("");
  const [statusMap, setStatusMap] = useState({});
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const connectionsRef = useRef([]);

  // Initialize PeerJS
  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      console.log("Peer ID Broadcaster:", id);
    });

    peer.on("call", (call) => {
      console.log("Incoming call from", call.peer);
      const stream = localStreamRef.current;

      if (!stream) {
        console.log("No local stream to answer with");
        return;
      }

      setStatusMap((prev) => ({ ...prev, [call.peer]: "Connecting" }));
      call.answer(stream);

      call.on("close", () => {
        console.log("Call closed:", call.peer);
        setStatusMap((prev) => ({ ...prev, [call.peer]: "Disconnected" }));
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
        setStatusMap((prev) => ({ ...prev, [call.peer]: "Error" }));
      });

      connectionsRef.current.push(call);
    });

    return () => {
      peer.disconnect();
    };
  }, []);

  // Start broadcasting
  const startBroadcasting = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Failed to get local stream:", err);
    }
  };

  // Generate dummy stream
  const createDummyStream = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 1, 1);
    const videoStream = canvas.captureStream();
    const videoTrack = videoStream.getVideoTracks()[0];

    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const dst = oscillator.connect(audioCtx.createMediaStreamDestination());
    oscillator.start();
    const audioTrack = dst.stream.getAudioTracks()[0];

    return new MediaStream([videoTrack, audioTrack]);
  };

  // Connect to broadcaster
  const connectToBroadcaster = async () => {
    const peer = peerRef.current;
    if (!peer || !manualId) {
      console.log("Peer or manualId not set");
      return;
    }

    console.log("Connecting to broadcaster with ID:", manualId);
    setStatusMap((prev) => ({ ...prev, [manualId]: "Connecting" }));

    try {
      const dummyStream = createDummyStream();
      const call = peer.call(manualId, dummyStream);

      if (!call) {
        console.log("Call object not returned");
        return;
      }

      call.on("stream", (remoteStream) => {
        console.log("Received remote stream from broadcaster");
        setRemoteStreams((prev) => [
          ...prev,
          { id: manualId, stream: remoteStream },
        ]);
        setStatusMap((prev) => ({ ...prev, [manualId]: "Connected" }));
      });

      call.on("close", () => {
        setStatusMap((prev) => ({ ...prev, [manualId]: "Disconnected" }));
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
        setStatusMap((prev) => ({ ...prev, [manualId]: "Error" }));
      });

      connectionsRef.current.push(call);
    } catch (err) {
      console.error("Error during viewer connection:", err);
      setStatusMap((prev) => ({ ...prev, [manualId]: "Error" }));
    }
  };

  // Hang up
  const hangUp = () => {
    connectionsRef.current.forEach((call) => call.close());
    connectionsRef.current = [];
    setRemoteStreams([]);
    setStatusMap({});
  };

  return (
    <div className="app-container">
      <h2>One-to-Many Video Broadcast</h2>

      {/* Broadcaster */}
      <div className="section">
        <h3>Broadcaster</h3>
        <button onClick={startBroadcasting}>Start Broadcasting</button>
        <video ref={localVideoRef} autoPlay playsInline muted />
        <p>Your Peer ID:</p>
        <textarea readOnly value={peerId} rows={2} />
        <button onClick={() => navigator.clipboard.writeText(peerId)}>
          Copy
        </button>
      </div>

      {/* Viewer */}
      <div className="section">
        <h3>Viewer</h3>
        <textarea
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="Paste broadcaster's Peer ID"
          rows={2}
        />
        <button onClick={connectToBroadcaster}>Connect</button>
        <button onClick={hangUp}>Hang Up</button>
      </div>

      {/* Remote Streams */}
      <div className="section">
        <h3>Remote Streams</h3>
        <div className="video-grid">
          {remoteStreams.length === 0 && <p>No remote streams available</p>}
          {remoteStreams.map(({ id, stream }) => (
            <div key={id}>
              <video
                autoPlay
                playsInline
                ref={(el) => el && (el.srcObject = stream)}
              />
              <p>Status: {statusMap[id] || "Connecting..."}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
