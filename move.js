// 中国象棋着法树节点类型 by-cjp

import * as base from './base.js';
import { Board } from './board.js';
export { Move, Moves };
//console.log('move.js!');

// 着法节点JSON数据类
class MoveJSON {
    constructor(fseat = 0, tseat = 0, remark = '', zhStr = '', next = null, other = null) {
        this.fseat = fseat;
        this.tseat = tseat;
        this.remark = remark;
        this.zhStr = zhStr; //prev ? '' : '1.开始'; // 中文描述（需结合board确定）
        this.next = next;
        this.other = other;
    }

    toJSON() {
        let __getJSON = (move) => Boolean(move) ? this.toJSON(move) : null;
        return `{"fseat":${this.fseat},"tseat":${this.tseat},"remark":${this.remark},"zhStr":${this.zhStr},"next":${__getJSON(this.next)},"other":${__getJSON(this.other)}`;
    }
    
/*
    // （rootMove）调用
    fromJSON(moveJson, board) {
        // 还原函数，根据JSON字符串生成对象时调用：JSON.parse(moveJson, reviver);
        function reviver(key, value) {
            return (key == 'next' || key == 'other') ? new Move(value) : value;
        }

        this.setNext(JSON.parse(moveJson, reviver));
        //this.initInfo(board, true);
    }
*/

}

// 着法节点类
class Move extends MoveJSON {

    constructor(mj = new MoveJSON(), prev = null) {
        super(mj.fseat, mj.tseat, mj.remark, mj.zhStr, mj.next, mj.other);
        this.prev = prev;
        this.stepNo = 0; // 着法深度
        this.othCol = 0; // 变着广度
        this.maxCol = 0; // 图中列位置（需结合board确定）
    }

    toString() {
        let stepNo = this.stepNo,
            othCol = this.othCol,
            maxCol = this.maxCol,
            fseat = this.fseat,
            tseat = this.tseat,
            zhStr = this.zhStr;
        return `(stepNo: ${stepNo} othCol: ${othCol} maxCol: ${maxCol} fseat: ${fseat} tseat: ${tseat}) 着法： ${zhStr}`;
    }

    ICCSstr() {
        return this.stepNo == 0 ? '' : `${ColChars[Board.getCol(this.fseat)]}${Board.getRow(this.fseat)}${ColChars[Board.getCol(this.tseat)]}${Board.getRow(this.tseat)}`;
    }

    ICCSzhstr(fmt) {
        return fmt == 'ICCS' ? this.ICCSstr() : this.zhStr;
    }

    setNext(next) {
        next.stepNo = this.stepNo + 1;
        next.othCol = this.othCol; // 变着层数
        this.next = next;
    }

    setOther(other) {
        other.stepNo = this.stepNo; // 与premove的步数相同
        other.othCol = this.othCol + 1; // 变着层数
        this.other = other;
    }

    setSeatFromICCS(ICCS) {
        let [fcol, frow, tcol, trow] = [...ICCS]; // ...展开运算符
        this.fseat = Board.getSeat(Number(frow), ColChars[fcol]);
        this.tseat = Board.getSeat(Number(trow), ColChars[tcol]);
    }

