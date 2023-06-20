import {io} from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
const URL =
  process.env.NODE_ENV === "production"
    ? "https://signaling-server-videocall.onrender.com/8000"
    : "http://localhost:8000";

console.log("Connecting socket to ", URL);
export const socket = io(URL, {autoConnect: false});
