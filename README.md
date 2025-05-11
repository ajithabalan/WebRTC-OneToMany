# One-to-Many Video Broadcast App (React + Vite + PeerJS)

A frontend-only application for one-to-many video broadcasting using WebRTC via PeerJS. Built with React and Vite. No backend or server-side signaling — connection setup is done manually through Peer ID exchange.

## Features

- One broadcaster to multiple viewers (peer-to-peer)
- Manual connection via PeerJS ID copy-paste
- Local and remote video display
- Connection state indicators (Connecting / Connected / Disconnected)
- Start, connect, and hang up controls
- Simple, responsive UI layout

## How It Works

### Broadcaster:
1. Click **"Start Broadcasting"**
2. Allow access to camera and microphone
3. Copy the displayed PeerJS ID and send it to viewers

### Viewer:
1. Paste the broadcaster’s Peer ID
2. Click **"Connect"** to view the stream

### To End:
Click **"Hang Up"** to terminate the connection(s)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/webrtc-one-to-many.git
   cd webrtc-one-to-many