    //根据中文纵线着法描述取得源、目标位置: (fseat, tseat)
    setSeatFromZhStr(board, zhStr = '') {
        function __getCol(color, zhcol) {
            let num = base.Num_Chinese[color].indexOf(zhcol);
            return (isBottomSide ? 9 - num : num - 1);
        }

        zhStr = zhStr || this.zhStr;
        let fseat,
            color = base.Num_Chinese[base.RED].indexOf(zhStr[zhStr.length - 1]) >= 0 ? base.RED : base.BLACK,
            isBottomSide = board.isBottomSide(color),
            name = zhStr[0];
        if (base.PieceNames.has(name)) {
            let seats = board.getSideNameColSeats(color, name, __getCol(color, zhStr[1]));
            // assert bool(seats), ('没有找到棋子 => %s color:%s name: %s\n%s' % (zhStr, color, name, this))

            let index = (seats.length == 2 && base.AdvisorBishopNames.has(name)
                && ((zhStr[2] == '退') == isBottomSide)) ? -1 : 0;
            //# 排除：士、象同列时不分前后，以进、退区分棋子
            fseat = seats[index];
        } else {
            //# 未获得棋子, 查找某个排序（前后中一二三四五）某方某个名称棋子
            let index = base.Num_Chinese[color].indexOf(zhStr[0]),
                name = zhStr[1];
            let seats = board.getSideNameSeats(color, name);
            // assert len(seats) >= 2, 'color: %s name: %s 棋子列表少于2个! \n%s' % (     color, name, this)

            if (base.PawnNames.has(name)) {
                let seats = board.sortPawnSeats(isBottomSide, seats);  //# 获取多兵的列
                if (seats.length > 3) {
                    index -= 1;
                }
            } else if (isBottomSide) { //# 修正index
                seats = seats.reverse();
            }
            fseat = seats[index];
        }

        let movDir = base.DirectionToNum[zhStr[2]] * (isBottomSide ? 1 : -1);
        //# '根据中文行走方向取得棋子的内部数据方向（进：1，退：-1，平：0）'
        let toCol = base.DirectionToNum[zhStr[3]];
        if (base.LineMovePieceNames.has(name)) {
            //#'获取直线走子toseat'
            let row = Board.getRow(fseat);
            this.tseat = (movDir == 0) ? Board.getSeat(row, toCol) : (
                Board.getSeat(row + movDir * base.DirectionToNum[zhStr[3]],
                    Board.getCol(fseat)));
        } else {
            //#'获取斜线走子：仕、相、马toseat'
            let step = toCol - Board.getCol(fseat);//  # 相距1或2列            
            let inc = base.AdvisorBishopNames.has(name) ? Math.abs(step) : (
                Math.abs(step) == 1 ? 2 : 1);
            this.tseat = Board.getSeat(Board.getRow(fseat) + movDir * inc, toCol);
        }
        // 可设断言
        this.fseat = fseat
    }

    // 根据源、目标位置: (fseat, tseat)取得中文纵线着法描述
    setZhStr(board) {
        function __getZhCol(color, col) {
            return base.Num_Chinese[color][isBottomSide ? 9 - col : col + 1];
        }

        let firstStr;
        let fseat = this.fseat,
            tseat = this.tseat,
            frompiece = board.getPiece(fseat),
            color = frompiece.color,
            name = frompiece.name,
            isBottomSide = board.isBottomSide(color),
            fromRow = Board.getRow(fseat),
            fromCol = Board.getCol(fseat),
            seats = board.getSideNameColSeats(color, name, fromCol),
            length = seats.length;
        if (length > 1 && StrongePieceNames.has(name)) {
            if (base.PawnNames.has(name)) {
                seats = board.sortPawnSeats(isBottomSide,
                    board.getSideNameSeats(color, name));
                length = seats.length;
            } else if (isBottomSide) {  //# '车', '马', '炮'
                seats = seats.reverse();
            }
            let tempStr = { 2: '前后', 3: '前中后' };
            let indexStr = length in tempStr ? tempStr[length] : '一二三四五';
            firstStr = indexStr[seats.indexOf(fseat)] + name;
        } else {
            //#仕(士)和相(象)不用“前”和“后”区别，因为能退的一定在前，能进的一定在后
            firstStr = name + __getZhCol(color, fromCol);
        }

        let toRow = Board.getRow(tseat),
            toCol = Board.getCol(tseat),
            zhCol = __getZhCol(color, toCol),
            toChar = toRow == fromRow ? '平' : (isBottomSide == (toRow > fromRow) ? '进' : '退'),
            toZhCol = (toRow == fromRow || base.LineMovePieceNames.has(name) ? zhCol :
                base.Num_Chinese[color][abs(toRow - fromRow)]);
        // 可设断言
        this.zhStr = firstStr + toChar + toZhCol;
    }

