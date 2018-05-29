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
        return m_bBoard.filter(ss => board.isBlank(ss[1])).map(s => s[0]);
    }

    // 筛除本方棋子占用的目标位置
    filterColorSeats(moveSeats, board) {
        return moveBoard.filter(s => board.getColor(s) != this._color);
    }

    // 获取有效活动的目标位置
    getMoveSeats(board) {
        return [];
    }
}

class King extends Piece {
    getCanSeats(board) {
        return board.kingSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterColorSeats(
            Board.getKingMoveSeats(board.getSeat(this)), board);
    }
}

class Advisor extends Piece {
    getCanSeats(board) {
        return board.advisorSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterColorSeats(
            Board.getAdvisorMoveSeats(board.getSeat(this)), board);
    }
}

class Bishop extends Piece {
    getCanSeats(board) {
        return board.bishopSeats[board.getSide(this._color)];
    }

    getMoveSeats(board) {
        return this.filterColorSeats(this.filterObstacleSeats(
                Board.getBishopMove_CenSeats(board.getSeat(this)), board), board);
    }
}

class Knight extends Piece {
    getMoveSeats(board) {
        return this.filterColorSeats(this.filterObstacleSeats(
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
        return this.filterColorSeats(board.getPawnMoveSeats(board.getSeat(this)));
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
        return this.pies[color == RED? 0: 16];
    }

    getOthSidePiece(piece) {
        return this.pies[(this.pies.indexOf(piece) + 16) % 32];
    }

    seatPieces(seatChars) {
        let result = new Array(seatChars.length);
        let chars = this.pieceChars.slice(0);
        for (let [seat, char] of seatChars) { // seatChars 由多个[seat, char]组成
            if (char == '_') 
                continue;
            for (let i=0; i<chars.length; i++) {
                if (char == chars[i]) {
                    result[seat] = this.pies[i];
                    chars[i] = '';
                    break;
                }
            }
        }
        return result;
    }    
}


//'象棋着法树节点类'
class Move {          
    constructor(prev=null) {
        this.prev = prev;
        this.fseat = 0;
        this.tseat = 0;
        this.remark = '';
        
        this.next_ = null;
        this.other = null;
        this.stepno = 0; // 着法深度
        this.othcol = 0; // 变着广度
        
        this.maxcol = 0; // 图中列位置（需结合board确定）
        this.zhstr = prev? '': '1.开始'; // 中文描述（需结合board确定）
    }

    toString() {
        let stepno = this.stepno,
            othcol = this.othcol,
            maxcol = this.maxcol,
            fseat = this.fseat,
            tseat = this.tseat,
            zhstr = this.zhstr;
        return `${stepno}_${othcol}(${maxcol}) [${fseat} ${tseat}] ${zhstr}`;
    }

    ICCSzhstr(fmt) {
        if (fmt == 'ICCS') {
            if (this.stepno == 0) {
                return '';
            }
            else {
                let c0 = colchars[Board.getcol(this.fseat)],
                    r0 = Board.getrow(this.fseat),
                    c1 = colchars[Board.getcol(this.tseat)],
                    r1 = Board.getrow(this.tseat);
                return `${c0}${r0}${c1}${r1}`;
            }
        }
        else {
            return this.zhstr;
        }
    }

    setSeat_ICCS(ICCSstr){
        let [fcol, frow, tcol, trow] = [...ICCSstr]; // ...展开运算符
        this.fseat = Board.getSeat(Number(frow), colchars[fcol]);
        this.tseat = Board.getSeat(Number(trow), colchars[tcol]);
    }

    setNext(next_){
        next_.stepno = this.stepno + 1;
        next_.othcol = this.othcol; // 变着层数
        this.next_ = next_;
    }

    setOther(other){
        other.stepno = this.stepno; // 与premove的步数相同
        other.othcol = this.othcol + 1; // 变着层数
        this.other = other;
    }                       
}


pieces = new Pieces();
move = new Move();
console.log(pieces);
console.log(move);

