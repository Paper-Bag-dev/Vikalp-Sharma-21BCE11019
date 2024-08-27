import mongoose from "mongoose";

type GameBoard = string[][];

const schema = new mongoose.Schema({
    status: {
        type: String,
        default: "NULL"
    },
    roomId: {
        type: String
    },
    player1: {
        type: String
    },
    player2: {
        type: String
    },
    gameBoard: {
        type: [[String]] as unknown as GameBoard,
        required: true,
        default: Array(5).fill(null).map(() => Array(5).fill(''))
    },
    history: [String],
    moveCount:{
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Room = mongoose.model('Room', schema);
export default Room;
