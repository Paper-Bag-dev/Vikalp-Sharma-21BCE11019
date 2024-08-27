import React, { useEffect, useMemo, useState, useContext } from 'react';
import { io } from "socket.io-client";
import Board from './Components/Board';
import Button from './Components/Button';
import { getCookie } from './utils/cookiefetcher';
import axios from "axios";
import { Context } from './context/context';

const App = () => {
  const { loading, setLoading } = useContext(Context);
  const server = "http://localhost:3000";
  const socket = useMemo(() => io(server, {
    withCredentials: true,
  }), []);

  const [roomId, setRoomId] = useState("");
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("Click on Join Game to Start Match");
  const [opponentId, setOpponentId] = useState(null);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [board, setBoard] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [error, setError] = useState(null); // State for handling errors

  const joinGame = () => {
    const roomID = getCookie("roomID");
    socket.emit("join_game", { roomID });
  };

  useEffect(() => {
    axios.get(`${server}/`, { withCredentials: true });

    const roomID = getCookie("roomID");
    if (roomID) {
      joinGame();
    }

    socket.on("waiting_for_opponent", () => {
      setMessage("Waiting for an opponent...");
    });

    // Error handling
    socket.on("error", ({ status, message }) => {
      console.log(message);
    });

    // Movement handling
    socket.on("moveMade", ({ gameBoard, moveCount }) => {
      console.log("received movements");
      setMoveCount(moveCount);
      setBoard(gameBoard);
      setError(null); // Clear any previous errors
    });

    // Handle invalid move
    socket.on("invalidMove", (message) => {
      setError(message); // Set the error message
    });

    // Listen for init-game event
    socket.on("init-game", ({ roomID, opponentID, type, gameBoard, moveCount }) => {
      setOpponentId(opponentID);

      if (!type) {
        const typeFromCookie = getCookie("type");
        setUser(typeFromCookie);
      } else {
        document.cookie = `type=${type};path=/;SameSite=None;Secure`;
        setUser(type);
      }

      document.cookie = `roomID=${roomID};path=/;SameSite=None;Secure`;

      setRoomId(roomID);
      setBoard(gameBoard);
      setMoveCount(moveCount);
      setGameStatus("active");
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <div className="h-full w-full text-center p-12 text-white bg-[#121212] relative">
      <h1 className="text-3xl font-bold">Advanced Chess-like Game</h1>
      <h1 className='text-2xl'>Current Player: {user}</h1>
      <div className='flex justify-center relative'>
        {gameStatus === "waiting" && (
          <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50">
            <p className="text-2xl text-white">{message}</p>
          </div>
        )}
        {error && (
          <div className="absolute top-0 left-0 w-full h-full bg-red-500/50 flex items-center justify-center z-50">
            <p className="text-2xl text-white">{error}</p>
          </div>
        )}
        <Board socket={socket} roomId={roomId} setMoveCount={setMoveCount} roomBoard={board} moveCount={moveCount} user={user} />
      </div>
      <Button text={"Join Game"} event={joinGame} />
    </div>
  );
};

export default App;
