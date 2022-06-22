// 中国象棋棋子类型 by-cjp

import * as base from './base.js';
export { Pieces };

//console.log('piece.js!');

class Piece {
    constructor(char) {
        this._color = char >= 'a' ? base.BLACK : base.RED;
        this._char = char;
    }

    get color() {
        return this._color;
    }

    get char() {
        return this._char;
    }

    get name() {
        return base.CharNames[this._char];
    }

    get isKing() {
        return base.KingNames.has(this.name);
    }

    get isStronge() {
        return base.StrongeNames.has(this.name);
    }

    // 棋子的全部活动位置(默认：车马炮的活动范围)
    getCanSeats() {
        return Board.allSeats();
    }

    // 筛除本方棋子占用的目标位置
    filterColorSeats(moveSeats, board) {
        return moveSeats.filter(s => board.getColor(s) != this._color);
    }

}

class King extends Piece {
    getCanSeats(board) {
        return Board.kingSeats()[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterColorSeats(
            Board.getKingMoveSeats(board.getSeat(this)), board);
    }
}

class Advisor extends Piece {
    getCanSeats(board) {
        return Board.advisorSeats()[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterColorSeats(
            Board.getAdvisorMoveSeats(board.getSeat(this)), board);
    }
}

class Bishop extends Piece {
    // 筛除被棋子阻挡的目标位置
    static filterObstacleSeats(m_bSeats, board) {
        return m_bSeats.filter(s => board.isBlank(s[1])).map(s => s[0]);
    }

    getCanSeats(board) {
        return Board.bishopSeats()[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterColorSeats(Bishop.filterObstacleSeats(
            Board.getBishopMove_CenSeats(board.getSeat(this)), board), board);
    }
}

class Knight extends Piece {
    getMoveSeats(board) {
        return this.filterColorSeats(Bishop.filterObstacleSeats(
            Board.getKnightMove_LegSeats(board.getSeat(this)), board), board);
    }
}

class Rook extends Piece {
    getMoveSeats(board) {
        let moveSeats = new Array();
        let seatLines = Board.RookCannonMoveSeat_Lines(board.getSeat(this));
        for (const seatLine of seatLines) {
            for (const seat of seatLine) {
                if (board.isBlank(seat)) {
                    moveSeats.push(seat);
                }
                else {
                    if (board.getColor(seat) != this._color) {
                        moveSeats.push(seat);
                    }
                    break;
                }
            }
        }
        return moveSeats;
    }
}

class Cannon extends Piece {
    getMoveSeats(board) {
        let moveSeats = new Array();
        let seatLines = Board.getRookCannonMoveSeat_Lines(board.getSeat(this));
        for (const seatLine of seatLines) {
            let skip = false;
            for (const seat of seatLine) {
                if (!skip) {
                    if (board.isBlank(seat)) {
                        moveSeats.push(seat);
                    }
                    else {
                        skip = true;
                    }
                }
                else if (!board.isBlank(seat)) {
                    if (board.getColor(seat) != this._color) {
                        moveSeats.push(seat);
                    }
                    break;
                }
            }
        }
        return moveSeats;
    }
}

class Pawn extends Piece {
    getCanSeats(board) {
        return Board.pawnSeats()[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterColorSeats(Board.getPawnMoveSeats(board.getSeat(this)));
    }
}

// 一副棋子类
class Pieces {
    constructor() {
        const pieceTypes = {
            'k': King, 'a': Advisor, 'b': Bishop,
            'n': Knight, 'r': Rook, 'c': Cannon, 'p': Pawn
        };

        this.pieceChars = ['K', 'A', 'A', 'B', 'B', 'N', 'N', 'R', 'R',
            'C', 'C', 'P', 'P', 'P', 'P', 'P',
            'k', 'a', 'a', 'b', 'b', 'n', 'n', 'r', 'r',
            'c', 'c', 'p', 'p', 'p', 'p', 'p'];
        this.pies = this.pieceChars.map(c => new pieceTypes[c.toLowerCase()](c));
    }

    toString() {
        return this.pies.map(p => p.name).toString();
    }

    getKing(color) {
        return this.pies[color === base.RED ? 0 : 16];
    }

    getOthSidePiece(piece) {
        return this.pies[(this.pies.indexOf(piece) + 16) % 32];
    }

    seatPieces(seatChars) {
        let result = [];
        let chars = this.pieceChars.slice(0);
        for (let [seat, char] of seatChars) { // seatChars 由多个[seat, char]组成
            if (char === '_')
                continue;
            for (let i = 0; i < chars.length; i++) {
                if (char === chars[i]) {
                    result.push([seat, this.pies[i]]);
                    chars[i] = '';
                    break;
                }
            }
        }
        return result;
    }
}


//let pieces = new Pieces();
//console.log(pieces, pieces.toString());

