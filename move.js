// 中国象棋着法树节点类型 by-cjp

import * as base from './base.js';
//import { Board } from './board.js';
export { Move, Moves };
//console.log('move.js!');

// 着法节点类
class Move {
    constructor(prev = null) {
        this.prev = prev;
        this.fseat = 0;
        this.tseat = 0;
        this.remark = '';

        this.next_ = null;
        this.other = null;
        this.stepNo = 0; // 着法深度
        this.othCol = 0; // 变着广度

        this.maxCol = 0; // 图中列位置（需结合board确定）
        this.zhstr = prev ? '' : '1.开始'; // 中文描述（需结合board确定）
    }

    toString() {
        let stepNo = this.stepNo,
            othCol = this.othCol,
            maxCol = this.maxCol,
            fseat = this.fseat,
            tseat = this.tseat,
            zhstr = this.zhstr;
        return `(stepNo: ${stepNo} othCol: ${othCol} maxCol: ${maxCol} fseat: ${fseat} tseat: ${tseat}) 着法： ${zhstr}`;
    }

    ICCSstr() {
        return this.stepNo == 0 ? '' : `${ColChars[Seats.getCol(this.fseat)]}${Seats.getRow(this.fseat)}${ColChars[Seats.getCol(this.tseat)]}${Seats.getRow(this.tseat)}`;
    }

    ICCSzhstr(fmt) {
        return fmt == 'ICCS' ? this.ICCSstr() : this.zhstr;
    }

    setSeat_ICCS(ICCSstr) {
        let [fcol, frow, tcol, trow] = [...ICCSstr]; // ...展开运算符
        this.fseat = Seats.getSeat(Number(frow), ColChars[fcol]);
        this.tseat = Seats.getSeat(Number(trow), ColChars[tcol]);
    }

    setNext(next_) {
        next_.stepNo = this.stepNo + 1;
        next_.othCol = this.othCol; // 变着层数
        this.next_ = next_;
    }

    setOther(other) {
        other.stepNo = this.stepNo; // 与premove的步数相同
        other.othCol = this.othCol + 1; // 变着层数
        this.other = other;
    }
}

// 棋局着法树类
class Moves {
    constructor() {
        this.rootMove = new Move();
        this.currentMove = this.rootMove;
        this.firstColor = base.RED; // 棋局载入时需要设置此属性！

        this.movCount = -1; //消除根节点
        this.remCount = 0; //注解数量
        this.remLenMax = 0; //注解最大长度

        this.othCol = 0; //存储最大变着层数
        this.maxRow = 0; //存储最大着法深度
        this.maxCol = 0; //存储视图最大列数      
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
            if (move.next_) {
                __addstrl(move.next_);
            }
        }

