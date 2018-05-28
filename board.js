// 中国象棋棋盘布局类型 by-cjp

//import {Piece, Pieces} from './piece.js';

const { BOTTOM, TOP,
        NumRows, NumCols, MaxColNo, MinColNo,
        NumToChinese, ChineseToNum, FEN } = constValue();

class Board {
    static getRow(seat) {
        return Math.floor(seat / NumCols);
    }
    
    static getCol(seat) {
        return seat % NumCols;
    }
    
    static getSeat(row, col) {
        return row * NumCols + col;
    }

    static rotateSeat(seat) {
        return 89 - seat;
    }
    
    static symmetrySeat(seat) {
        return (this.getRow(seat) + 1) * NumCols - seat % NumCols - 1;
    }
    
    static isSameCol(seat, othseat) {
        return this.getCol(seat) == this.getCol(othseat);
    }
    
    static getSameColSeats(seat, othseat) {
        let seats = new Array();
        let step = seat < othseat ? NumCols : -NumCols;

        function compare (i, j) {
            return step > 0 ? i < j : i > j;
        }; // 定义比较函数
        for (let i = seat + step; compare(i, othseat); i += step) {
            seats.push(i);
        }
        return seats;
    }
    
    static getKingMoveSeats(seat) {
        return [seat + 1, seat - 1, seat + NumCols, seat - NumCols];
    }
    
    static getAdvisorMoveSeats(seat) {
        return [seat + NumCols + 1, seat + NumCols - 1,
                seat - NumCols + 1, seat - NumCols - 1];
    }

    // 获取移动、象心行列值
    static getBishopMove_CenSeats(seat) {
        let row = this.getRow(seat);
        let col = this.getCol(seat);
        let mvseats;
        if (col == MaxColNo) {
            mvseats = [seat + 2 * NumCols - 2, seat - 2 * NumCols - 2];
        }
        else if (col == MinColNo) {
            mvseats = [seat + 2 * NumCols + 2, seat - 2 * NumCols + 2];
        }
        else if (row == 0 || row == 5) {
            mvseats = [seat + 2 * NumCols + 2, seat + 2 * NumCols - 2]
        }
        else if (row == 4 || row == 9) {
            mvseats = [seat - 2 * NumCols + 2, seat - 2 * NumCols - 2]
        }
        else {
            mvseats = [seat + 2 * NumCols + 2, seat - 2 * NumCols + 2, 
                    seat + 2 * NumCols - 2, seat - 2 * NumCols - 2];
        }
        return mvseats.map(s => [s, (seat + s) / 2]);
    }

    // 获取移动、马腿行列值
    static getKnightMove_LegSeats(seat) {
        function _leg(first, to) {
            let x = to - first;
            if (x > NumCols + 2) {
                return first + NumCols;
            }
            else if (x < -NumCols - 2) {
                return first - NumCols;
            }
            else if (x == NumCols + 2 || x == -NumCols + 2) {
                return first + 1;
            }
            else {
                return first - 1;
            }
        }

        let EN = seat + NumCols + 2, 
            ES = seat - NumCols + 2,
            SE = seat - 2 * NumCols + 1,
            SW = seat - 2 * NumCols - 1,
            WS = seat - NumCols - 2,
            WN = seat + NumCols - 2,
            NW = seat + 2 * NumCols - 1, 
            NE = seat + 2 * NumCols + 1;
        let mvseats, seats;
        switch(this.getCol(seat)) {
            case MaxColNo: 
                mvseats = [SW, WS, WN, NW];
                break;
            case MaxColNo - 1:
                mvseats = [SE, SW, WS, WN, NW, NE];
                break;
            case MinColNo:
                mvseats = [EN, ES, SE, NE];
                break;
            case MinColNo + 1:
                mvseats = [EN, ES, SE, SW, NW, NE];
                break;
            default:
                mvseats = [EN, ES, SE, SW, WS, WN, NW, NE];
        }
        switch (this.getRow(seat)) {
            case 9:
                seats = new Set([ES, SE, SW, WS]);
                break;
            case 8:
                seats = new Set([EN, ES, SE, SW, WS, WN]);
                break;
            case 0:
                seats = new Set([EN, WN, NW, NE]);
                break;
            case 1:
                seats = new Set([EN, ES, WS, WN, NW, NE]);
                break;
            default:
                seats = new Set([EN, ES, SE, SW, WS, WN, NW, NE]);
        }
        return mvseats.filter(s => seats.has(s)).map(s => [s, _leg(seat, s)]);
    }

