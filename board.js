// 中国象棋棋盘布局类型 by-cjp

import {blankBoard, View, multRepl, xmlIndent} from './base.js';
import {BLACK, RED, Pieces} from './piece.js';

const { BOTTOM, TOP, 
        NumRows, NumCols, MaxColNo, MinColNo,
        NumToChinese, ChineseToNum, FEN } = constValue();

//'象棋着法树节点类'
class Move {          
    constructor(prev=null){
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

    toString(){
        let stepno = this.stepno,
            othcol = this.othcol,
            maxcol = this.maxcol,
            fseat = this.fseat,
            tseat = this.tseat,
            zhstr = this.zhstr;
        return `${stepno}_${othcol}(${maxcol}) [${fseat} ${tseat}] ${zhstr}`;
    }

    ICCSzhstr(fmt){
        if (fmt == 'ICCS'){
            if (this.stepno == 0){
                return '';
            }
            else {
                let c0 = ColChars[Board.getCol(this.fseat)],
                    r0 = Board.getRow(this.fseat),
                    c1 = ColChars[Board.getCol(this.tseat)],
                    r1 = Board.getRow(this.tseat);
                return `${c0}${r0}${c1}${r1}`;
            }
        }
        else {
            return this.zhstr;
        }
    }

    setSeat_ICCS(ICCSstr){
        let [fcol, frow, tcol, trow] = [...ICCSstr]; // ...展开运算符
        this.fseat = Board.getSeat(Number(frow), ColChars[fcol]);
        this.tseat = Board.getSeat(Number(trow), ColChars[tcol]);
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

        
class Board {
    static getRow(seat){
        return Math.floor(seat / NumCols);
    }
    
    static getCol(seat){
        return seat % NumCols;
    }
    
    static getSeat(row, col){
        return row * NumCols + col;
    }

    static rotateSeat(seat){
        return 89 - seat;
    }
    
    static symmetrySeat(seat){
        return (this.getRow(seat) + 1) * NumCols - seat % NumCols - 1;
    }
    
    static isSameCol(seat, othseat){
        return this.getCol(seat) == this.getCol(othseat);
    }
    
    static getSameColSeats(seat, othseat){
        let seats = new Array();
        let step = seat < othseat ? NumCols : -NumCols;

        function compare (i, j){
            return step > 0 ? i < j : i > j;
        }; // 定义比较函数
        for (let i = seat + step; compare(i, othseat); i += step){
            seats.push(i);
        }
        return seats;
    }
    
    static getKingMoveSeats(seat){
        let E = seat + 1,          
            S = seat - NumCols,
            W = seat - 1,
            N = seat + NumCols;
        let row = this.getRow(seat);
        let col = this.getCol(seat);
        let mvseats, seats;
        if (col == 4){
            mvseats = [E, S, W, N];
        }
        else if (col == 3){
            mvseats = [E, S, N];
        }
        else {
            mvseats = [W, S, N];
        }
        if (row == 0 || row ==7){
            seats = new Set([E, W, N]);
        }
        else if (row == 2 || row == 9){
            seats = new Set([S, W, N]);
        }
        else {
            seats = new Set([E, S, W, N]);
        }
        return mvseats.filter(s => seats.has(s));
    }
    
    static getAdvisorMoveSeats(seat){
        let EN = seat + NumCols + 1,          
            ES = seat - NumCols + 1,
            WS = seat - NumCols - 1,
            WN = seat + NumCols - 1;
        let row = this.getRow(seat);
        let col = this.getCol(seat);
        if (col == 4){
            return [EN, ES, WS, WN];
        }
        else if (col == 3){
            if (row == 0 || row == 7){
                return [EN];
            }
            else {
                return [ES];
            }
        }
        else {
            if (row == 0 || row == 7){
                return [WN];
            }
            else {
                return [WS];
            } 
        }
    }

    // 获取移动、象心行列值
    static getBishopMove_CenSeats(seat){
        let EN = seat + 2 * NumCols + 2,          
            ES = seat - 2 * NumCols + 2,
            WS = seat - 2 * NumCols - 2,
            WN = seat + 2 * NumCols - 2;
        let row = this.getRow(seat);
        let col = this.getCol(seat);
        let mvseats;
        if (col == MaxColNo){
            mvseats = [WS, WN];
        }
        else if (col == MinColNo){
            mvseats = [ES, EN];
        }
        else if (row == 0 || row == 5){
            mvseats = [EN, WN];
        }
        else if (row == 4 || row == 9){
            mvseats = [ES, WS];
        }
        else {
            mvseats = [EN, ES, WN, WS];
        }
        return mvseats.map(s => [s, (seat + s) / 2]);
    }

    // 获取移动、马腿行列值
    static getKnightMove_LegSeats(seat){
        function _leg(first, to){
            let x = to - first;
            if (x > NumCols + 2){
                return first + NumCols;
            }
            else if (x < -NumCols - 2){
                return first - NumCols;
            }
            else if (x == NumCols + 2 || x == -NumCols + 2){
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
        switch(this.getCol(seat)){
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
        switch (this.getRow(seat)){
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
    static getRookCannonMoveSeat_Lines(seat){
        let seat_lines = [[], [], [], []];
        let row = this.getRow(seat); //this指类，而不是实例
        let leftlimit = row * NumCols - 1;
        let rightlimit = (row + 1) * NumCols;
        for (let i = seat - 1; i > leftlimit; i--){
            seat_lines[0].push(i);
        }
        for (let i = seat + 1; i < rightlimit; i++){
            seat_lines[1].push(i);
        }
        for (let i = seat - NumCols; i > -1; i -= NumCols){
            seat_lines[2].push(i);
        }
        for (let i = seat + NumCols; i < 90; i += NumCols){
            seat_lines[3].push(i);
        }
        return seat_lines;
    }

    getPawnMoveSeats(seat){
        let E = seat + 1, 
            S = seat - NumCols,
            W = seat - 1,
            N = seat + NumCols;
        let mvseats, seats;
        switch (this.getCol(seat)){
            case MaxColNo:
                mvseats = [S, W, N];
                break;
            case MinColNo:
                mvseats = [E, S, N];
                break;
            default:
                mvseats = [E, S, W, N];
        }
        let row = this.getRow(seat);
        if (row == 9 || row == 0){
            seats = new Set([E, W]);        
        }
        else {
            if (this.getSide(this.getColor(seat)) == BOTTOM){
                seats = new Set([E, W, N]);
            }
            else {
                seats = new Set([E, W, S]);
            }
        }
        return mvseats.filter(s => seats.has(s));
    }

    constructor(){
        this.seats = new Array(90);
        this.pieces = new Pieces();
        this.rootmove = null;
        this.bottomSide = null;
        //this.readfile(filename);

    }

    toString(){
        function __getname(piece){
            let rcpName = {'车': '車', '马': '馬', '炮': '砲'};
            let name = piece.name;
            if (piece.color == BLACK && name in rcpName){
                return rcpName[name];
            }
            else {
                return name;
            }
        }

        let linestr = blankBoard.trim().split('\n').map(line => [...line.trim()]);
        for (let piece of this.getLivePieces()){
            let seat = this.getSeat(piece);
            linestr[(9-this.getRow(seat))*2][Seats.getCol(seat) * 2] = __getname(piece);
        }
        return `\n${linestr.map(line => line.join('')).join('\n')}\n`;
    }

    __infostr(){
        return this.info.map(x => `[${x} "${this.info[x]}"]`).join('\n');
    }

    toLacelString(){
    
        function __setchar(move){
            let firstcol = move.maxcol * 5;
            for (let i=0; i<4; i++){
                linestr[move.stepno * 2][firstcol+i] = move.zhstr[i];
            }         
            if (move.remark){
                remstrs.push(`(${move.stepno},${move.maxcol}): {${move.remark}}`);
            }             
            if (move.next_){
                linestr[move.stepno * 2 + 1][firstcol + 1] = ' ↓';
                linestr[move.stepno * 2 + 1][firstcol + 2] = ' ';
                __setchar(move.next_);
            }
            if (move.other){
                let linef = firstcol + 4;
                let linel = move.other.maxcol * 5;
                for (let i=linef; i<linel; i++){
                    linestr[move.stepno * 2][i] = '…';
                }
                __setchar(move.other);
            }
        }
            
        let line = [...'　'.repeat((this.maxcol + 1) * 5)];
        let linestr; 
        for (let i of range(0, (this.maxrow + 1) * 2)){
            linestr.push(line);
        }        
        let remstrs = [];
        __setchar(this.rootmove);
            
        let totalstr = `着法深度：${this.maxrow}, 变着广度：${this.othcol}, 视图宽度：${this.maxcol}\n`;
        let walkstr = [...linestr].join('\n');
        let remstr = remstrs.join('\n');
        return [this.__infostr(), str(self), totalstr, walkstr, remstr].join('\n');
    }

    __clearinfomove(){
        this.info = {'Author': '',
                    'Black': '',
                    'BlackTeam': '',
                    'Date': '',
                    'ECCO': '',
                    'Event': '',
                    'FEN': FEN,
                    'Format': 'zh',
                    'Game': 'Chinese Chess',
                    'Opening': '',
                    'PlayType': '',
                    'RMKWriter': '',
                    'Red': '',
                    'RedTeam': '',
                    'Result': '',
                    'Round': '',
                    'Site': '',
                    'Title': '',
                    'Variation': '',
                    'Version': ''};
        this.rootmove = new Move();
        this.curmove = this.rootmove;
        this.firstcolor = RED;
        this.movcount = -1; //消除根节点
        this.remcount = 0; //注解数量
        this.remlenmax = 0; //注解最大长度
        this.othcol = 0; //存储最大变着层数
        this.maxrow = 0; //存储最大着法深度
        this.maxcol = 0; //存储视图最大列数  
    }

    isBottom(color){
        return this.bottomSide == color;
    }

    isBlank(seat){
        return Boolean(this.seats[seat]);
    }

    getSeat(piece){
        return this.seats.indexof(piece);
    }

    getPiece(seat){
        return this.seats[seat];
    }
    
    getColor(seat){
        return this.seats[seat].color;
    }

    getSide(color){
        return this.bottomSide == color? BOTTOM: TOP; 
    }

    getKing(color){
        return this.pieces.getKing(color);
    }

    getKingSeat(color){
        return this.getSeat(this.getKing(color));
    }

    getLivePieces(self){
        return this.seats.filter(p => Boolean(p));
    }

    getLiveSidePieces(color){
        return this.getLivePieces().filter(p => p.color == color);
    }

    getSidenNameSeats(color, name){
        return this.getLiveSidePieces(color).filter(
            p => p.name == name).map(p => this.getSeat(p));
    }

    getSideNameColSeats(color, name, col){
        return this.getSidenNameSeats(color, name).filter(s => this.getCol(s) == col);
    }

    getEatedPieces(self){
        let livePieces = new Set(this.getLivePieces());
        return this.pieces.pies.filter(p => !livePieces.has(p));
    }

    //

}

// 单例对象
const board = new Board();

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

function constValue(){
    const BOTTOM = 'bottom';
    const TOP = 'top';
    const NumCols = 9;
    const NumRows = 10;
    const MinColNo = 0;
    const MaxColNo = 8;
    const ColChars = 'abcdefghi';
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
function range(from, end){
    let array = new Array();
    for (let i = from; i < end; i++){
        array.push(i);
    }
    return array;
}
        

console.log(board);
