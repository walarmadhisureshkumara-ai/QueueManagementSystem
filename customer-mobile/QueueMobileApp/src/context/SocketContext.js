// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    try {
      // IMPORTANT: Replace '192.168.1.X' with your computer's actual local IP address!
      // 'localhost' or '127.0.0.1' will cause a blank screen/timeout on mobile.
      const socketInstance = io('http://192.168.1.X:3000', {
        transports: ['websocket'],
        timeout: 5000, // Forces it to stop hanging if server is down
      }); 

      setSocket(socketInstance);

      socketInstance.on('connect_error', (err) => {
        console.log("Socket connection error handled safely:", err.message);
      });

      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.log("Socket initialization error guarded:", error);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);