    // 车炮可走的四个方向位置
    static getRookCannonMoveSeat_Lines(seat) {
        let seat_lines = [[], [], [], []];
        let row = this.getRow(seat); //this指类，而不是实例
        let leftlimit = row * NumCols - 1;
        let rightlimit = (row + 1) * NumCols;
        for (let i = seat - 1; i > leftlimit; i--) {
            seat_lines[0].push(i);
        }
        for (let i = seat + 1; i < rightlimit; i++) {
            seat_lines[1].push(i);
        }
        for (let i = seat - NumCols; i > -1; i -= NumCols) {
            seat_lines[2].push(i);
        }
        for (let i = seat + NumCols; i < 90; i += NumCols) {
            seat_lines[3].push(i);
        }
        return seat_lines;
    }

    static getPawnMoveSeats(seat) {
        mvseats = [seat + 1, seat + NumCols, seat - NumCols, seat - 1];
        let col = this.getCol(seat); //this指类，而不是实例
        if (col == MaxColNo) {
            return mvseats.slice(1);
        }
        else if (col == MinColNo) {
            return mvseats.slice(0, 3);
        }
    }

    constructor() {
        this.seats = new Array(90);

    }

    getSide(color) {
        return BOTTOM; // 待完善！
    }

    getPiece(seat) {
        return this.seats[seat];
    }
    
    getColor(seat) {
        return this.seats[seat].color;
    }

    getSeat(piece) {
        return this.seats.indexof(piece);
    }

    isBlank(seat) {
        return boolean(this.seats[seat]);
    }


    //

}

// 单例对象
board = new Board();

// 设置静态属性（目前，不能在类定义内直接设置）
Object.defineProperties(board, {
    allSeats: {
        value: range(0, 90),
        writable: false, 
        enumerable: true,
        configurable: false
    },
    
    kingSeats: {
        value: {
            BOTTOM: [21, 22, 23, 12, 13, 14, 3, 4, 5],
            TOP: [84, 85, 86, 75, 76, 77, 66, 67, 68]
        },
        writable: false, 
        enumerable: true,
        configurable: false
    },

    advisorSeats: {
        value: {
            BOTTOM: [21, 23, 13, 3, 5],
            TOP: [84, 86, 76, 66, 68]
        },
        writable: false, 
        enumerable: true,
        configurable: false
    },
    
    bishopSeats: {
        value: {
            BOTTOM: [2, 6, 18, 22, 26, 38, 42],
            TOP: [47, 51, 63, 67, 71, 83, 87]
        },
        writable: false, 
        enumerable: true,
        configurable: false
    },
    
    pawnSeats: {
        value: {
            TOP: range(0, 45).concat([45, 47, 49, 51, 53, 54, 56, 58, 60, 62]),
            BOTTOM: range(45, 90).concat([27, 29, 31, 33, 35, 36, 38, 40, 42, 44])
        },
        writable: false, 
        enumerable: true,
        configurable: false
    }
});

function constValue() {
    const BOTTOM = 'bottom';
    const TOP = 'top';
    const NumCols = 9;
    const NumRows = 10;
    const MinColNo = 0;
    const MaxColNo = 8;
    // 初始布局
    const NumToChinese = {
        RED_P: {
        1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
            6: '六', 7: '七', 8: '八', 9: '九'
        },
        BLACK_P: {
        1: '１', 2: '２', 3: '３', 4: '４', 5: '５',
            6: '６', 7: '７', 8: '８', 9: '９'
        }
    };
    const ChineseToNum = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9,
        '１': 1, '２': 2, '３': 3, '４': 4, '５': 5,
        '６': 6, '７': 7, '８': 8, '９': 9,
        '前': 0, '中': 1, '后': -1,
        '进': 1, '退': -1, '平': 0
    };
    const FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1';
    return { BOTTOM, TOP,
            NumCols, NumRows, MaxColNo, MinColNo,
            NumToChinese, ChineseToNum, FEN };
}

// 取得数字序列数组
function range(from, end) {
    let array = new Array();
    for (let i = from; i < end; i++) {
        array.push(i);
    }
    return array;
}
        

console.log(board);
