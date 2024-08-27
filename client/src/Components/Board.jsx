import React, { useState, useEffect } from 'react';
import Square from './Square';
import Move from './Move';


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
    const [board, setBoard] = useState(roomBoard || initialBoardState());
    const [validMoves, setValidMoves] = useState([]);
    const [selectedPiece, setSelectedPiece] = useState("");
    const [selectedPosition, setSelectedPosition] = useState(null);

    useEffect(() => {
        // Listen for move_made event to update the board
        console.log("socket");
        console.log(socket);
        socket.on("move_made", ({ gameBoard, moveCount }) => {
            setBoard(gameBoard);
            console.log("Board updated:", gameBoard);
        });

        return () => {
            socket.off("move_made");
        };
    }, []);

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
    
        // Emit move to the server without the socket object
        socket.emit("make_move", {
            playerType: user,
            roomID: roomId,
            move: `${board[selectedPosition[0]][selectedPosition[1]]}:${move}`
        });
    
        setSelectedPiece("");
        setValidMoves([]);
    };
    

    const handleSquareClick = (square, [rowIndex, colIndex]) => {
        if ((user === "A" && moveCount % 2 === 0) || (user === "B" && moveCount % 2 !== 0)) {
            showValidMoves(square, [rowIndex, colIndex]);
        }
    };

    return (
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
    );
};

export default Board;
