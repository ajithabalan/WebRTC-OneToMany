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

  //  Initialize PeerJS
  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      console.log("Peer ID:", id);
    });

    peer.on("call", async (call) => {
      console.log("Incoming call from", call.peer);
      const stream = localStreamRef.current;
      if (!stream) return;

      setStatusMap((prev) => ({ ...prev, [call.peer]: "Connecting" }));
      call.answer(stream);

      call.on("stream", (remoteStream) => {
        console.log("Received remote stream");
        setRemoteStreams((prev) => [
          ...prev,
          { id: call.peer, stream: remoteStream },
        ]);
        setStatusMap((prev) => ({ ...prev, [call.peer]: "Connected" }));
      });

      call.on("close", () => {
        console.log("Call closed:", call.peer);
        setStatusMap((prev) => ({ ...prev, [call.peer]: "Disconnected" }));
      });

      connectionsRef.current.push(call);
    });

    return () => {
      peer.disconnect();
    };
  }, []);

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

  const connectToBroadcaster = () => {
    const peer = peerRef.current;
    if (!peer || !manualId) return;

    setStatusMap((prev) => ({ ...prev, [manualId]: "Connecting" }));

    const call = peer.call(manualId, localStreamRef.current);
    // const call = peer.call(manualId);
    if (!call) return;

    call.on("stream", (remoteStream) => {
      setRemoteStreams((prev) => [
        ...prev,
        { id: manualId, stream: remoteStream },
      ]);
      setStatusMap((prev) => ({ ...prev, [manualId]: "Connected" }));
    });

    call.on("close", () => {
      setStatusMap((prev) => ({ ...prev, [manualId]: "Disconnected" }));
    });

    connectionsRef.current.push(call);
  };

  const hangUp = () => {
    connectionsRef.current.forEach((call) => call.close());
    connectionsRef.current = [];
    setRemoteStreams([]);
    setStatusMap({});
  };

  return (
    <div className="app-container">
      <h2> One-to-Many Video Broadcast</h2>

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

      <div className="section">
        <h3> Viewer</h3>
        <textarea
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="Paste broadcaster's Peer ID"
          rows={2}
        />
        <button onClick={connectToBroadcaster}>Connect</button>
        <button onClick={hangUp}>Hang Up</button>
      </div>

      <div className="section">
        <h3> Remote Streams</h3>
        <div className="video-grid">
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