    readBin(move) {
        /*
        hasothernextrem, fi, ti = movestruct1.unpack(fileobj.read(3));
        move.fseat, move.tseat = fi, ti;
        if (hasothernextrem & 0x20) {
            rlength = movestruct2.unpack(fileobj.read(2))[0];
            move.remark = fileobj.read(rlength).decode();
        }
        if (hasothernextrem & 0x80) {
            move.setOther(Move(move.prev));
            __readMove(move.other);
        }
        if (hasothernextrem & 0x40) {
            move.setNext(Move(move));
            __readMove(move.next);
        }
        */
    }

    //'根据chessInstance设置树节点的zhstr或seat'
    initInfo(board, seated = false) {
        let __set = (move) => {
            if (seated) {
                if (!this.zhStr) {
                    this.setZhStr(move, board);
                }
            } else {
                this.setSeatFromZhStr(board);
            }
            board.__go(move);
            if (move.next) {
                move.next.prev = move; // 补齐JSON串生成对象时因避免循环而丢弃的属性
                __set(move.next);
            }
            board.__back(move);
            if (move.other) {
                move.other.prev = move; // 补齐JSON串生成对象时因避免循环而丢弃的属性
                this.maxCol += 1;
                __set(move.other);
            }
        }

        if (this.next != null) { //# and this.movcount < 300: # 步数太多则太慢             
            __set(this.next);
        } // # 驱动调用递归函数            
    }