        let movestrl = [__remarkstr(this.rootMove)];
        if (this.rootMove.next_) {
            __addstrl(this.rootMove.next_);
        } // 驱动调用函数
        //console.log(movestrl);
        return movestrl.join('');
    }

    toLocaleString() {

        function __setchar(move) {
            let firstcol = move.maxCol * 5;
            for (let i = 0; i < 4; i++) {
                //console.log(lineStr[move.stepNo * 2] || `${move.stepNo * 2}`);
                lineStr[move.stepNo * 2][firstcol + i] = move.zhstr[i];
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
        __setchar(this.rootMove);

        let totalstr = `着法深度：${this.maxRow}, 变着广度：${this.othCol}, 视图宽度：${this.maxCol}`;
        let walkstr = lineStr.map(line => line.join('')).join('\n');
        let remstr = remstrs.join('\n');
        return [totalstr, walkstr, remstr].join('\n');
    }

    setMoveSeat(move, chessInstance) {
        //根据中文纵线着法描述取得源、目标位置: (fseat, tseat)
        function __zhcol_col(zhcol) {
            return (isBottomSide ? 9 - base.ChineseToNum[zhcol] : base.ChineseToNum[zhcol] - 1);
        }

        let fseat, tseat;
        let color = this.currentColor,
            zhstr = move.zhstr,
            board = chessInstance.seats;
        let isBottomSide = board.isBottomSide(color);
        let name = zhstr[0];
        if (base.PieceNames.has(name)) {
            let seats = board.getSideNameColSeats(color, name, __zhcol_col(zhstr[1]));
            // assert bool(seats), ('没有找到棋子 => %s color:%s name: %s\n%s' % (zhstr, color, name, this))

            let index = (seats.length == 2 && base.AdvisorBishopNames.has(name)
                && ((zhstr[2] == '退') == isBottomSide)) ? -1 : 0;
            //# 排除：士、象同列时不分前后，以进、退区分棋子
            fseat = seats[index];
        } else {
            //# 未获得棋子, 查找某个排序（前后中一二三四五）某方某个名称棋子
            let index = base.ChineseToNum[zhstr[0]],
                name = zhstr[1];
            let seats = board.getSideNameSeats(color, name);
            // assert len(seats) >= 2, 'color: %s name: %s 棋子列表少于2个! \n%s' % (     color, name, this)

            if (PawnNames.indexOf(name) >= 0) {
                let seats = board.sortPawnSeats(isBottomSide, seats);  //# 获取多兵的列
                if (seats.length > 3) {
                    index -= 1;
                }
            }  //# 修正index
            else if (isBottomSide) {
                seats = seats.reverse();
            }
            fseat = seats[index];
        }

        let movdir = base.ChineseToNum[zhstr[2]] * (isBottomSide ? 1 : -1);
        //# '根据中文行走方向取得棋子的内部数据方向（进：1，退：-1，平：0）'
        let tocol = __zhcol_col(zhstr[3]);
        if (base.LineMovePieceNames.has(name)) {
            //#'获取直线走子toseat'
            let row = Seats.getRow(fseat);
            move.tseat = (movdir == 0) ? Seats.getSeat(row, tocol) : (
                Seats.getSeat(row + movdir * base.ChineseToNum[zhstr[3]],
                    Seats.getCol(fseat)));
        }
        else {
            //#'获取斜线走子：仕、相、马toseat'
            let step = tocol - Seats.getCol(fseat);//  # 相距1或2列            
            let inc = base.AdvisorBishopNames.has(name) ? Math.abs(step) : (
                Math.abs(step) == 1 ? 2 : 1);
            move.tseat = Seats.getSeat(Seats.getRow(fseat) + movdir * inc, tocol);
        }
        move.fseat = fseat
        /*'''
        this.setZhstr(move)
        assert zhstr == move.zhstr, ('棋谱着法: %s   生成着法: %s 不等！' % (
                zhstr, move.zhstr))
        '''  
        */
    }

    setZhstr(move, chessInstance) {
        '根据源、目标位置: (fseat, tseat)取得中文纵线着法描述'
        function __col_chcol(color, col) {
            return NumToChinese[color][isBottomSide ? 9 - col : col + 1];
        }

        let fseat = move.fseat,
            tseat = move.tseat,
            board = chessInstance.board;
        let frompiece = board.getPiece(fseat);
        let color = frompiece.color,
            name = frompiece.name;
        let isBottomSide = chessInstance.isBottomSide(color);
        let fromrow = Seats.getRow(fseat),
            fromcol = Seats.getCol(fseat);
        let seats = board.getSideNameColSeats(color, name, fromcol);
        let length = seats.length;
        let firstStr, lastStr;
        if (length > 1 && StrongePieceNames.indexOf(name) >= 0) {
            if (PawnNames.indexOf(name) >= 0) {
                seats = board.sortPawnSeats(isBottomSide,
                    board.getSideNameSeats(color, name));
                length = seats.length;
            }
            else if (isBottomSide) {  //# '车', '马', '炮'
                seats = seats.reverse();
            }
            let indexstr = length in [2, 3] ? { 2: '前后', 3: '前中后' }[length] : '一二三四五';
            firstStr = indexstr[seats.indexOf(fseat)] + name;
        }
        else {
            //#仕(士)和相(象)不用“前”和“后”区别，因为能退的一定在前，能进的一定在后
            firstStr = name + __col_chcol(color, fromcol);
        }

        let torow = Seats.getRow(tseat),
            tocol = Seats.getCol(tseat);
        let chcol = __col_chcol(color, tocol);
        let tochar = torow == fromrow ? '平' : (isBottomSide == (torow > fromrow) ? '进' : '退')
        let tochcol = (torow == fromrow || base.LineMovePieceNames.has(name) ? chcol :
            base.NumToChinese[color][abs(torow - fromrow)]);
        lastStr = tochar + tochcol;
        move.zhstr = firstStr + lastStr;
        /*'''
        this.setMoveSeat(move) # 不能成功断言，可能与curcolor值有关？2018.4.26
        assert (fseat, tseat) == (move.fseat, move.tseat), ('棋谱着法: %s   生成着法: %s 不等！' % ((fseat, tseat), (move.fseat, move.tseat)))
        '''*/
    }

    readMove_bin(move) {
        hasothernextrem, fi, ti = movestruct1.unpack(fileobj.read(3));
        move.fseat, move.tseat = fi, ti;
        if (hasothernextrem & 0x20) {
            rlength = movestruct2.unpack(fileobj.read(2))[0];
            move.remark = fileobj.read(rlength).decode();
        }
        this.setCounts(move);// # 设置内部计数值
        if (hasothernextrem & 0x80) {
            move.setOther(Move(move.prev));
            __readMove(move.other);
        }
        if (hasothernextrem & 0x40) {
            move.setNext(Move(move));
            __readMove(move.next_);
        }
    }

    initMoveInfo(chessInstance, seated = false) {
        //'根据board设置树节点的zhstr或seat'
        let __set = (move) => {
            if (seated) {
                this.setZhstr(move, chessInstance);
            } else {
                this.setMoveSeat(move, chessInstance);
            }
            move.maxCol = this.maxCol; // # 本着在视图中的列数
            this.othCol = Math.max(this.othCol, move.othCol);
            this.maxRow = Math.max(this.maxRow, move.stepNo);
            this.__to(move, chessInstance);
            if (move.next_) {
                __set(move.next_);
            }
            this.__to(move.prev, chessInstance);
            if (move.other) {
                this.maxCol += 1;
                __set(move.other);
            }
        }

        this.othCol = 0; //# 存储最大变着层数
        this.maxRow = 0; //# 存储最大着法深度
        this.maxCol = 0; //# 存储视图最大列数
        if (this.rootMove.next_ != null) { //# and this.movcount < 300: # 步数太多则太慢             
            __set(this.rootMove.next_);
        } // # 驱动调用递归函数            
    }

    readMove_ICCSzh(moveStr, fmt, chessInstance) {
        let __readMoves = (move, mvstr, isOther) => {  //# 非递归 
            let lastMove = move;               
            let isFirst = true;
            let mstr, remark, mstr_remark;
            while ((mstr_remark = moverg.exec(mvstr)) != null) {
                [mstr, remark] = mstr_remark.slice(1);
                let newMove = new Move(isOther ? lastMove.prev : lastMove);
                if (fmt == 'ICCS') {
                    newMove.setSeat_ICCS(mstr);
                } else {  //if (fmt == 'zh')
                    newMove.zhstr = mstr;
                }
                if (remark) {
                    newMove.remark = remark;
                }
                chessInstance.setCounts(newMove); // # 设置内部计数值
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
        chessInstance.setCounts(this.rootMove); // # 设置内部计数值
        let thisMove, leftStr, index;
        let othMoves = [this.rootMove];
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
        this.initMoveInfo(chessInstance);
    }

    readMove_cc(moveStr, chessInstance) {

        let __readMove = (move, row, col, isOther = False) => {
            let zhstr = moves[row][col].match(moverg);
            if (zhstr) {
                let newMove = new Move(isOther ? move.prev : move);
                newMove.stepNo = row;
                newMove.zhstr = zhstr[0].slice(0, 4);
                newMove.remark = rems[`(${row}, ${col})`] || '';
                chessInstance.setCounts(newMove); // # 设置内部计数值
                if (isOther) {
                    move.setOther(newMove);
                } else {
                    move.setNext(newMove);
                }
                if (zhstr[0][4] == '…') {
                    __readMove(newMove, row, col + 1, True);
                }
            } else if (isOther) {
                while (moves[row][col][0] == '…') {
                    col += 1;
                }
                __readMove(move, row, col, True);
            }
            if (zhstr && row < moves.length - 1 && moves[row + 1]) {
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
            this.rootMove.remark = rems['(0, 0)'] || '';
        }
        chessInstance.setCounts(this.rootMove); // # 设置内部计数值
        if (moves.length > 1) {
            __readMove(this.rootMove, 1, 0);
        }
        this.initMoveInfo(chessInstance);
    }

    get currentColor() {
        return this.currentMove.stepNo % 2 == 0 ? this.firstColor : (
            c => c == base.RED ? base.BLACK : base.RED)(this.firstColor);
    }

    get isStart() {
        return this.currentMove === this.rootMove;
    }

    get isLast() {
        return this.currentMove.next_ === null;
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

    __to(move, chessInstance) {
        move.eatPiece = chessInstance.seats.__go(move);
        this.currentMove = move;
    }

    go(chessInstance) {
        if (this.currentMove.next_) {
            this.__to(this.currentMove.next_, chessInstance);
        }
    }

    back(chessInstance) {
        if (this.currentMove.prev) {
            this.__to(this.currentMove.prev, chessInstance);
        }
    }

    goOther(chessInstance) {
        //'移动到当前节点的另一变着'
        if (this.currentMove.other) {
            let toMove = this.currentMove.other;
            this.back();
            this.__to(toMove, chessInstance);
        }
    }

    toFirst(chessInstance) {
        while (this.currentMove !== this.rootMove) {
            this.back(chessInstance);
        }
    }

    toLast(chessInstance) {
        while (this.currentMove.next_) {
            this.go(chessInstance);
        }
    }

    toStep(chessInstance, inc = 1) {
        let go = inc > 0;
        inc = abs(inc);
        for (let i = 0; i < inc; i++) {
            if (go) this.go(chessInstance);
            else this.back(chessInstance);
        }
    }

    goTo(move, chessInstance) {
        if (move === this.currentMove) return;
        this.toFirst(chessInstance);
        this.getPrevMoves(move).forEach(m => this.__to(m, chessInstance));
    }

    addMove(moveData, chessInstance, isOther = false) {
        let move = new Move(isOther ? this.currentMove.prev : this.currentMove);
        [move.fseat, move.tseat, move.remark] = moveData; // 调用参数同此规格
        chessInstance.setZhstr(move);
        if (isOther) {
            this.currentMove.setOther(move);
            this.goOther();
        } else {
            this.currentMove.setNext(move);
            this.go(chessInstance);
        }
    }

    cutNext() {
        this.currentMove.next_ = null;
    }

    cutOther() {
        if (this.currentMove.other) this.currentMove.other = this.currentMove.other.other;
    }

}


