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

    isKing() {
        return base.KingChars.has(this._char);
    }

    isStronge() {
        return base.StrongeChars.has(this._char);
    }

    // 棋子的全部活动位置(默认：车马炮的活动范围)
    getCanSeats(seats, side = '') {
        return seats.allSeats();
    }

    // 筛除被棋子阻挡的目标位置
    filterObstacleSeats(m_bSeats, seats) {
        return m_bSeats.filter(ss => seats.isBlank(ss[1])).map(s => s[0]);
    }

    // 筛除本方棋子占用的目标位置
    filterColorSeats(moveSeats, seats) {
        return moveSeats.filter(s => seats.getColor(s) != this._color);
    }

    // 获取有效活动的目标位置
    getMoveSeats(seats) {
        return [];
    }
}

class King extends Piece {
    getCanSeats(seats) {
        return seats.kingSeats()[seats.getSide(this._color)];
    }

    getMoveSeats(seats) {
        return this.filterColorSeats(
            Seats.getKingMoveSeats(seats.getSeat(this)), seats);
    }
}

class Advisor extends Piece {
    getCanSeats(seats) {
        return seats.advisorSeats()[seats.getSide(this._color)];
    }

    getMoveSeats(seats) {
        return this.filterColorSeats(
            Seats.getAdvisorMoveSeats(seats.getSeat(this)), seats);
    }
}

class Bishop extends Piece {
    getCanSeats(seats) {
        return seats.bishopSeats()[seats.getSide(this._color)];
    }

    getMoveSeats(seats) {
        return this.filterColorSeats(this.filterObstacleSeats(
            Seats.getBishopMove_CenSeats(seats.getSeat(this)), seats), seats);
    }
}

class Knight extends Piece {
    getMoveSeats(seats) {
        return this.filterColorSeats(this.filterObstacleSeats(
            Seats.getKnightMove_LegSeats(seats.getSeat(this)), seats), seats);
    }
}

class Rook extends Piece {
    getMoveSeats(seats) {
        let moveSeats = new Array();
        let seatLines = Seats.RookCannonMoveSeat_Lines(seats.getSeat(this));
        for (const seatLine of seatLines) {
            for (const seat of seatLine) {
                if (seats.isBlank(seat)) {
                    moveSeats.push(seat);
                }
                else {
                    if (seats.getColor(seat) != this._color) {
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
    getMoveSeats(seats) {
        let moveSeats = new Array();
        let seatLines = Seats.RookCannonMoveSeat_Lines(seats.getSeat(this));
        for (const seatLine of seatLines) {
            let skip = false;
            for (const seat of seatLine) {
                if (!skip) {
                    if (seats.isBlank(seat)) {
                        moveSeats.push(seat);
                    }
                    else {
                        skip = true;
                    }
                }
                else if (!seats.isBlank(seat)) {
                    if (seats.getColor(seat) != this._color) {
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
    getCanSeats(seats) {
        return seats.pawnSeats()[seats.getSide(this._color)];
    }

    getMoveSeats(seats) {
        return this.filterColorSeats(seats.getPawnMoveSeats(seats.getSeat(this)));
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
        return this.pies[color == base.RED ? 0 : 16];
    }

    getOthSidePiece(piece) {
        return this.pies[(this.pies.indexOf(piece) + 16) % 32];
    }

    seatPieces(seatChars) {
        let result = [];
        let chars = this.pieceChars.slice(0);
        for (let [seat, char] of seatChars) { // seatChars 由多个[seat, char]组成
            if (char == '_')
                continue;
            for (let i = 0; i < chars.length; i++) {
                if (char == chars[i]) {
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

