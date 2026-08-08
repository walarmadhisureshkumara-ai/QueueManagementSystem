# Queue Management System

sould download the node modules.

## Architecture

```
QueueManagementSystem/
├── backend/          # Express + Socket.IO API server (port 3000)
├── admin-web/        # Admin + Staff web dashboard (React)
├── MymobileApp/      # Customer mobile app (Expo/React Native)
└── database/         # SQL schema
```

## Login Credentials

### Admin Web (`admin-web`)
| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@gmail.com   | 123      |

### Staff Dashboard (`admin-web` — PIN login)
| Name              | Counter           | PIN    |
|-------------------|-------------------|--------|
| K. Jayawardena    | Cash Deposit      | 2241   |
| P. Rathnayake     | Cash Withdrawal   | 3857   |
| A. Gunaratne      | Customer Service  | 1193   |
| N. Perera         | Account Opening   | 4762   |
| S. Fernando       | Loan Services     | 9034   |
| R. Silva          | Cheque Services   | 5581   |
| L. Dissanayake    | Card Services     | 6620   |

### Customer Mobile App (`MymobileApp`)
| Email             | Password |
|-------------------|----------|
| test@example.com  | test123  |

## How to Run

### 1. Backend
```bash
cd backend
npm install
node server.js
```
Runs on `http://localhost:3000`.

### 2. Admin Web
```bash
cd admin-web
npm install
npm start
```
Opens at `http://localhost:3001`.

### 3. Customer Mobile App
```bash
cd MymobileApp
npm install
npx expo start
```
Scan QR code with Expo Go (phone) or press `w` for web browser.

## How It Works

### Flow
1. **Customer** opens mobile app → registers/logs in → selects a service counter → requests a token (**pending** status)
2. **Staff** sees pending request → generates a token number → status becomes **waiting**
3. **Customer** receives token number in real-time → waits in queue
4. **Staff** serves next waiting token → status becomes **serving**
5. **Staff** completes the service → status becomes **completed**

### Real-time Updates
- Socket.IO handles all live updates
- Customers receive `TOKEN_STATUS_CHANGE` events
- Staff receive `NEW_STAFF_NOTIFICATION_{counterId}` events
- Cancel and decline actions notify both sides

### Cancel Flow
- Customer can cancel pending or waiting tokens from `My Tokens` or `Token Details` screen
- Staff receives cancellation notification in real-time
- Admin can manage staff, counters, and view reports from the admin dashboard

## Tech Stack
- **Backend:** Node.js, Express, MySQL, Socket.IO
- **Admin Web:** React, Bootstrap, Socket.IO Client
- **Mobile App:** Expo, React Native, Axios, Socket.IO Client
