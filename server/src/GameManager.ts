import { Socket } from "socket.io";
import Room from "./models/Room";
import { validateMove } from "./utils/validate";
import { applyMove } from "./utils/applyMove";

export class GameManager {
  private static pendingUser: Socket | null = null;
  private static player1: String | null = null;
  private static player2: String | null = null;

  public static async addUser(
    socket: Socket,
    existingRoomID: string | undefined
  ) {
    if (existingRoomID) {
      // Check if the existingRoomID corresponds to an ongoing or initiated room

      const existingRoom = await Room.findOne({
        roomId: existingRoomID,
        status: { $in: ["init", "ongoing"] },
      });

      if (existingRoom) {
        if (
          existingRoom.player1 === GameManager.player1 &&
          existingRoom.player2 !== socket.id
        ) {
          existingRoom.updateOne({ player2: socket.id });
          GameManager.player2 = socket.id;
        } else if (
          existingRoom.player2 === GameManager.player2 &&
          existingRoom.player1 !== socket.id
        ) {
          existingRoom.updateOne({ player1: socket.id });
          GameManager.player2 = socket.id;
        }
        socket.join(existingRoomID);
        socket.emit("init-game", {
          roomID: existingRoomID,
          opponentID:
            existingRoom.player1 === socket.id
              ? existingRoom.player2
              : existingRoom.player1,
          gameBoard: existingRoom.gameBoard,
          moveCount: existingRoom.moveCount,
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
    } else if (GameManager.pendingUser === socket) {
      socket.emit("error", {
        message: "You are already waiting for an opponent.",
      });
      console.log(
        `User ${socket.id} tried to connect again while waiting for an opponent.`
      );
    } else {
      // No existing room found or no existingRoomID provided, create a new room
      const roomName = `room-${GameManager.pendingUser.id}-${socket.id}`;
      GameManager.player2 = socket.id;

      GameManager.pendingUser.join(roomName);
      socket.join(roomName);

      // Updating
      const defaultBoard = [
        ["A-P1", "A-P2", "A-H1", "A-H2", "A-P3"],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["B-P1", "B-P2", "B-H1", "B-H2", "B-P3"],
      ];

      // Create a schema to keep track of the room
      const room = await Room.create({
        status: "init",
        roomId: roomName,
        player1: GameManager.pendingUser.id,
        player2: socket.id,
        gameBoard: defaultBoard,
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

      console.log(
        `User ${GameManager.pendingUser.id} and ${socket.id} joined room ${roomName}`
      );

      // Clear the pending user
      GameManager.pendingUser = null;
    }
  }

  // Method to handle removing users
  public static async removeUser(socket: Socket) {
    const room = await Room.findOne({
      $or: [{ player1: socket.id }, { player2: socket.id }],
    });

    if (room) {
      if (room.roomId) {
        socket.leave(room.roomId);
        console.log(`User ${socket.id} left room ${room.roomId}`);
        // Optionally, you can handle room cleanup here if both users have disconnected
      } else {
        console.log(`Room ID is missing or invalid for user ${socket.id}`);
      }
    }

    // If the disconnecting user was the pending user, clear the pending user
    if (GameManager.pendingUser && GameManager.pendingUser.id === socket.id) {
      GameManager.pendingUser = null;
      console.log(`Pending user ${socket.id} disconnected.`);
    }
  }

  public static async makeMove(
    playerType: string,
    roomID: string,
    move: string
  ) {
    const room = await Room.findOne({ roomId: roomID });

    if (!room) {
      return { success: false, error: "Room not found" };
    }

    room.status = "ongoing";

    const board: any = room.gameBoard;
    if (validateMove(move, board, playerType)) {
      const newBoard = await applyMove(move, roomID, playerType);

      if (newBoard) {
        await Room.updateOne(
          { roomId: roomID },
          { $set: { gameBoard: newBoard, moveCount: room.moveCount + 1 } }
        );
        return { success: true, newBoard, moveCount: room.moveCount + 1 };
      } else {
        return { success: false, message: "Failed to apply move" };
      }
    } else {
      return { success: false, message: "invalid Move" };
    }
  }
}
