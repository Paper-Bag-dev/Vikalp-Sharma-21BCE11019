export function validateMove(
    move: string,
    board: [[string]],
    currentPlayer: string
): boolean {
    const [character, direction] = move.split(':');

    const isInBounds = (r: number, c: number) => r >= 0 && r < 5 && c >= 0 && c < 5;
    
    // Reverse the direction if the currentPlayer is "A"
    const adjustDirection = (dir: string) => {
        if (currentPlayer === "A") {
            const reverseMap: { [key: string]: string } = {
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

    let piecePosition: [number, number] | null = null;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            if (board[row][col] === `${currentPlayer}-${character}`) {
                piecePosition = [row, col];
                break;
            }
        }
        if (piecePosition) break;
    }

    if (!piecePosition) {
        console.error("Piece not found on the board.");
        return false;
    }

    const [row, col] = piecePosition;
    
    // Validate Pawn Move
    const validatePawnMove = () => {
        if (adjustedDirection === "F") return isInBounds(row - 1, col) && board[row - 1][col] === '';
        if (adjustedDirection === "B") return isInBounds(row + 1, col) && board[row + 1][col] === '';
        if (adjustedDirection === "L") return isInBounds(row, col - 1) && board[row][col - 1] === '';
        if (adjustedDirection === "R") return isInBounds(row, col + 1) && board[row][col + 1] === '';
        if (adjustedDirection === "FL") return isInBounds(row - 1, col - 1) && board[row - 1][col - 1] === '';
        if (adjustedDirection === "FR") return isInBounds(row - 1, col + 1) && board[row - 1][col + 1] === '';
        if (adjustedDirection === "BL") return isInBounds(row + 1, col - 1) && board[row + 1][col - 1] === '';
        if (adjustedDirection === "BR") return isInBounds(row + 1, col + 1) && board[row + 1][col + 1] === '';
        return false;
    };

    // Validate Hero1 Move
    const validateHero1Move = () => {
        const validMoves = [
            [row - 2, col], [row + 2, col], [row, col - 2], [row, col + 2],
            [row - 2, col - 2], [row - 2, col + 2], [row + 2, col - 2], [row + 2, col + 2]
        ];
        return validMoves.some(([r, c]) => 
            isInBounds(r, c) &&
            (board[r][c] === '' || board[r][c].startsWith(currentPlayer))
        );
    };

    // Validate Hero2 Move
    const validateHero2Move = () => {
        const validMoves = [
            [row - 2, col - 2], [row - 2, col + 2], [row + 2, col - 2], [row + 2, col + 2]
        ];

        return validMoves.some(([r, c]) => 
            isInBounds(r, c) &&
            (board[r][c] === '' || board[r][c].startsWith(currentPlayer))
        );
    };

    if (character.startsWith('P')) {
        return validatePawnMove();
    } else if (character.startsWith('H1')) {
        return validateHero1Move();
    } else if (character.startsWith('H2')) {
        return validateHero2Move();
    } else {
        console.error("Unknown piece type.");
        return false;
    }
}