    // （rootMove）调用
    fromICCSZh(moveStr, board, fmt = 'zh') {
        let __readMoves = (move, mvstr, isOther) => {  //# 非递归 
            let lastMove = move;
            let isFirst = true;
            let mstr, remark, mstr_remark;
            while ((mstr_remark = moverg.exec(mvstr)) != null) {
                [mstr, remark] = mstr_remark.slice(1);
                let newMove = new Move(undefined, isOther ? lastMove.prev : lastMove);
                if (fmt == 'ICCS') {
                    newMove.setSeatFromICCS(mstr);
                } else {  //if (fmt == 'zh')
                    newMove.zhStr = mstr;
                }
                if (remark) {
                    newMove.remark = remark;
                }
                if (isOther && isFirst) { // # 第一步为变着
                    lastMove.setOther(newMove);
                } else {
                    lastMove.setNext(newMove);
                }
                isFirst = false;
                lastMove = newMove;
            }
            return lastMove;
        }

        let moverg = / ([^\.\{\}\s]{4})(?= )(?:\s+\{([\s\S]*?)\})?/gm; // 插入:(?= )
        //# 走棋信息 (?:pattern)匹配pattern,但不获取匹配结果;  注解[\s\S]*?: 非贪婪
        let thisMove, leftStr, index;
        let othMoves = [this];
        let isOther = false;
        let leftStrs = moveStr.split(/\(\d+\./gm);
        //# 如果注解里存在‘\(\d+\.’的情况，则可能会有误差
        let rightrg = ') ';
        while (leftStrs.length > 0) {
            thisMove = isOther ? othMoves[othMoves.length - 1] : othMoves.pop();
            index = leftStrs[0].indexOf(rightrg);
            if (index < 0) {
                //不存在'\) '的情况；# 如果注解里存在'\) '的情况，则可能会有误差                
                othMoves.push(__readMoves(thisMove, leftStrs.shift(), isOther));
                isOther = true;
            } else {
                leftStr = leftStrs[0].slice(0, index);
                leftStrs[0] = leftStrs[0].slice(index + 2);
                __readMoves(thisMove, leftStr, isOther);
                isOther = false;
            }
        }
        this.initInfo(board);
    }

    // （rootMove）调用
    fromCC(moveStr, board) {

        let __readMove = (move, row, col, isOther = False) => {
            let zhStr = moves[row][col].match(moverg);
            if (zhStr) {
                let newMove = new Move(undefined, isOther ? move.prev : move);
                newMove.stepNo = row;
                newMove.zhStr = zhStr[0].slice(0, 4);
                newMove.remark = rems[`(${row}, ${col})`] || '';
                if (isOther) {
                    move.setOther(newMove);
                } else {
                    move.setNext(newMove);
                }
                if (zhStr[0][4] == '…') {
                    __readMove(newMove, row, col + 1, True);
                }
            } else if (isOther) {
                while (moves[row][col][0] == '…') {
                    col += 1;
                }
                __readMove(move, row, col, True);
            }
            if (zhStr && row < moves.length - 1 && moves[row + 1]) {
                __readMove(newMove, row + 1, col);
            }
        }

        let remstr;
        [moveStr, remstr] = moveStr.split(/\n\(/gm, 2);
        let moves = [],
            rems = {};
        if (moveStr) {
            let moves = [];
            let mstrrg = /.{5}/gm;
            let moverg = /([^…　]{4}[…　])/gm;
            let lineStr = moveStr.split(/\n/gm);
            for (let i = 0; i < lineStr.length; i++) {
                if (i % 2 == 0) {
                    moves.push(lineStr[i].match(mstrrg));
                }
            }
        }
        if (remstr) {
            let remrg = /\(\s*(\d+),\s*(\d+)\): \{([\s\S]*?)\}/gm;
            let rems = {};
            for (let { rowstr, colstr, remark } of ('(' + remstr).match(remrg)) {
                rems[`(${rowstr}, ${colstr})`] = remark;
            }
            this.remark = rems['(0, 0)'] || '';
        }
        if (moves.length > 1) {
            __readMove(this, 1, 0);
        }
        this.initInfo(board);
    }

}

// 棋局着法树类
class Moves {
    constructor() {
        this.rootMove = new Move();
        this.currentMove = this.rootMove;
        this.firstColor = base.RED; // 棋局载入时需要设置此属性！    
    }

    toString() {
        let __remarkstr = (move) => !move.remark ? '' : `\n{${move.remark}}\n`;

        let __addstrl = (move, isOther = false) => {
            let boutNum = Math.floor((move.stepNo + 1) / 2);
            let isEven = move.stepNo % 2 == 0;
            let preStr = isOther ? `(${boutNum}. ${isEven ? '... ' : ''}` : (isEven ? ' ' : `${boutNum}. `);
            movestrl.push(`${preStr}${move.ICCSzhstr('zh')} ${__remarkstr(move)}`);
            if (move.other) {
                __addstrl(move.other, true);
                movestrl.push(') ');
            }
            if (move.next) {
                __addstrl(move.next);
            }
        }

        let movestrl = [__remarkstr(this.rootMove)];
        if (this.rootMove.next) {
            __addstrl(this.rootMove.next);
        } // 驱动调用函数
        //console.log(movestrl);
        return movestrl.join('');
    }

    toLocaleString() {

        function __setchar(move) {
            let firstcol = move.maxCol * 5;
            for (let i = 0; i < 4; i++) {
                //console.log(lineStr[move.stepNo * 2] || `${move.stepNo * 2}`);
                lineStr[move.stepNo * 2][firstcol + i] = move.zhStr[i];
            }
            if (move.remark) {
                remstrs.push(`(${move.stepNo},${move.maxCol}): {${move.remark}}`);
            }
            if (move.next) {
                lineStr[move.stepNo * 2 + 1][firstcol + 1] = ' ↓';
                lineStr[move.stepNo * 2 + 1][firstcol + 2] = ' ';
                __setchar(move.next);
            }
            if (move.other) {
                let linef = firstcol + 4;
                let linel = move.other.maxCol * 5;
                for (let i = linef; i < linel; i++) {
                    lineStr[move.stepNo * 2][i] = '…';
                }
                __setchar(move.other);
            }
        }

        let lineStr = [];
        for (let i of base.range(0, (this.maxRow + 1) * 2)) {
            lineStr.push([...'　'.repeat((this.maxCol + 1) * 5)]);
        }
        let remstrs = [];
        this.rootMove.zhStr = '1.开始';
        __setchar(this.rootMove);

        let totalstr = `着法深度：${this.maxRow}, 变着广度：${this.othCol}, 视图宽度：${this.maxCol}`;
        let walkstr = lineStr.map(line => line.join('')).join('\n');
        let remstr = remstrs.join('\n');
        return [totalstr, walkstr, remstr].join('\n');
    }

    //'根据chessInstance设置树节点的zhstr或seat'
    initNums(board) {
        let __set = (move) => {
            this.movCount += 1;
            if (move.remark) {
                this.remCount += 1;
                this.remLenMax = Math.max(this.remLenMax, move.remark.length);
            }
            move.maxCol = this.maxCol; // # 本着在视图中的列数
            this.othCol = Math.max(this.othCol, move.othCol);
            this.maxRow = Math.max(this.maxRow, move.stepNo);
            board.__go(move);
            if (move.next) {
                __set(move.next);
            }
            board.__back(move);
            if (move.other) {
                this.maxCol += 1;
                __set(move.other);
            }
        }

        this.movCount = 0; //消除根节点
        this.remCount = 0; //注解数量
        this.remLenMax = 0; //注解最大长度
        this.othCol = 0; //# 存储最大变着层数
        this.maxRow = 0; //# 存储最大着法深度
        this.maxCol = 0; //# 存储视图最大列数
        if (this.rootMove.next != null) { //# and this.movcount < 300: # 步数太多则太慢             
            __set(this.rootMove.next);
        } // # 驱动调用递归函数            
    }

    get currentColor() {
        return this.currentMove.stepNo % 2 == 0 ? this.firstColor : (
            c => c == base.RED ? base.BLACK : base.RED)(this.firstColor);
    }

    get isStart() {
        return this.currentMove === this.rootMove;
    }

    get isLast() {
        return this.currentMove.next === null;
    }

    getPrevMoves(move = null) {
        if (!move) {
            move = this.currentMove;
        }
        let result = [move];
        while ((move = move.prev) != null) {
            result.push(move);
        }
        return result.reverse();
    }

    // 基本走法
    go(board) {
        if (this.currentMove.next) {
            board.__go(this.currentMove.next);
            this.currentMove = this.currentMove.next;
        }
    }

    // 基本走法
    back(board) {
        if (this.currentMove.prev) {
            board.__go(this.currentMove.prev);
            this.currentMove = this.currentMove.prev;
        }
    }

    // 基本走法
    goOther(board) {
        //'移动到当前节点的另一变着'
        if (this.currentMove.other) {
            let toMove = this.currentMove.other;
            this.back(board);
            board.__go(toMove);
            this.currentMove = toMove;
        }
    }

    // 复合走法
    goTo(move, board) {
        if (move === this.currentMove) return;
        this.toFirst(board);
        this.getPrevMoves(move).forEach(m => board.__go(m));
        this.currentMove = move;
    }

    // 复合走法
    toFirst(board) {
        while (this.currentMove !== this.rootMove) {
            this.back(board);
        }
    }

    // 复合走法
    toLast(board) {
        while (this.currentMove.next) {
            this.go(board);
        }
    }

    // 复合走法
    toStep(board, inc = 1) {
        let go = inc > 0;
        inc = abs(inc);
        for (let i = 0; i < inc; i++) {
            if (go) this.go(board);
            else this.back(board);
        }
    }

    // 添加着法，复合走法
    addMove(moveData, board, isOther = false) {
        let move = new Move(undefined, isOther ? this.currentMove.prev : this.currentMove);
        [move.fseat, move.tseat, move.remark] = moveData; // 调用参数同此规格
        move.setZhStr(board);
        if (isOther) {
            this.currentMove.setOther(move);
            this.goOther(board);
        } else {
            this.currentMove.setNext(move);
            this.go(board);
        }
    }

    cutNext() {
        this.currentMove.next = null;
    }

    cutOther() {
        if (this.currentMove.other) this.currentMove.other = this.currentMove.other.other;
    }

}


