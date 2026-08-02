import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

/**
 * useSocket()
 * Returns the active socket.io instance directly.
 * Usage: const socket = useSocket()
 */
export function useSocket() {
  return useContext(SocketContext);
}