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
exports.applyMove = void 0;
const Room_1 = __importDefault(require("../models/Room"));
function applyMove(move, roomId, currentPlayer) {
    return __awaiter(this, void 0, void 0, function* () {
        const room = yield Room_1.default.findOne({ roomId });
        if (!room) {
            console.error("Room not found.");
            return undefined;
        }
        const [character, direction] = move.split(':');
        // Reverse the direction if the currentPlayer is "A"
        const adjustDirection = (dir) => {
            if (currentPlayer === "A") {
                const reverseMap = {
                    "F": "B", "B": "F",
                    "L": "R", "R": "L",
                    "FL": "BR", "FR": "BL",
                    "BL": "FR", "BR": "FL"
                };
                return reverseMap[dir] || dir;
            }
            return dir;
        };
        const adjustedDirection = adjustDirection(direction);
        let piecePosition = null;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (room.gameBoard[row][col] === `${currentPlayer}-${character}`) {
                    piecePosition = [row, col];
                    break;
                }
            }
            if (piecePosition)
                break;
        }
        if (!piecePosition) {
            console.error("Piece not found on the board.");
            return undefined;
        }
        const [row, col] = piecePosition;
        let newRow = row;
        let newCol = col;
        if (character.startsWith('P')) {
            if (adjustedDirection === "F")
                newRow -= 1;
            if (adjustedDirection === "B")
                newRow += 1;
            if (adjustedDirection === "L")
                newCol -= 1;
            if (adjustedDirection === "R")
                newCol += 1;
            if (adjustedDirection === "FL") {
                newRow -= 1;
                newCol -= 1;
            }
            if (adjustedDirection === "FR") {
                newRow -= 1;
                newCol += 1;
            }
            if (adjustedDirection === "BL") {
                newRow += 1;
                newCol -= 1;
            }
            if (adjustedDirection === "BR") {
                newRow += 1;
                newCol += 1;
            }
        }
        else if (character.startsWith('H1') || character.startsWith('H2')) {
            let rowStep = 0;
            let colStep = 0;
            if (adjustedDirection === "F") {
                rowStep = -1;
            }
            if (adjustedDirection === "B") {
                rowStep = 1;
            }
            if (adjustedDirection === "L") {
                colStep = -1;
            }
            if (adjustedDirection === "R") {
                colStep = 1;
            }
            if (adjustedDirection === "FL") {
                rowStep = -1;
                colStep = -1;
            }
            if (adjustedDirection === "FR") {
                rowStep = -1;
                colStep = 1;
            }
            if (adjustedDirection === "BL") {
                rowStep = 1;
                colStep = -1;
            }
            if (adjustedDirection === "BR") {
                rowStep = 1;
                colStep = 1;
            }
            // Clear pieces in the way
            for (let i = 1; i <= 2; i++) {
                let clearRow = row + rowStep * i;
                let clearCol = col + colStep * i;
                if (clearRow >= 0 && clearRow < 5 && clearCol >= 0 && clearCol < 5) {
                    room.gameBoard[clearRow][clearCol] = '';
                }
            }
            newRow = row + rowStep * 2;
            newCol = col + colStep * 2;
        }
        if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
            room.gameBoard[row][col] = '';
            room.gameBoard[newRow][newCol] = `${currentPlayer}-${character}`;
        }
        else {
            console.error("Move is out of bounds.");
            return undefined;
        }
        // Update move count
        room.moveCount += 1;
        yield room.save();
        return room.gameBoard;
    });
}
exports.applyMove = applyMove;
