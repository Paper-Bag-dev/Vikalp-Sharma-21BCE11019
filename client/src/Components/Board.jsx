import React, { useState, useEffect, useContext } from 'react';
import Square from './Square';
import Move from './Move';
import { Context } from '../context/context';

const initialBoardState = () => {
    const gridSize = 5;
    const board = Array(gridSize).fill(null).map(() =>
        Array(gridSize).fill(null)
    );

    board[0][0] = "A-P1";
    board[0][1] = "A-P2";
    board[0][2] = "A-H1";
    board[0][3] = "A-H2";
    board[0][4] = "A-P3";

    board[4][0] = "B-P1";
    board[4][1] = "B-P2";
    board[4][2] = "B-H1";
    board[4][3] = "B-H2";
    board[4][4] = "B-P3";

    return board;
};

const Board = ({ socket, roomId, roomBoard, moveCount, user }) => {
    const { loading, setLoading } = useContext(Context);
    const [board, setBoard] = useState(initialBoardState());
    const [validMoves, setValidMoves] = useState([]);
    const [selectedPiece, setSelectedPiece] = useState("");
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [dummy, setDummy] = useState(false);

    useEffect(() => {
        try {
            if (roomBoard) {
                setBoard(roomBoard);
            }
            socket.on("moveMade", ({ gameBoard }) => {
                if (gameBoard) {
                    setBoard(gameBoard);
                    console.log("Board updated:", gameBoard);
                    window.location.reload();
                }
            });

            // Set loading state based on user and moveCount
            if (user === "A") {
                setLoading(moveCount % 2 !== 0);
            } else if (user === "B") {
                setLoading(moveCount % 2 === 0);
            }

            return () => {
                socket.off("moveMade");
            };
        } catch (error) {
            console.error("Error in useEffect:", error);
        }
    }, [socket, roomBoard, moveCount, user]);

    useEffect(() => {
        console.log("Loading state updated:", loading);
    }, [loading]);    

    const moves = ["L", "R", "F", "B"];
    const hero2 = ["FL", "FR", "BL", "BR"];

    const showValidMoves = (piece, position) => {
        if (piece.includes("P")) {
            setValidMoves(moves);
        } else if (piece.includes("H1")) {
            setValidMoves(moves);
        } else if (piece.includes("H2")) {
            setValidMoves(hero2);
        } else {
            setValidMoves([]);
        }
        setSelectedPiece(piece);
        setSelectedPosition(position);
    };

    const handleMove = (move) => {
        if (!selectedPiece || !selectedPosition) return;
        const [pieceInfo, position] = board[selectedPosition[0]][selectedPosition[1]].split(":");
        const [player, piece] = pieceInfo.split("-");

        // MOVEMENT Command
        socket.emit("make_move", {
            playerType: user,
            roomID: roomId,
            move: `${piece}:${move}`
        });
        
        setSelectedPiece("");
        setValidMoves([]);
        window.location.reload();
    };

    const handleSquareClick = (square, [rowIndex, colIndex]) => {
        if ((user === "A" && moveCount % 2 === 0) || (user === "B" && moveCount % 2 !== 0)) {
            showValidMoves(square, [rowIndex, colIndex]);
        }
    };

    return (
        <div className='flex flex-col justify-center'>
            {loading && <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50">
                <p className="text-2xl text-white">Opponent's turn...</p>
            </div>}
            <div className="flex-col">
                <div className="flex-col">
                    {board.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex">
                            {row.map((square, colIndex) => (
                                <Square
                                    key={colIndex}
                                    piece={square}
                                    isSelected={selectedPosition && selectedPosition[0] === rowIndex && selectedPosition[1] === colIndex}
                                    onClick={() => handleSquareClick(square, [rowIndex, colIndex])}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                <span className="text-lg">Selected: {selectedPiece}</span>
                <div className="flex justify-center my-4">
                    {validMoves.map((move, index) => (
                        <Move key={index} piece={move} onClick={() => handleMove(move)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Board;
