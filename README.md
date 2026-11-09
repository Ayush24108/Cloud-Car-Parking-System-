# CloudPark 3D - Campus Smart Parking System 🚗⚡

An intelligent, cloud-connected Car Parking Management System featuring a **real-time 3D interactive user interface** built with **Three.js** and backed by a **Spring Boot REST API** with MySQL and JWT security.

Developed specifically for campus environments (with built-in `@thapar.edu` domain verification and pre-seeded campus parking zones).

---

## 🌟 Key Highlights

### 🏎️ Interactive 3D Digital Twin (Three.js)
- **Procedural 3D Parking Lot**: Realistic asphalt tarmac, curbs, road markings, entry boom-barriers, trees, and campus street lamps with localized night illumination.
- **Dynamic 3D Cars**: Procedurally rendered modern 3D vehicle models (with colored body chassis, tinted glass cabin, headlights, taillights, and metallic rims) parked inside reserved and occupied spaces.
- **Color-Coded Status Slots**:
  - 🟢 **Emerald Green**: `AVAILABLE` (with subtle animated breathing glow)
  - 🟡 **Amber Gold**: `RESERVED`
  - 🔴 **Ruby Red**: `OCCUPIED` (with parked 3D car)
  - ⚪ **Steel Hazard**: `MAINTENANCE`
- **Slot Type Markers**: Standard, ⚡ EV Charging, 🚙 Compact, ♿ Handicap / VIP.
- **Raycasting Interactivity**:
  - Hovering reveals a dynamic floating tooltip showing space number, type, and hourly rate.
  - Clicking a slot smoothly flies the 3D camera to frame the space and opens the **Booking & Inspection Drawer**.
- **Cinematic Camera Controls**:
  - 🎥 **Isometric View** (45° angle)
  - 📐 **Top-Down 2D Architectural View**
  - 🏎️ **Driveway / Driver View**
  - 🔄 **OrbitControls** (drag to rotate, scroll to zoom, right-click to pan)
- **Atmospheric Controls**:
  - ☀️ / 🌙 **Day & Night Mode Toggle**: Switches between sunny daylight and a cyberpunk night mode with glowing street lamps and slot lines.
  - 🤖 **Live Traffic Simulation Mode**: Simulates real-time campus cars arriving and departing every few seconds.

---

### 🛡️ Robust Spring Boot REST API
- **Spring Security & Stateless JWT Authentication**: Generates 24-hour signed HMAC-SHA256 tokens. Enforces `@thapar.edu` domain restriction.
- **Conflict & Overlap Prevention**: Robust JPQL queries detect and prevent double-booking collisions for the same parking slot or overlapping bookings by the same user.
- **Dynamic Fee Calculator**: Computes parking fees based on duration and hourly rate ($$\text{Fee} = \max(1, \text{Hours}) \times \text{Rate}$$).
- **Admin Analytics**: Real-time lot occupancy rate (%) calculation and accumulated revenue metrics.
- **Pre-Configured Data Seeder**: Automatically seeds default accounts and 100 campus parking slots across 2 parking zones upon first launch.

---

## 🏗️ Project Architecture

```
Cloud-Car-Parking-System--Java/
├── src/
│   ├── main/
│   │   ├── java/com/cloudparking/parking/backend/
│   │   │   ├── config/            # DataInitializer (auto-seeds accounts & slots)
│   │   │   ├── controller/        # REST APIs (Auth, Booking, Spaces, Lots, Analytics)
│   │   │   ├── dto/               # Request/Response Data Transfer Objects
│   │   │   ├── entity/            # JPA Entities (User, ParkingLot, ParkingSpace, Booking)
│   │   │   ├── enums/             # Role, SpaceStatus, SpaceType, BookingStatus
│   │   │   ├── exception/         # Global Exception Handlers
│   │   │   ├── repository/        # Spring Data JPA Repositories
│   │   │   ├── security/          # Spring Security, JWT Filter, CORS Config
│   │   │   └── service/           # Business Logic (Auth, Booking, Analytics)
│   │   └── resources/
│   │       ├── application.yml    # Database & server configuration
│   │       └── static/            # Top-Notch 3D Web Frontend
│   │           ├── index.html     # Main HUD & 3D WebGL viewport
│   │           ├── css/style.css  # Modern glassmorphism dark theme
│   │           └── js/
│   │               ├── api.js         # REST API client & auth token storage
│   │               ├── parking3d.js   # Three.js 3D rendering engine & procedural cars
│   │               ├── app.js         # Application state, filters, booking modals
│   │               └── vendor/        # Local Three.js, OrbitControls, GSAP (offline-ready)
│   └── test/
└── pom.xml                        # Maven dependencies & build configuration
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Java 21+** (Java 25 target configured)
- **MySQL Server** (running locally on port 3306)

### 2. Configure MySQL Database
Open your MySQL terminal or Workbench and create the database:
```sql
CREATE DATABASE cloud_parking_db;
```

Update your MySQL root password in [`src/main/resources/application.yml`](src/main/resources/application.yml):
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/cloud_parking_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: YOUR_MYSQL_PASSWORD
```

### 3. Run the Application
Open PowerShell or your terminal in this directory and run:
```bash
./mvnw spring-boot:run
```
*(Or use standard `mvn spring-boot:run`)*

### 4. Open the 3D Web Application
Once Spring Boot boots up, open your web browser:
👉 **`http://localhost:8080/`**

---

## 🔑 Default Test Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Student** | `alex@thapar.edu` | `user123` | View 3D lots, reserve slots, view & cancel bookings |
| **Campus Admin** | `admin@thapar.edu` | `admin123` | All student features + Live Analytics & Add Space tools |

*(Note: The login popup includes **1-Click Demo Fill** buttons for immediate sign-in!)*

---

## 📡 API Endpoints Reference

| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status check |
| `POST` | `/api/auth/register` | Public | Register new `@thapar.edu` user |
| `POST` | `/api/auth/login` | Public | Login and receive JWT token |
| `GET` | `/api/lots` | Public | List all parking lots |
| `POST` | `/api/lots` | Admin | Create a new parking lot |
| `GET` | `/api/spaces/lot/{lotId}/all` | Public | Fetch all slots for 3D digital twin |
| `GET` | `/api/spaces/lot/{lotId}` | Public | Fetch only available slots |
| `POST` | `/api/spaces` | Admin | Add new parking slot |
| `PATCH`| `/api/spaces/{id}/status` | Admin | Override slot status |
| `POST` | `/api/bookings` | User/Admin | Reserve a parking space |
| `PUT` | `/api/bookings/{id}/cancel` | User/Admin | Cancel a reservation |
| `GET` | `/api/bookings?email={email}` | User/Admin | View user booking history |
| `GET` | `/api/analytics/lots/{id}/occupancy` | Admin | View live occupancy % and breakdown |
| `GET` | `/api/analytics/lots/{id}/revenue` | Admin | View total revenue earned |

---

## 👥 Contributors

- **Ayush Jindal** — Computer Engineering, Thapar Institute of Engineering and Technology, Patiala
- **Tanish Bansal** — Computer Engineering, Thapar Institute of Engineering and Technology, Patiala
- **Mehak Garg** — Computer Engineering, Thapar Institute of Engineering and Technology, Patiala

---

## 📜 License

This project is developed for educational and academic purposes at Thapar Institute of Engineering and Technology.
