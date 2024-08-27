import React, { useEffect, useMemo, useState } from 'react';
import { io } from "socket.io-client";
import Board from './Components/Board';
import Button from './Components/Button';
import { getCookie } from './utils/cookiefetcher';
import axios from "axios";

const App = () => {
  const server = "http://localhost:3000";
  const socket = useMemo(() => io(server, {
    withCredentials: true,
  }), []);

  const [roomId, setRoomId] = useState("");
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("Click on Join Game to Start Match");
  const [opponentId, setOpponentId] = useState(null);
  // gameStates
  const [gameStatus, setGameStatus] = useState("waiting");
  const [moveCount, setMoveCount] = useState(0);
  const [board, setBoard] = useState();

  const joinGame = () => {
    const roomID = getCookie("roomID");
    console.log(roomID);
    socket.emit("join_game", { roomID });
  };

  useEffect(() => {
    // hitting backend
    axios.get(`${server}/`, {
      withCredentials: true
    });

    const roomID = getCookie("roomID");
    if(roomID){
      joinGame();
    }

    socket.on("waiting_for_opponent", () => {
      setMessage("Waiting for an opponent...");
    });

    // error
    socket.on("error", ({status, message}) => {
      console.log(message);
    });

    // movement
    socket.on("move_made", ({gameBoard, moveCount}) => {
      setMoveCount(moveCount);
      console.log(gameBoard);
    })

    // Listen for init-game event
    socket.on("init-game", ({ roomID, opponentID, type, gameBoard, moveCount }) => {
      setOpponentId(opponentID);
      console.log("Type: ", type);
  
      // Set each cookie value separately
      document.cookie = `roomID=${roomID};path=/;SameSite=None;Secure`;
      document.cookie = `type=${type};path=/;SameSite=None;Secure`;
  
      console.log("Matched with opponent:", opponentID);
      console.log("Room ID:", roomID);

      setUser(type);
      setRoomId(roomID);
      setGameStatus("active");
      setBoard(gameBoard);
      setMoveCount(moveCount);
  });

    return () => {
      socket.disconnect();
    };
  }, []);

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
          <Board socket={socket} roomGrid={board} moveCount={moveCount} user={user}/>
        </div>
      {/* {opponentId && (
        <p>You are matched with opponent: {opponentId}</p>
      )}
      {roomId && (
        <p>You are in room: {roomId}</p>
      )} */}
      <Button text={"Join Game"} event={joinGame} />
    </div>
  );
}

export default App;
