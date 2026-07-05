# Queue Management System - Customer Mobile App

An Expo-based React Native application for customers to manage queue tokens in a bank/BOC (Banco-like) system.

## Features

- **Customer Authentication**: Secure login with email and password
- **Token Generation**: Generate tokens for different service counters
- **Real-time Updates**: Live token status updates via Socket.io
- **Token Tracking**: View current and historical tokens
- **Token Cancellation**: Cancel tokens if needed
- **Counter Selection**: Browse and select from available service counters
- **Push Notifications**: Receive notifications for token status changes

## Prerequisites

- Node.js (v14 or higher)
- Expo CLI: `npm install -g expo-cli`
- An Expo account (create at https://expo.dev)

## Installation

1. Navigate to the project directory:
```bash
cd customer-mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API URL in `src/config/api.js` and `src/config/socket.js`:
```javascript
const API_BASE_URL = 'http://YOUR_BACKEND_IP:3000';
const SOCKET_URL = 'http://YOUR_BACKEND_IP:3000';
```

## Running the App

### Development Mode

```bash
npm start
```

Then:
- **iOS**: Press `i` to open in iOS simulator
- **Android**: Press `a` to open in Android emulator
- **Web**: Press `w` to open in web browser
- **Expo Go**: Scan the QR code with the Expo Go app

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

### Web

```bash
npm run web
```

## Project Structure

```
customer-mobile-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js          # Customer login
│   │   ├── DashboardScreen.js      # Main dashboard with tokens
│   │   ├── CounterSelectionScreen.js # Select counter for token
│   │   ├── TokenDetailsScreen.js   # View token details
│   │   └── TokenHistoryScreen.js   # View token history
│   ├── config/
│   │   ├── api.js                  # Axios API configuration
│   │   └── socket.js               # Socket.io configuration
├── App.js                          # Main app component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

## API Endpoints Used

- `POST /customer/login` - Customer login
- `GET /customer/tokens` - Get customer tokens
- `POST /customer/tokens` - Create new token
- `GET /customer/tokens/:id` - Get token details
- `POST /customer/tokens/:id/cancel` - Cancel token
- `GET /counters` - Get available counters

## Socket Events

### Emitted Events
- `tokenGenerated` - When a token is generated
- `tokenStatusUpdated` - When token status changes

### Listened Events
- `tokenStatusUpdated` - Receive token status updates
- `tokenCreated` - Receive new token creation
- `tokenUpdated` - Receive token updates

## Building for Production

### EAS Build (Recommended)

```bash
eas build --platform ios
eas build --platform android
```

### Local Build

```bash
npm run build
```

## Troubleshooting

### Connection Issues

1. Make sure backend server is running
2. Update API URLs in `src/config/api.js` and `src/config/socket.js`
3. Check if your mobile device is on the same network as backend
4. For Android emulator, use `10.0.2.2` instead of `127.0.0.1`

### Authentication Issues

1. Verify backend authentication endpoint
2. Check token storage in AsyncStorage
3. Ensure correct email/password credentials

### Socket Connection Issues

1. Verify Socket.io is running on backend
2. Check Socket URL configuration
3. Ensure proper CORS settings on backend

## Security Notes

- Store sensitive data securely using AsyncStorage encryption
- Use HTTPS in production
- Implement proper token expiration
- Add certificate pinning for production
- Validate all API responses

## Contributing

For bug reports and feature requests, please create an issue in the repository.

## License

This project is part of the Queue Management System. All rights reserved.
