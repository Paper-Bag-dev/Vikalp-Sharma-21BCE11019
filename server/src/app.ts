import express from "express";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import cors from "cors";  // Importing cors
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import { GameManager } from "./GameManager";
import connectDb from "./DB/db";
import { Request, Response } from 'express';

const port = 3000;
const secret = "psst";

const app = express();
const server = createServer(app);

const databaseConnection = async () => {
    await connectDb("mongodb://localhost:27017/");
};
databaseConnection();

// Configure CORS middleware
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true,
    },
});

io.use((socket: Socket, next: (err?: any) => void) => {
    const cookieHeader = socket.request.headers.cookie;
    const cookies = cookie.parse(cookieHeader || '');
    const token = cookies.token;

    if (!token) {
        return next(new Error("Auth Error"));
    }

    try {
        const decoded = jwt.verify(token, secret);
        next();
    } catch (err) {
        return next(new Error("Auth Error"));
    }
});

// Socket Server
io.on("connection", (socket: Socket) => {
    console.log("User Connected ", socket.id);

    // join_game
    socket.on("join_game", ({roomID}) => {
        GameManager.addUser(socket, roomID);
    });

    // make_move
    socket.on("make_move", async ({ playerType, roomID, move }) => {
        console.log("Move made:", move);
    
        const result = await GameManager.makeMove(playerType, roomID, move);
    
        if (result.success) {
            socket.to(roomID).emit("move_made", {
                gameBoard: result.newBoard,
                moveCount: result.moveCount,
            });
        } else {
            socket.emit("error", { message: result.error });
        }
    });
    

    // leave game
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
        GameManager.removeUser(socket);
    });
});

app.get("/", (req: Request, res: Response) => {
    const token = jwt.sign({id: "asdasdasdsgrtsrsergva"}, secret);
    res.cookie("token", token, {httpOnly: true, secure: true, sameSite: "none"})
    .json({
        message: "Login Success"
    });
});

server.listen(port, () => {
    console.log("Listening on ", port);
});
