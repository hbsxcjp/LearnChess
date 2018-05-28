// 中国象棋棋子类型 by-cjp

//export {Piece, Pieces};
    
const { BLACK_P, RED_P, PieceChars, 
    PieceNames, TypeNames } = constValue();

function constValue() {
    const BLACK_P = 'black';
    const RED_P = 'red';
    const PieceChars = ['K', 'A', 'A', 'B', 'B', 'N', 'N', 'R', 'R',
            'C', 'C', 'P', 'P', 'P', 'P', 'P',
            'k', 'a', 'a', 'b', 'b', 'n', 'n', 'r', 'r',
            'c', 'c', 'p', 'p', 'p', 'p', 'p'];
    const PieceNames = {
        'K': '帅', 'A': '仕', 'B': '相', 'N': '马',
        'R': '车', 'C': '炮', 'P': '兵',
        'k': '将', 'a': '士', 'b': '象', 'n': '马',
        'r': '车', 'c': '炮', 'p': '卒', '_': ''
    };
    // 全部棋子ch值与中文名称映射字典
    const TypeNames = {
        'Pawn': 'pP',
        'AdvisorBishop': 'abAB',
        'Stronge': 'rncpRNCP',
        'LineMove': 'krcpKRCP'
    };
    return { BLACK_P, RED_P, PieceChars,
        PieceNames, TypeNames };
}

    
class Piece {
    constructor(char) {
        this._color = char >= 'a' ? BLACK_P : RED_P;
        this._char = char;
    }

    get color() {
        return this._color;
    }

    get char() {
        return this._char;
    }

    get name() {
        return PieceNames[this._char];
    }
    
    isOf(type) {        
        return TypeNames[type].indexOf(this._char) >= 0;
    }

    // 棋子的全部活动位置(默认：车马炮的活动范围)
    getFullSeats(board, side='') {
        return board.allSeats;
    }

    // 筛除超出可置入位置、本方棋子占用位置
    filterSeats(moveSeats, board) {
        let seats = new Set(this.getFullSeats(board));
        moveSeats = moveSeats.filter(s => seats.has(s));
        return moveSeats.filter(s => {board.getColor(s) != this._color});
    }

    // 筛除被棋子阻挡的目标位置
    static filterObstacleSeats(m_bSeats, board) {
        m_bSeats = m_bSeats.filter(ss => board.isBlank(ss[1]));
        return m_bSeats.map(s => {return s[0]});
    }    
    
    // 获取有效活动位置
    getMoveSeats(board) {
        return [];
    }
}

class King extends Piece {
    getFullSeats(board) {
        return board.kingSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterSeats(
            board.getKingMoveSeats(
                board.getSeat(this)), board);
    }
}

class Advisor extends Piece {
    getFullSeats(board) {
        return board.advisorSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterSeats(
            board.getAdvisorMoveSeats(
                board.getSeat(this)), board);
    }
}

class Bishop extends Piece {
    getFullSeats(board) {
        return board.bishopSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterSeats(
            this.filterObstacleSeats(
                board.getBishopMove_CenSeats(
                    board.getSeat(this)), board), board);
    }
}

class Knight extends Piece {
    getMoveSeats(board) {
        return this.filterSeats(
            this.filterObstacleSeats(
                board.getKnightMove_LegSeats(
                    board.getSeat(this)), board), board);
    }
}

class Rook extends Piece {
    getMoveSeats(board) {
        let moveSeats = new Array();
        let seatLines = board.RookCannonMoveSeat_Lines(board.getSeat(this));
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
        let seatLines = board.RookCannonMoveSeat_Lines(board.getSeat(this));
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
    getFullSeats(board) {
        return board.pawnSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        let moveSeats = new Array();
        let seat = board.getSeat(this);
        let row = board.getRow(seat);
        let isBottomSide = board.isBottomSide(this._color);
        for (let s of this.filterSeats(board.getPawnMoveSeats(board.getSeat(this)))) {
            r = board.getRow(s);
            if ((isBottomSide && r >= row) || (!isBottomSide && r <= row)) {
                moveSeats.push(s);
            }
        }
        return moveSeats;
    }
}
 
// 一副棋子类
class Pieces {
    constructor() {
        const PieceTypes = {
                'k': King, 'a': Advisor, 'b': Bishop,
                'n': Knight, 'r': Rook, 'c': Cannon, 'p': Pawn
        };        
        this.elems = PieceChars.map(
            c => {return new PieceTypes[c.toLowerCase()](c);});
    }
}


pieces = new Pieces();
console.log(pieces);
