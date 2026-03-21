Here is the comprehensive Project Requirements Document (PRD) formatted specifically for an AI coding agent. It
***

# System Prompt & PRD: Project "Scraps"

## 1. Project Overview
**Objective:** Build a Progressive Web App (PWA) called "Scraps" to track household leftovers and prevent food waste. 
**Target Audience:** Non-technical users (specifically parents/family members). UI must prioritize high legibility, low friction, and quick data entry.
**Deployment Environment:** Self-hosted on a Linux host (x86_64 architecture) utilizing rootless Podman containers.
**Network Architecture:** Centralized server exposed via Cloudflare Tunnels with Cloudflare Access (Zero Trust) handling user authentication. No exposed local ports.

## 2. Technical Stack
The AI agent must strictly adhere to the following stack:
* **Frontend Framework:** React 18+ (initialized via Vite).
* **Styling:** Tailwind CSS.
* **Icons:** Lucide-React.
* **Backend/Database:** PocketBase (latest Linux binary).
* **Containerization:** Podman (`podman-compose`).
* **Web Server (Frontend delivery):** Nginx (Alpine-based Docker image).
* **Network Ingress:** `cloudflared` (Cloudflare Tunnel daemon).

## 3. Architecture & Infrastructure
The application will run as a single Podman Pod containing three containers. 

### Container Specifications
| Container Name | Image/Build | Internal Port | Responsibilities |
| :--- | :--- | :--- | :--- |
| `scraps-db` | `mujo/pocketbase:latest` | `8090` | SQLite database, REST API, real-time WebSocket sync. |
| `scraps-ui` | Custom `Dockerfile` (Nginx) | `80` | Serves the compiled Vite/React static assets. |
| `scraps-tunnel`| `cloudflare/cloudflared:latest`| N/A | Connects `localhost:80` and `localhost:8090` to Cloudflare. |

*Agent Instruction:* The AI must generate a `podman-compose.yml` file, a multi-stage `Dockerfile` for the frontend, and instructions to generate a systemd unit file (`podman generate systemd`) for persistence across host reboots.

## 4. Database Schema (Multi-Tenant)
The PocketBase database must be structured to support multiple isolated households. The AI agent must configure the following collections and relations:

Collection 1: households
| Field Name | Type | Constraints |
| :--- | :--- | :--- |
| id | Standard PB ID | Auto-generated |
| name | Text | Required (e.g., "The Smith Family") |

Collection 2: users (PocketBase System Collection)
| Field Name | Type | Constraints |
| :--- | :--- | :--- |
| household_id | Relation | Points to households. Max select: 1. Required. |
| avatar | File | Optional. Max 2MB. |
| (Standard Fields)| (Email, Password)| Managed natively by PocketBase. |

Collection 3: leftovers (Updated)
| Field Name | Type | Constraints |
| :--- | :--- | :--- |
| household_id | Relation | Points to households. Required. |
| added_by | Relation | Points to users. Required. |
| item_name | Text | Required. |
| category | Select | meat, poultry, seafood, veg, dairy, grains, other |
| expiry_date | Date | Required. |
| status | Select | active, consumed, wasted. |
## 5. Core Logic & Algorithms

### Expiration Calculation
When a user selects a `category`, the frontend must automatically calculate the default `expiry_date`. The user can manually override this date.

**Category Shelf-Life Map:**
* Seafood: 2 days
* Meat/Poultry: 3 days
* Dairy/Soups: 4 days
* Grains/Pasta: 5 days
* Veg/Other: 5 days

**Time Remaining Formula:**
The frontend must constantly evaluate the time remaining ($T_r$) to update UI color codes. Let $D_e$ be the expiration timestamp and $D_c$ be the current timestamp.
$$T_r = D_e - D_c$$

### Status Color Coding
* **Green (Fresh):** $T_r > 48$ hours.
* **Yellow (Warning):** $0 < T_r \le 48$ hours.
* **Red (Expired):** $T_r \le 0$.

### Image Handling Pipeline
To prevent database bloat, the PWA must process images client-side before uploading to PocketBase:
1.  Request camera access via `navigator.mediaDevices.getUserMedia`.
2.  Capture frame to an HTML `<canvas>`.
3.  Resize image so the maximum dimension (width or height) is 800 pixels.
4.  Compress to `.webp` format at 0.8 quality.
5.  Upload compressed blob to PocketBase.

## 6. User Interface Requirements
* **Global Design:** Mobile-first layout. No horizontal scrolling. Minimum touch-target size is 44x44 CSS pixels. High contrast text (WCAG AAA).
* **Main Dashboard:** * Lists all `active` items, sorted by `expiry_date` ascending (closest to expiring at the top).
    * Each item card displays: Photo thumbnail, Item Name, Category Icon, Days/Hours remaining, and background color indicator based on $T_r$.
* **Quick Actions:** Each item card must have swipe gestures or large tap buttons for:
    * "Mark Consumed" (Updates status to `consumed`).
    * "Mark Tossed" (Updates status to `wasted`).
* **Add Item Flow:** Floating Action Button (FAB) opens a full-screen modal. The flow must be: Type Name -> Tap Category -> Take Photo (optional) -> Save.

## 7. 7. Authentication & Security (PocketBase Auth)
Login Flow: The React frontend must implement a login/registration screen. Authentication is handled via the PocketBase JavaScript SDK (pb.collection('users').authWithPassword()).

Session Management: The PocketBase SDK automatically stores the auth token in the browser's localStorage (ideal for PWAs).

API Rules (Crucial Security Step): The agent must configure the PocketBase API Rules for the leftovers collection to ensure strict data isolation.

List/View Rule: @request.auth.household_id = household_id (Users can only fetch leftovers linked to their household).

Create Rule: @request.auth.household_id = @request.data.household_id (Users can only create items for their own household).

Update/Delete Rule: @request.auth.household_id = household_id
