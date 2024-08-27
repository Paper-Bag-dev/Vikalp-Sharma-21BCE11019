"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const schema = new mongoose_1.default.Schema({
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
        type: [[String]],
        required: true,
        default: Array(5).fill(null).map(() => Array(5).fill(''))
    },
    history: [String],
    moveCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
const Room = mongoose_1.default.model('Room', schema);
exports.default = Room;
