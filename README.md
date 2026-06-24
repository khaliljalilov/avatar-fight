# Avatar Fight: Chaos Arena

A real-time interactive battle arena integrated with TikTok Live streams where audience interactions directly affect gameplay.

Built with React (Vite), Node.js, Socket.io, and HTML5 Canvas.

---

## 🎥 Demo

Demo Video:
https://streamable.com/x8cyx0

---

## 🚀 Features

* **Real-Time Communication**
  Implemented bi-directional communication using Socket.io for instant game updates.

* **TikTok Live Integration**
  Processes live interactions including gifts, follows, and comments and converts them into in-game events.

* **Interactive Control Panel**
  Allows streamers to connect to any active TikTok live session through an admin interface.

* **Canvas-Based Rendering Engine**
  Built dynamic visual effects and game mechanics using HTML5 Canvas.

* **Performance Optimization**
  Improved rendering efficiency and state management for smoother gameplay.

---

## 🧱 Project Structure

```bash
avatar-fight/
│
├── chaos-arena/       # Frontend (React + Vite)
└── chaos-backend/     # Backend (Node.js + Socket.io)
```

---

## 🛠 Tech Stack

### Frontend

* React.js
* Vite
* HTML5 Canvas

### Backend

* Node.js
* Express.js
* Socket.io

### Tools

* Git
* REST APIs

---

## ⚙ Installation

### Clone Repository

```bash
git clone https://github.com/khaliljalilov/avatar-fight.git
cd avatar-fight
```

### Run Backend

```bash
cd chaos-backend
npm install
node server.js
```

Backend runs on:

```bash
http://localhost:3001
```

### Run Frontend

```bash
cd ../chaos-arena
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

## 🎮 Usage

1. Start backend and frontend servers.
2. Open the application in your browser.
3. Click the Control Panel button.
4. Enter an active TikTok username.
5. Watch audience interactions trigger live gameplay events.

---

## 💡 Future Improvements

* Multiplayer support
* Additional battle mechanics
* Better mobile optimization
* Match statistics and leaderboard

---

Created by Babakhalil Jalilov
