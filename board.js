// 中国象棋棋盘布局类型 by-cjp

import {blankBoard, View, multRepl, xmlIndent} from './base.js';
import {BLACK, RED, CharNames, Pieces} from './piece.js';
import {partition, Move, Moves} from './move.js';

const { BOTTOM, TOP,
        NumCols, NumRows, maxColNo, MinColNo,
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
        return (Board.getRow(seat) + 1) * NumCols - seat % NumCols - 1;
    }
    
    static isSameCol(seat, othseat) {
        return Board.getCol(seat) == Board.getCol(othseat);
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
        let E = seat + 1,          
            S = seat - NumCols,
            W = seat - 1,
            N = seat + NumCols;
        let row = Board.getRow(seat);
        let col = Board.getCol(seat);
        let mvseats, seats;
        if (col == 4) {
            mvseats = [E, S, W, N];
        }
        else if (col == 3) {
            mvseats = [E, S, N];
        }
        else {
            mvseats = [W, S, N];
        }
        if (row == 0 || row ==7) {
            seats = new Set([E, W, N]);
        }
        else if (row == 2 || row == 9) {
            seats = new Set([S, W, N]);
        }
        else {
            seats = new Set([E, S, W, N]);
        }
        return mvseats.filter(s => seats.has(s));
    }
    
    static getAdvisorMoveSeats(seat) {
        let EN = seat + NumCols + 1,          
            ES = seat - NumCols + 1,
            WS = seat - NumCols - 1,
            WN = seat + NumCols - 1;
        let row = Board.getRow(seat);
        let col = Board.getCol(seat);
        if (col == 4) {
            return [EN, ES, WS, WN];
        }
        else if (col == 3) {
            if (row == 0 || row == 7) {
                return [EN];
            }
            else {
                return [ES];
            }
        }
        else {
            if (row == 0 || row == 7) {
                return [WN];
            }
            else {
                return [WS];
            } 
        }
    }

    // 获取移动、象心行列值
    static getBishopMove_CenSeats(seat) {
        let EN = seat + 2 * NumCols + 2,          
            ES = seat - 2 * NumCols + 2,
            WS = seat - 2 * NumCols - 2,
            WN = seat + 2 * NumCols - 2;
        let row = Board.getRow(seat);
        let col = Board.getCol(seat);
        let mvseats;
        if (col == maxColNo) {
            mvseats = [WS, WN];
        }
        else if (col == MinColNo) {
            mvseats = [ES, EN];
        }
        else if (row == 0 || row == 5) {
            mvseats = [EN, WN];
        }
        else if (row == 4 || row == 9) {
            mvseats = [ES, WS];
        }
        else {
            mvseats = [EN, ES, WN, WS];
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
        switch(Board.getCol(seat)) {
            case maxColNo: 
                mvseats = [SW, WS, WN, NW];
                break;
            case maxColNo - 1:
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
        switch (Board.getRow(seat)) {
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
        let row = Board.getRow(seat); //this指类，而不是实例
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

    getPawnMoveSeats(seat) {
        let E = seat + 1, 
            S = seat - NumCols,
            W = seat - 1,
            N = seat + NumCols;
        let mvseats, seats;
        switch (Board.getCol(seat)) {
            case maxColNo:
                mvseats = [S, W, N];
                break;
            case MinColNo:
                mvseats = [E, S, N];
                break;
            default:
                mvseats = [E, S, W, N];
        }
        let row = Board.getRow(seat);
        if (row == 9 || row == 0) {
            seats = new Set([E, W]);        
        }
        else {
            if (this.getSide(this.getColor(seat)) == BOTTOM) {
                seats = new Set([E, W, N]);
            }
            else {
                seats = new Set([E, W, S]);
            }
        }
        return mvseats.filter(s => seats.has(s));
    }

    addListener(listener) {
        let fileInput = document.getElementById("fileInput");
        fileInput.addEventListener("change", listener, false);
        //let body = document.getElementById("body");    
        //body.addEventListener("load", listener, false);
    }
       
    constructor() {
        this.seats = new Array(90);
        this.pieces = new Pieces();
        this.moves = new Moves();
        this.rootMove = this.moves.rootMove; // 本类对象方便引用

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
        this.bottomSide = null;        
        this.addListener(this.readFile());

    }

    boardString() {
        function __getname(piece) {
            let rcpName = {'车': '車', '马': '馬', '炮': '砲'};
            let name = piece.name;
            return (piece.color == BLACK && name in rcpName) ?  rcpName[name] : name;
        }

        let lineStr = blankBoard.trim().split('\n').map(line => [...line.trim()]);
        for (let piece of this.getLivePieces()) {
            let seat = this.getSeat(piece);
            lineStr[(9-Board.getRow(seat))*2][Board.getCol(seat) * 2] = __getname(piece);
        }
        return `\n${lineStr.map(line => line.join('')).join('\n')}\n`;
    }

    infoString() {
        return Object.keys(this.info).map(x => `[${x} "${this.info[x]}"]`).join('\n');
    }

    toString() {
        return [this.boardString(), this.infoString(), this.moves.toString()].join('\n');
    }
    
    toLacelString() {
    
        function __setchar(move) {
            let firstcol = move.maxCol * 5;
            for (let i=0; i<4; i++) {
                //console.log(lineStr[move.stepNo * 2] || `${move.stepNo * 2}`);
                lineStr[move.stepNo * 2][firstcol+i] = move.zhstr[i];
            }         
            if (move.remark) {
                remstrs.push(`(${move.stepNo},${move.maxCol}): {${move.remark}}`);
            }             
            if (move.next_) {
                lineStr[move.stepNo * 2 + 1][firstcol + 1] = ' ↓';
                lineStr[move.stepNo * 2 + 1][firstcol + 2] = ' ';
                __setchar(move.next_);
            }
            if (move.other) {
                let linef = firstcol + 4;
                let linel = move.other.maxCol * 5;
                for (let i=linef; i<linel; i++) {
                    lineStr[move.stepNo * 2][i] = '…';
                }
                __setchar(move.other);
            }
        }
            
        let line = [...'　'.repeat((this.maxCol + 1) * 5)];
        let lineStr = []; 
        for (let i of range(0, (this.maxRow + 1) * 2)) {
            lineStr.push(line);
        }        
        let remstrs = [];
        __setchar(this.rootMove);
            
        let totalstr = `着法深度：${this.maxRow}, 变着广度：${this.othCol}, 视图宽度：${this.maxCol}\n`;
        let walkstr = [...lineStr].join('\n');
        let remstr = remstrs.join('\n');
        return [this.infoString(), str(this), totalstr, walkstr, remstr].join('\n');
    }

    isBottomSide(color) {
        return this.bottomSide == color;
    }

    isBlank(seat) {
        return Boolean(this.seats[seat]);
    }

    getSeat(piece) {
        return this.seats.indexOf(piece);
    }

    getPiece(seat) {
        return this.seats[seat];
    }
    
    getColor(seat) {
        return this.seats[seat].color;
    }

    getSide(color) {
        return this.bottomSide == color? BOTTOM: TOP; 
    }

    getKing(color) {
        return this.pieces.getKing(color);
    }

    getKingSeat(color) {
        return this.getSeat(this.getKing(color));
    }

    getLivePieces() {
        return this.seats.filter(p => Boolean(p));
    }

    getLiveSidePieces(color) {
        return this.getLivePieces().filter(p => p.color == color);
    }

    getSidenNameSeats(color, name) {
        return this.getLiveSidePieces(color).filter(
            p => p.name == name).map(p => this.getSeat(p));
    }

    getSideNameColSeats(color, name, col) {
        return this.getSidenNameSeats(color, name).filter(s => Board.getCol(s) == col);
    }

    getEatedPieces() {
        let livePieces = new Set(this.getLivePieces());
        return this.pieces.pies.filter(p => !livePieces.has(p));
    }

    isKilled(color) {
        let otherColor = color == BLACK? RED :BLACK;
        let kingSeat = this.getKingSeat(color);
        let otherSeat = this.getKingSeat(otherColor);
        if (Board.isSameCol(kingSeat, otherSeat)) {  // 将帅是否对面
            if (every(getSameColSeats(kingSeat, otherSeat).filter(s => this.isBlank(seat)))) {
                return true;
            }
        for (let piece of this.getLiveSidePieces(otherColor)) {
            if (piece.isStronge && (kingSeat in piece.getMoveSeats(this))) {
                return true;
            }
        }
        return false
        }
    }

    isDied(color) {
        for (let piece of this.getLiveSidePieces(color)) {
            if (this.canMoveSeats(this.getSeat(piece))) {
                return False;
            }
        }
        return True
    }

    canMoveSeats(fseat) {    //    '获取棋子可走的位置, 不能被将军'
        let result = [];
        let piece = this.getPiece(fseat);
        let color = piece.color;
        let moveData;
        for (let tseat of piece.getMoveSeats(this)) {
            moveData = {fseat: fseat, tseat: tseat};
            moveData.eatPiece = this.__go(moveData);
            if (!this.isKilled(color)) {
                result.push(tseat);
            }
            this.__back(moveData);
        }
        return result
    }        

    __go(move) {
        let fseat = move.fseat, 
            tseat = move.tseat;
        let eatPiece = this.seats[tseat];
        this.seats[tseat] = this.seats[fseat];
        this.seats[fseat] = null;
        return eatPiece;
    }

    __back(move) {
        let fseat = move.fseat, 
            tseat = move.tseat;
        this.seats[fseat] = this.seats[tseat];
        this.seats[tseat] = move.eatPiece;
    }

    sortPawnSeats(isBottomSide, pawnSeats) {   //     '多兵排序'
        let result = [];
        let pawnSeatMap = new Map(pawnSeats.map(s => [seatCharsgetCol(s), []]));
        for (let seat of pawnSeats) {
            pawnSeatMap[seatCharsgetCol(seat)].push(seat);
        }  // 列内排序
        let pawnSeatArray = [...pawnSeatMap].filter(([c, s]) => s.length > 1);
        pawnSeatArray = pawnSeatArray.sort((a, b) => a[0] - b[0]);
        for (let {col, seats} of pawnSeatArray.entries()) {
                result.concat(seats);
        }  // 按列排序
        return isBottomSide? result.reverse(): result;
    }    

    setMoveSeat(move) {
        //根据中文纵线着法描述取得源、目标位置: (fseat, tseat)
        function __zhcol_col(zhcol) {
            return (isBottomSide? NumCols - ChineseToNum[zhcol]: ChineseToNum[zhcol] - 1);
        }

        let color = this.currentColor, 
            zhstr = move.zhstr;
        let isBottomSide = this.isBottomSide(color);
        let name = zhstr[0];
        if (name in CharNames.values()) {
            let seats = this.getSideNameColSeats(color, name, __zhcol_col(zhstr[1]));
            // assert bool(seats), ('没有找到棋子 => %s color:%s name: %s\n%s' % (zhstr, color, name, this))

            let index = (seats.length == 2 && AdvisorBishopNames.indexOf(name) >= 0
                            && ((zhstr[2] == '退') == isBottomSide))? -1 : 0;
            //# 排除：士、象同列时不分前后，以进、退区分棋子
            move.fseat = seats[index];
        } else {
            //# 未获得棋子, 查找某个排序（前后中一二三四五）某方某个名称棋子
            let index = ChineseToNum[zhstr[0]], 
                name = zhstr[1];
            let seats = this.getSideNameSeats(color, name);
            // assert len(seats) >= 2, 'color: %s name: %s 棋子列表少于2个! \n%s' % (     color, name, this)
            
            if (PawnNames.indexOf(name) >= 0) {
                let seats = this.sortPawnSeats(isBottomSide, seats);  //# 获取多兵的列
                if (seats.length > 3) {
                    index -= 1;
                }
            }  //# 修正index
            else if (isBottomSide) {
                seats = seats.reverse();
            }
            move.fseat = seats[index];
        }

        let movdir = ChineseToNum[zhstr[2]] * (isBottomSide? 1 : -1);
        //# '根据中文行走方向取得棋子的内部数据方向（进：1，退：-1，平：0）'
        let tocol = __zhcol_col(zhstr[3]);
        if (LineMovePieceNames.indexOf(name) >= 0) {
            //#'获取直线走子toseat'
            let row = Board.getRow(fseat);
            move.tseat = (movdir == 0)? Board.getSeat(row, tocol) : (
                            Board.getSeat(row + movdir * ChineseToNum[zhstr[3]],
                                Board.getCol(fseat)));
        }        
        else {
            //#'获取斜线走子：仕、相、马toseat'
            let step = tocol - Board.getCol(fseat);//  # 相距1或2列            
            let inc = (AdvisorBishopNames.indexOf(name) >= 0)? Math.abs(step) : (
                        Math.abs(step) == 1? 2 : 1);
            move.tseat = Board.getSeat(Board.getRow(fseat) + movdir * inc, tocol);
        }
        //move.fseat = fseat
        /*'''
        this.setZhstr(move)
        assert zhstr == move.zhstr, ('棋谱着法: %s   生成着法: %s 不等！' % (
                zhstr, move.zhstr))
        '''  
        */      
    }

    setZhstr(move) {
        '根据源、目标位置: (fseat, tseat)取得中文纵线着法描述'
        function __col_chcol(color, col) {
            return NumToChinese[color][isBottomSide? NumCols - col : col + 1];
        }

        let fseat = move.fseat, 
            tseat = move.tseat;
        let frompiece = this.getPiece(fseat);
        let color = frompiece.color, 
            name = frompiece.name;
        let isBottomSide = this.isBottomSide(color);
        let fromrow = Board.getRow(fseat), 
            fromcol = Board.getCol(fseat);
        let seats = this.getSideNameColSeats(color, name, fromcol);
        let length = seats.length;
        let firstStr, lastStr;
        if (length > 1 && StrongePieceNames.indexOf(name) >= 0) {
            if (PawnNames.indexOf(name) >= 0) {
                seats = this.sortPawnSeats(isBottomSide,
                    this.getSideNameSeats(color, name));
                length = seats.length;
            }
            else if (isBottomSide) {  //# '车', '马', '炮'
                seats = seats.reverse();
            }
            let indexstr = length in [2, 3]? {2: '前后', 3: '前中后'}[length] : '一二三四五';
            firstStr = indexstr[seats.indexOf(fseat)] + name;
        }
        else {
            //#仕(士)和相(象)不用“前”和“后”区别，因为能退的一定在前，能进的一定在后
            firstStr = name + __col_chcol(color, fromcol);
        }

        let torow = Board.getRow(tseat), 
            tocol = Board.getCol(tseat);
        let chcol = __col_chcol(color, tocol);
        let tochar = torow == fromrow? '平' : (isBottomSide == (torow > fromrow)? '进' : '退')
        let tochcol = ((torow == fromrow || LineMovePieceNames.indexOf(name) < 0)? chcol :
                   NumToChinese[color][abs(torow - fromrow)]);
        lastStr = tochar + tochcol;
        move.zhstr = firstStr + lastStr;
        /*'''
        this.setMoveSeat(move) # 不能成功断言，可能与curcolor值有关？2018.4.26
        assert (fseat, tseat) == (move.fseat, move.tseat), ('棋谱着法: %s   生成着法: %s 不等！' % ((fseat, tseat), (move.fseat, move.tseat)))
        '''*/
    }

    __fen(pieceChars=null) {
        function __linetonums() {
            //'下划线字符串对应数字字符元组 列表'
            let result = [];
            for (let i=9; i>0; i--) {
                result.push(['_'.repeat(i), String(i)]);
            }
            return result;
        }

        if (!pieceChars) {
            pieceChars = this.seats.map(p => piece.char);
        }
        let charls = [];
        for (let rowno=0; rowno<NumRows; rowno++) {
            charls.push(pieceChars.slice(rowno * NumCols, (rowno + 1) * NumCols));
        }
        let _fen = charls.reverse().map(chars => chars.join('')).join('/');
        for (let [_str, nstr] of __linetonums()) {
            _fen = _fen.replace(_str, nstr);
        }
        return _fen;
    }

    mergeFen(_fen, whoplay) {
        return `${_fen} ${whoplay? 'b' : 'r'} - - 0 0`;
    }

    getFen() {    
        let assignmove = this.currentMove;
        this.moveFirst();
        let fen = this.mergeFen(this.__fen(), this.currentColor == BLACK);
        this.moveThis(assignmove);
        //assert this.info['FEN'] == fen, '\n原始:{}\n生成:{}'.format(this.info['FEN'], fen)
        return fen;
    }

    setSeatPieces(seatPieces) {
        this.seats = new Array(90);
        for (let [seat, piece] of seatPieces.entries()) {
            this.seats[seat] = piece;
        }
        this.bottomside = Board.getRow(this.getKingSeat(RED)) < 3? RED : BLACK;
    }     

    setFen(fen='') {    
        function __numtolines() {
            //'数字字符: 下划线字符串'
            let numtolines = [];
            for (let i=0; i<10; i++)
                numtolines.push([String(i), '_'.repeat(i)]);
            return numtolines;
        }

        function __isvalid(charls) {
            '判断棋子列表是否有效'
            if (charls.length != 90)
                return 'len(charls) != 90 棋局的位置个数不等于90，有误！';
            let chars = charls.filter(c => c != '_');
            if (chars.length > 32)
                return 'chars.length > 32 全部的棋子个数大于32个，有误！';        
            return false;
        }

        if (!fen)
            fen = this.info['FEN'];
        else{
            this.info['FEN'] = fen;
        }
        let afens = fen.split(' ');
        let _fen = afens[0];
        let fenstr = _fen.split('/').reverse().join('');
        let charls = multRepl(fenstr, __numtolines()).split('');
        let info = __isvalid(charls);
        if (info)
            console.log(info);
        let seatChars = []; //= charls.entries().map(c => );
        for (let i = 0; i < charls.length; i++) {
            seatChars.push([i, charls[i]]);
        }
        //console.log(seatChars);
        this.setSeatPieces(this.pieces.seatPieces(seatChars));
        this.firstColor = afens[1] == 'b'? BLACK : RED;
        this.currentMove = this.rootMove;
        this.notifyViews();
    }

    changeSide(changeType='exchange') {
        
        let __changeseat = (seltransfun) => {            
            //'根据transfun改置每个move的fseat,tseat'
            
            function __seat(move) {
                move.fseat = transfun(move.fseat);
                move.tseat = transfun(move.tseat);
                if (move.next_)
                    __seat(move.next_);
                if (move.other)
                    __seat(move.other);
            }

            if (this.rootMove.next_)
                __seat(this.rootMove.next_);
            } //# 驱动调用递归函数
                    
        let currentMove = this.currentMove;
        this.moves.moveFirst();
        let seatPieces;
        if (changeType == 'exchange') {
            this.firstColor = this.firstColor == BLACK? RED : BLACK;
            seatPieces = new Map(this.getLivePieces().map(
                    p => [this.getSeat(piece), this.pieces.getothsidepiece(piece)]));
        } else {
            let transfun = changeType == 'rotate'? this.rotateseat : this.symmetryseat;
            __changeseat(transfun);
            seatPieces = new Map(this.getLivePieces().map(p => [transfun(this.getSeat(piece)), piece]));
        }
        this.setSeatPieces(seatPieces);
        if (changeType != 'rotate')
            this.moves.setMoveInfo(this);
        if (currentMove !== this.rootMove) {
            this.moves.moveTo(currentMove);
        }
    }

    setCounts(move) {
        this.movCount += 1;
        if (move.remark) {
            this.remCount += 1;
            this.remLenMax = Math.max(this.remLenMax, move.remark.length);
        }
    }

    __readbin(file) {
        movestruct1 = struct.Struct('3B');
        movestruct2 = struct.Struct('H');
        
    }

    __readpgn(pgnText) {
        let [infoStr, moveStr] = partition(pgnText, /\n1./gm);
        if (infoStr) {
            for (let [key, value] of infoStr.match(/\[(\S+) "(.*)"\]/gm)) {
                this.info[key] = value;
            } //# 读取info内容（在已设置原始key上可能会有增加）
        }                
        let fmt = this.info['Format'];
        if (fmt == 'cc') {
            this.moves.readMove_cc(moveStr, this);
        } else {
            let resultStr = moveStr.match(/\s(1-0|0-1|1\/2-1\/2|\*)(?!\S)/m);
            if (resultStr != null) {
                this.info['Result'] = resultStr[1];
            } //  # 棋局结果
            let remark = infoStr.match(/\{([\s\S]*?)\}/gm);
            if (remark) {
                this.rootMove.remark = remark[0];
            }   
            this.moves.readMove_ICCSzh(moveStr, fmt, this);
        }
        console.log(this.toString());
        console.log(this.rootMove.toString());
        console.log(this);          
    }

    readFile() {
        let files = document.getElementById("fileInput").files;
        if (!files) {
            return ;
        }
        let reader = new FileReader();
        reader.readAsText(files[0]);//, "utf-8", "GB2312"
        reader.onload = () => this.__readpgn(reader.result);
        reader.onerror = (e) => console.log("Error", e);                
        
        this.setFen();
        this.moves.setMoveInfo(this);

        let fileDisplay = document.getElementById("fileDisplay");
        fileDisplay.innerHTML = '';
        fileDisplay.appendChild(document.createTextNode(`${this.toString()}`));        
    }

    loadViews(views) {
        this.views = views;
        this.notifyViews();
    }

    notifyViews() {
        //'通知视图更新'
        if (!('views' in this))
            return ;
        for (view in this.views)
            view.updateview();
    }   

}

// 单例对象
const board = new Board();

// 设置类的静态属性（不能在类定义内直接设置）
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
    const maxColNo = 8;
    // 初始布局
    const NumToChinese = {
        RED: {
        1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
            6: '六', 7: '七', 8: '八', 9: '九'
        },
        BLACK: {
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
            NumCols, NumRows, maxColNo, MinColNo,
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


//console.log(board);

