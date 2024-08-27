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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = __importDefault(require("cookie"));
const cors_1 = __importDefault(require("cors")); // Importing cors
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const GameManager_1 = require("./GameManager");
const db_1 = __importDefault(require("./DB/db"));
const port = 3000;
const secret = "psst";
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const databaseConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.default)("mongodb://localhost:27017/");
});
databaseConnection();
// Configure CORS middleware
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173"],
    credentials: true
}));
const io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true,
    },
});
io.use((socket, next) => {
    const cookieHeader = socket.request.headers.cookie;
    const cookies = cookie_1.default.parse(cookieHeader || '');
    const token = cookies.token;
    if (!token) {
        return next(new Error("Auth Error"));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        next();
    }
    catch (err) {
        return next(new Error("Auth Error"));
    }
});
// Socket Server
io.on("connection", (socket) => {
    console.log("User Connected ", socket.id);
    // join_game
    socket.on("join_game", ({ roomID }) => {
        GameManager_1.GameManager.addUser(socket, roomID);
    });
    // make_move
    socket.on("make_move", (_a) => __awaiter(void 0, [_a], void 0, function* ({ playerType, roomID, move }) {
        console.log("Move made:", move);
        const result = yield GameManager_1.GameManager.makeMove(playerType, roomID, move);
        if (result.success) {
            socket.to(roomID).emit("move_made", {
                gameBoard: result.newBoard,
                moveCount: result.moveCount,
            });
        }
        else {
            socket.emit("error", { message: result.error });
        }
    }));
    // leave game
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
        GameManager_1.GameManager.removeUser(socket);
    });
});
app.get("/", (req, res) => {
    const token = jsonwebtoken_1.default.sign({ id: "asdasdasdsgrtsrsergva" }, secret);
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" })
        .json({
        message: "Login Success"
    });
});
server.listen(port, () => {
    console.log("Listening on ", port);
});
