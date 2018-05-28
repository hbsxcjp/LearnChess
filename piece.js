// 中国象棋棋子类型 by-cjp

//export {Piece, Pieces};
    
const { BLACK, RED, CharNames, TypeChars } = constValue();
function constValue() {
    const BLACK = 'black';
    const RED = 'red';
    const CharNames = {
        'K': '帅', 'A': '仕', 'B': '相', 'N': '马',
        'R': '车', 'C': '炮', 'P': '兵',
        'k': '将', 'a': '士', 'b': '象', 'n': '马',
        'r': '车', 'c': '炮', 'p': '卒', '_': ''
    };
    // 全部棋子ch值与中文名称映射字典
    const TypeChars = {
        'Pawn': 'pP',
        'AdvisorBishop': 'abAB',
        'Stronge': 'rncpRNCP',
        'LineMove': 'krcpKRCP'
    };
    return { BLACK, RED, CharNames, TypeChars };
}

    
class Piece {
    constructor(char) {
        this._color = char >= 'a' ? BLACK : RED;
        this._char = char;
    }

    get color() {
        return this._color;
    }

    get char() {
        return this._char;
    }

    get name() {
        return CharNames[this._char];
    }
    
    isOf(type) {        
        return TypeChars[type].indexOf(this._char) >= 0;
    }

    // 棋子的全部活动位置(默认：车马炮的活动范围)
    getCanSeats(board, side='') {
        return board.allSeats;
    }

    // 筛除被棋子阻挡的目标位置
    filterObstacleSeats(m_bSeats, board) {
        return m_bSeats.filter(ss => board.isBlank(ss[1])).map(s => s[0]);
    }
    
    // 筛除超出可置入位置、本方棋子占用位置
    filterSeats(moveSeats, board) {
        let seats = new Set(this.getCanSeats(board));
        return moveSeats.filter(
            s => seats.has(s)).filter(
                s => board.getColor(s) != this._color);
    }

    // 获取有效活动位置
    getMoveSeats(board) {
        return [];
    }
}

class King extends Piece {
    getCanSeats(board) {
        return board.kingSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterSeats(
            Board.getKingMoveSeats(
                board.getSeat(this)), board);
    }
}

class Advisor extends Piece {
    getCanSeats(board) {
        return board.advisorSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterSeats(
            Board.getAdvisorMoveSeats(
                board.getSeat(this)), board);
    }
}

class Bishop extends Piece {
    getCanSeats(board) {
        return board.bishopSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterSeats(
            this.filterObstacleSeats(
                Board.getBishopMove_CenSeats(
                    board.getSeat(this)), board), board);
    }
}

class Knight extends Piece {
    getMoveSeats(board) {
        return this.filterSeats(
            this.filterObstacleSeats(
                Board.getKnightMove_LegSeats(
                    board.getSeat(this)), board), board);
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
        let seatLines = Board.RookCannonMoveSeat_Lines(board.getSeat(this));
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
        return board.pawnSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        let moveSeats = new Array();
        let seat = board.getSeat(this);
        let row = Board.getRow(seat);
        let isBottomSide = board.isBottomSide(this._color);
        for (let s of this.filterSeats(Board.getPawnMoveSeats(board.getSeat(this)))) {
            r = Board.getRow(s);
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
        const PieceChars = ['K', 'A', 'A', 'B', 'B', 'N', 'N', 'R', 'R',
            'C', 'C', 'P', 'P', 'P', 'P', 'P',
            'k', 'a', 'a', 'b', 'b', 'n', 'n', 'r', 'r',
            'c', 'c', 'p', 'p', 'p', 'p', 'p'];
    
        const PieceTypes = {
                'k': King, 'a': Advisor, 'b': Bishop,
                'n': Knight, 'r': Rook, 'c': Cannon, 'p': Pawn
        };        
        this.pies = PieceChars.map(
            c => {return new PieceTypes[c.toLowerCase()](c);});
    }
}


pieces = new Pieces();
console.log(pieces);
