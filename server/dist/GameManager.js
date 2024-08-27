"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Room_1 = __importDefault(require("./models/Room"));
const validate_1 = require("./utils/validate");
const applyMove_1 = require("./utils/applyMove");
class GameManager {
    static addUser(socket, existingRoomID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (existingRoomID) {
                // Check if the existingRoomID corresponds to an ongoing or initiated room
                const existingRoom = yield Room_1.default.findOne({
                    roomId: existingRoomID,
                    status: { $in: ["init", "ongoing"] },
                });
                if (existingRoom) {
                    if (existingRoom.player1 === GameManager.player1 &&
                        existingRoom.player2 !== socket.id) {
                        existingRoom.updateOne({ player2: socket.id });
                        GameManager.player2 = socket.id;
                    }
                    else if (existingRoom.player2 === GameManager.player2 &&
                        existingRoom.player1 !== socket.id) {
                        existingRoom.updateOne({ player1: socket.id });
                        GameManager.player2 = socket.id;
                    }
                    socket.join(existingRoomID);
                    socket.emit("init-game", {
                        roomID: existingRoomID,
                        opponentID: existingRoom.player1 === socket.id
                            ? existingRoom.player2
                            : existingRoom.player1,
                    });
                    console.log(`User ${socket.id} rejoined room ${existingRoomID}`);
                    return;
                }
            }
            // If the user refreshing is the pendingUser, allow them to rejoin
            if (GameManager.pendingUser && GameManager.pendingUser.id === socket.id) {
                socket.emit("waiting_for_opponent");
                console.log(`Pending user ${socket.id} reconnected.`);
                return;
            }
            if (GameManager.pendingUser === null) {
                GameManager.pendingUser = socket;
                GameManager.player1 = socket.id;
                socket.emit("waiting_for_opponent");
                console.log(`User ${socket.id} is waiting for an opponent.`);
            }
            else if (GameManager.pendingUser === socket) {
                socket.emit("error", {
                    message: "You are already waiting for an opponent.",
                });
                console.log(`User ${socket.id} tried to connect again while waiting for an opponent.`);
            }
            else {
                // No existing room found or no existingRoomID provided, create a new room
                const roomName = `room-${GameManager.pendingUser.id}-${socket.id}`;
                GameManager.player2 = socket.id;
                GameManager.pendingUser.join(roomName);
                socket.join(roomName);
                // Create a schema to keep track of the room
                const room = yield Room_1.default.create({
                    status: "init",
                    roomId: roomName,
                    player1: GameManager.pendingUser.id,
                    player2: socket.id,
                    moveCount: 0,
                });
                // Notify both users that they are matched and send the room information
                GameManager.pendingUser.emit("init-game", {
                    roomID: roomName,
                    opponentID: socket.id,
                    type: "A",
                    moveCount: 0,
                });
                socket.emit("init-game", {
                    roomID: roomName,
                    opponentID: GameManager.pendingUser.id,
                    type: "B",
                    moveCount: 0,
                });
                console.log(`User ${GameManager.pendingUser.id} and ${socket.id} joined room ${roomName}`);
                // Clear the pending user
                GameManager.pendingUser = null;
            }
        });
    }
    // Method to handle removing users
    static removeUser(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const room = yield Room_1.default.findOne({
                $or: [{ player1: socket.id }, { player2: socket.id }],
            });
            if (room) {
                if (room.roomId) {
                    socket.leave(room.roomId);
                    console.log(`User ${socket.id} left room ${room.roomId}`);
                    // Optionally, you can handle room cleanup here if both users have disconnected
                }
                else {
                    console.log(`Room ID is missing or invalid for user ${socket.id}`);
                }
            }
            // If the disconnecting user was the pending user, clear the pending user
            if (GameManager.pendingUser && GameManager.pendingUser.id === socket.id) {
                GameManager.pendingUser = null;
                console.log(`Pending user ${socket.id} disconnected.`);
            }
        });
    }
    static makeMove(playerType, roomID, move) {
        return __awaiter(this, void 0, void 0, function* () {
            const room = yield Room_1.default.findOne({ roomId: roomID });
            if (!room) {
                return { success: false, error: "Room not found" };
            }
            room.status = "ongoing";
            const board = room.gameBoard;
            if ((0, validate_1.validateMove)(move, board, playerType)) {
                const newBoard = yield (0, applyMove_1.applyMove)(move, roomID, playerType);
                if (newBoard) {
                    yield Room_1.default.updateOne({ roomId: roomID }, { $set: { gameBoard: newBoard } });
                    return { success: true, newBoard, moveCount: room.moveCount };
                }
                else {
                    return { success: false, error: "Failed to apply move" };
                }
            }
            else {
                return { success: false, error: "Invalid move" };
            }
        });
    }
}
exports.GameManager = GameManager;
GameManager.pendingUser = null;
GameManager.player1 = null;
GameManager.player2 = null;
