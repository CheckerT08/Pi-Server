# Raspberry Pi Smart Home Server

A custom Node.js server running on my local Raspberry Pi. I built it to control my home setup (like audio and TV), share useful stuff between my devices, and keep track of my homework.

---

## About The Project

This repository contains a local server designed to run on a Raspberry Pi. It centralizes control over home automation devices, syncs utilities between devices, and acts as a personal productivity hub.

## Key Features

* **Jarvis-like Voice Assist:** Fast keyword matching with dynamic parameter extraction, command chaining (using `"und"`), and automatic fallback to the Mistral-AI API.
* **Multi-Room Audio Control:** Direct integration with Yamaha MusicCast devices over the local network with automatic playback state caching, source switching, and volume limits.
* **Homework Manager:** Web interface & REST API endpoints with persistent local storage, overdue task detection, and daily automated cleanup.
* **System Utils & Misc:** * Real-time Raspberry Pi hardware metrics (CPU, RAM, temp, disk).
  * Two-way clipboard synchronization with laptop and phone via `ntfy.sh`.
  * Weather forecasting via Open-Meteo API with location caching.

## Tech Stack

* **Backend:** Node.js (ES Modules), Express.js, Tailscale
* **Frontend:** EJS Templates, CSS, JavaScript (PWA enabled)
* **Integrations:** Mistral AI, Open-Meteo API, ntfy.sh, Yamaha Extended Control Protocol

## Project Structure

```text
.
├── config/                   Environment configuration
├── commands/                 Smart home commands, helper functions
├── data/                     Persistent storage (tasks & ai instructions)
├── public/                   Static frontend assets (CSS, JS, SW)
├── views/                    EJS templates
├── helper_funcs.js           Common functions, utilities
├── homework_manager.js       Homework class & file persistence
├── setup_api.js              REST endpoints (Jarvis, Clipboard, Homework)
├── setup_webpages.js         Web pages
├── server.js                 Server entry point
├── smart_home_commands.js    Centralized entry point for Jarvis commands
└── smart_home_mappings.js    Keyword mapping & regex patterns for Jarvis
```

## Installing

### Prerequisites

* Node.js
* npm
* Mistral-AI API key (enter in .env)

### Installation

1. Clone the repository:
  ```bash
  git clone https://github.com/CheckerT08/Pi-Server.git
  cd Pi-Server
  ```

2. Install dependencies:
  ```bash
  npm install
  ```


3. Configure environment variables:
Create a `.env` file in the root directory (refer to `.env.example` or the section below) and fill in your IP addresses, API keys, and notification topics.
4. Start the server:
```bash
npm start
```

---

## Configuration (.env)

The server requires environment variables to communicate with your local network hardware and external APIs. Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000

# Local Device IPs (Yamaha MusicCast)
MUSIC_BOX_IP=123.123.123.123
KÜCHE_BOX_IP=123.123.123.123
WOHNZIMMER_BOX_IP=123.123.123.123

# External APIs & Misc Settings
MISTRAL_API_KEY=your_mistral_api_key_here
LOCATION=newYork

# ntfy.sh Topics (Sync & Notifications)
NTFY_GET_CLIPBOARD=NTFY-Channel-Name
NTFY_SET_CLIPBOARD=NTFY-Channel-Name
NTFY_BLUETOOTH_ON=NTFY-Channel-Name
NTFY_BLUETOOTH_OFF=NTFY-Channel-Name
NTFY_TIMER=NTFY-Channel-Name
NTFY_DLNA=NTFY-Channel-Name
NTFY_DLNAEND=NTFY-Channel-Name
NTFY_BOTTOMTV=NTFY-Channel-Name
```
