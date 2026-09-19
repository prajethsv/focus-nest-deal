
# Focus Nest

### A calm study environment, built directly into your browser.

A Chrome extension that combines focused work sessions, companion progression, distraction blocking, ambient environments, session history, and Spotify into one cohesive workspace.

<br>

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=for-the-badge\&logo=googlechrome\&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)](#)
[![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](#)
[![Privacy](https://img.shields.io/badge/Privacy-No%20Telemetry-success?style=for-the-badge)](#)

---

Focus Nest includes multiple visual environments designed for different study moods.

<br>

<div align="center">

<table>
<tr>
<td align="center">
<img src="https://github.com/user-attachments/assets/ce18fe9e-37ae-4b59-8fcc-65bc958fc17c" width="170">
<br>
<strong>Cozy</strong>
</td>

<td align="center">
<img src="https://github.com/user-attachments/assets/9c534e62-b7ce-4899-915a-fd7e9c16aa15" width="170">
<br>
<strong>Rainy</strong>
</td>

<td align="center">
<img src="https://github.com/user-attachments/assets/a969ba4c-b8af-4541-a7b1-223135918796" width="170">
<br>
<strong>Minimal</strong>
</td>

<td align="center">
<img src="https://github.com/user-attachments/assets/f863dbfc-ae72-4ae8-8023-85573f6a28ae" width="170">
<br>
<strong>Nature</strong>
</td>
</tr>
</table>

</div>

## The idea

Productivity software often treats focus as a number.

Focus Nest treats it as an environment.

The project was built around a simple idea: **make starting a study session feel intentional, and make completing one feel rewarding.**

A focus session can block distracting websites, keep a persistent timer running, play music through Spotify, and contribute progress toward a companion that eventually hatches and joins your Nest.

The result is a small study workspace that combines utility with progression without requiring a separate website or account.

---

## Preview

<div align="center">

<table>
<tr>
<td align="center" width="34%">
<img src="https://github.com/user-attachments/assets/47df3391-0291-4e1d-a68c-ce9386f5277f" width="92%">
</td>
<td align="center" width="34%">
<img src="https://github.com/user-attachments/assets/5a7d1ce6-a970-45b6-b8eb-fc546a81d899" width="92%">
</td>
<td align="center" width="32%">
<img src="https://github.com/user-attachments/assets/7b4fcc21-ad5b-486e-9182-3bae39b7268e" width="92%">
</td>
</tr>
</table>

<br>

<table>
<tr>
<td align="center" width="50%">
<img src="https://github.com/user-attachments/assets/b7e4e32b-bf5f-49be-a71a-b0e38246d0a9" width="90%">
</td>
<td align="center" width="50%">
<img src="https://github.com/user-attachments/assets/41d0e340-829c-4e2a-9a02-234c52af25e1" width="90%">ins
<br><br>
<img src="https://github.com/user-attachments/assets/c3c89b7c-3db0-4698-aa93-2f9ea8a53dda" width="90%">
</td>
</tr>
</table>

</div>

---

# Features

<table>
<tr>
<td width="50%" valign="top">

### Pomodoro Focus

A persistent focus timer designed around distraction-free study sessions.

* Focus, short-break and long-break phases
* Configurable session durations
* Background scheduling with `chrome.alarms`
* Live toolbar countdown
* Persistent timer state
* Session skip confirmation
* Automatic phase transitions

</td>
<td width="50%" valign="top">

### Companion Progression

Focus time contributes to a visual progression system.

```text
Pristine
   
Hairline
   
Branching
   
Fractured
   
Hatched
```

Hatched companions can join the Nest Farm and respond to interaction through animations and sounds.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### Distraction Blocking

Block distracting websites while a focus session is active.

Uses Chrome's `declarativeNetRequest` API to enforce blocking rules.

Supported sites can include:

`YouTube`· `Discord`· `Reddit`· `Netflix`· `Instagram`

Already have a blocked site open? Focus Nest can redirect active distraction tabs when focus begins.

</td>
<td width="50%" valign="top">

### Spotify

A floating Spotify player keeps your music accessible while you work.

* Draggable interface
* Album artwork
* Dynamic artwork gradients
* Play / pause
* Track controls
* Progress and scrubbing
* Volume control
* Browser audio ducking

</td>
</tr>

<tr>
<td width="50%" valign="top">

### Study Environments

Four visual environments allow the workspace to change with your mood.

| Environment | Style                            |
| ----------- | -------------------------------- |
| Cosy        | Warm editorial workspace         |
| Rainy       | Darker late-night atmosphere     |
| Nature      | Soft natural environment         |
| Minimal     | Clean distraction-free workspace |

</td>
<td width="50%" valign="top">

### Session History

Focus Nest keeps track of your study activity locally.

* Monthly calendar
* Completed sessions
* Focus streaks
* Daily progress
* Companion progression

The intention is to show progress without turning studying into a competitive leaderboard.

</td>
</tr>
</table>

---

# Design

Focus Nest deliberately avoids the typical productivity-dashboard aesthetic.

The interface uses an editorial visual system built around:

* Fraunces variable serif typography
* Inter sans-serif typography
* Responsive CSS variables
* Environment-specific design tokens
* Layered surfaces
* Subtle animations
* Tactile interaction feedback
* Minimal controls

The visual system is designed so that changing environments affects the entire interface rather than simply replacing a background image.

---

# Architecture

Focus Nest is built as a **Chrome Manifest V3 extension** using vanilla JavaScript.

```text
                           Focus Nest
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
           Timer              Nest            Spotify
             |                 |                 |
             v                 v                 v
       chrome.alarms       Progression       Spotify API
             |                 |
             +--------+--------+
                      |
                      v
             chrome.storage.local
                      |
                      v
               Persistent state
```

### Core technologies

| Technology              | Role                              |
| ----------------------- | --------------------------------- |
| JavaScript / ES6+       | Application logic                 |
| Chrome Manifest V3      | Extension architecture            |
| `chrome.storage.local`  | Local application state           |
| `chrome.alarms`         | Background timer scheduling       |
| `declarativeNetRequest` | Website blocking                  |
| `chrome.identity`       | Spotify authentication            |
| Offscreen Documents     | Audio playback                    |
| CSS Variables           | Theming and environments          |
| Spotify Web API         | Playback information and controls |

---

<details>
<summary><strong>Project structure</strong></summary>

<br>

```text
focus-nest/
│
├── extension/
│   │
│   ├── manifest.json
│   ├── background.js
│   │
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   │
│   ├── blocked.html
│   ├── blocked.js
│   │
│   ├── overlay/
│   │   ├── player.js
│   │   ├── player.css
│   │   └── notification.js
│   │
│   ├── src/
│   │   ├── timer.js
│   │   ├── blocker.js
│   │   ├── companion.js
│   │   ├── spotify.js
│   │   ├── sound.js
│   │   └── ...
│   │
│   ├── data/
│   │   ├── schema.js
│   │   ├── environments.js
│   │   ├── quotes.js
│   │   └── ...
│   │
│   ├── fonts/
│   │   ├── Fraunces
│   │   └── Inter
│   │
│   └── icons/
│
├── assets/
│   └── screenshots/
│
├── README.md
├── LICENSE
└── .gitignore
```

</details>

---

# Privacy

Focus Nest follows a local-first approach.

### Local application data

Timer settings, tasks, progression, and session history are stored using:

```text
chrome.storage.local
```

### No telemetry

Focus Nest does not include an analytics or telemetry system.

### No Focus Nest account

The extension does not require a Focus Nest account or cloud dashboard.

### Spotify

Spotify communication occurs directly with Spotify when the user chooses to connect their account.

---

# Permissions

| Permission              | Purpose                            |
| ----------------------- | ---------------------------------- |
| `storage`               | Store application state locally    |
| `alarms`                | Schedule timer events              |
| `declarativeNetRequest` | Block selected websites            |
| `offscreen`             | Handle audio playback              |
| `tabs`                  | Manage active tabs and audio state |
| `identity`              | Handle Spotify authentication      |

---

# Installation

> Focus Nest is currently distributed as an unpacked Chrome extension during development.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/focus-nest.git
cd focus-nest
```

### 2. Open Chrome

Navigate to:

```text
chrome://extensions
```

### 3. Enable Developer Mode

Enable **Developer mode** in the top-right corner.

### 4. Load the extension

Click:

**Load unpacked**

Then select:

```text
focus-nest/extension/
```

### 5. Pin Focus Nest

Pin the extension to your browser toolbar.

---

# Development

After making changes:

```text
1. Save your changes
2. Open chrome://extensions
3. Find Focus Nest
4. Click Reload
5. Reopen the extension
```

## Engineering & AI-Assisted Development

Focus Nest was designed, architected, and built through an AI-assisted development workflow. Rather than treating AI as a code generator for throwaway snippets, the process was treated as an engineering collaboration focused on product direction, systems design, and rigorous testing.

### Architectural Direction

Designed from day one around Chrome's strict Manifest V3 service worker lifecycle, offscreen audio documents, and Declarative Net Request rules.

### Complex State Management

Directed and debugged asynchronous state transitions across isolated execution contexts (`popup`, `background`, `offscreen`, and in-page content script overlays).

### Edge-Case & Performance Testing

Systematically identified, isolated, and resolved browser-extension edge cases, including:

* Safe offscreen document lifecycles to prevent audio crashes
* Dynamic SVG path calculations and transform offsets for progressive companion cracking
* DeclarativeNetRequest subdomain regex matching (`||domain.com^`) and real-time active tab sweeps
* Non-blocking audio ducking algorithms that dynamically query audible tab states

### Iterative UX Refinement

Engineered an editorial design system utilizing custom CSS variable tokens, fluid typography, and zero-dependency inline SVGs for responsive, high-performance rendering.

---

# Roadmap

### Completed

* [x] Pomodoro focus timer
* [x] Focus and break phases
* [x] Companion progression
* [x] Distraction blocking
* [x] Multiple environments
* [x] Session history
* [x] Spotify integration
* [x] Floating Spotify player

### Planned

* [ ] Additional companion species
* [ ] Expanded Nest Farm
* [ ] More environment interactions
* [ ] Expanded focus statistics
* [ ] Accessibility improvements
* [ ] Chrome Web Store release

---

# Contributing

Contributions, bug reports, and suggestions are welcome.

```bash
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

Then open a pull request.

---

### Spotify Integration

Spotify is an optional integration and requires a free Spotify Developer application. Because Spotify Development Mode restricts access to registered test users, each developer provides their own Client ID.

#### Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. Under app settings, add your redirect URI:
   `https://<YOUR_EXTENSION_ID>.chromiumapp.org/`
   *(Your extension ID is displayed on `chrome://extensions` *
3. Open `extension/data/spotify.config.js` in your editor.
4. Paste your Client ID into `CLIENT_ID: "your_client_id_here"`.
5. Reload the extension in Chrome and click **Connect Spotify**.

Focus Nest uses Authorisation Code with PKCE, so **no Client Secret** is required or stored.


---
</div>
