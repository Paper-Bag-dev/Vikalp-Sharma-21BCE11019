import Room from '../models/Room';

type GameBoard = string[][];

export async function applyMove(
    move: string,
    roomId: string,
    currentPlayer: string
): Promise<any> {
    const room = await Room.findOne({ roomId });
    if (!room) {
        console.error("Room not found.");
        return undefined;
    }

    const [character, direction] = move.split(':');
    
    let piecePosition: [number, number] | null = null;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            if (room.gameBoard[row][col] === `${currentPlayer}-${character}`) {
                piecePosition = [row, col];
                break;
            }
        }
        if (piecePosition) break;
    }
    
    if (!piecePosition) {
        console.error("Piece not found on the board.");
        return undefined;
    }
    
    const [row, col] = piecePosition;
    let newRow = row;
    let newCol = col;
    
    if (character.startsWith('P')) {
        if (direction === "F") newRow -= 1;
        if (direction === "B") newRow += 1;
        if (direction === "L") newCol -= 1;
        if (direction === "R") newCol += 1;
        if (direction === "FL") { newRow -= 1; newCol -= 1; }
        if (direction === "FR") { newRow -= 1; newCol += 1; }
        if (direction === "BL") { newRow += 1; newCol -= 1; }
        if (direction === "BR") { newRow += 1; newCol += 1; }
    } else if (character.startsWith('H1') || character.startsWith('H2')) {
        let rowStep = 0;
        let colStep = 0;
        
        if (direction === "F") { rowStep = -1; }
        if (direction === "B") { rowStep = 1; }
        if (direction === "L") { colStep = -1; }
        if (direction === "R") { colStep = 1; }
        if (direction === "FL") { rowStep = -1; colStep = -1; }
        if (direction === "FR") { rowStep = -1; colStep = 1; }
        if (direction === "BL") { rowStep = 1; colStep = -1; }
        if (direction === "BR") { rowStep = 1; colStep = 1; }

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
    } else {
        console.error("Move is out of bounds.");
        return undefined;
    }

    // Update move count
    room.moveCount += 1;

    await room.save();

    return room.gameBoard;
}