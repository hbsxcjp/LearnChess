// 中国象棋着法树节点类型 by-cjp

import * as base from './base.js';
import { Board } from './board.js';
export { Moves };


// 着法节点类
class Move {
    constructor() {
        this.fseat = 0;
        this.tseat = 0;
        this.remark = '';
        this.zhStr = '';
        this.next_ = null;
        this.other = null;

        // 以下信息存储时不需保存
        this.prev = null;
        this.stepNo = 0; // 着法深度
        this.othCol = 0; // 变着广度
        this.maxCol = 0; // 图中列位置（需结合board确定）
    }

    toJSON() {
        let __replace = (str) => {
            str = str.replace(/\n/gm, "\\n");  //注意php中替换的时候只能用双引号"\n"
            str = str.replace(/\r/gm, "\\r");
            //str = str.replace(">", "&gt;");  
            //str = str.replace("<", "&lt;");  
            //str = str.replace(" ", "&nbsp;");  
            //str = str.replace("\"", "&quot;");  
            //str = str.replace("\'", "&#39;");  
            //str = str.replace("\\", "\\\\");//对斜线的转义
            //console.log(str);
            return str;
        }

        let temp = [];
        for (let name in this) {
            let value;
            if ((name === 'other' || name === 'next_') && this[name]) {
                value = this[name].toJSON();
            } else if (name === 'remark' && this[name]) {
                value = `"${__replace(this[name])}"`;
            } else if (name === 'fseat' || name === 'tseat') {
                value = this[name];
            }
            if (value !== undefined) {
                temp.push(`"${name}":${value}`);
            }
        }
        //console.log(temp.join(','));
        return temp.length > 0 ? `{${temp.join(',')}}` : "";

        //return `{"fseat":${this.fseat},"tseat":${this.tseat},"remark":"${__replace(this.remark)}","zhStr":"${this.zhStr}","other":${this.other && this.other.toJSON()},"next_":${this.next_ && this.next_.toJSON()}}`;
    }

    toString() {
        return `{"stepNo":${this.stepNo},"othCol":${this.othCol},"maxCol":${this.maxCol},"fseat":${this.fseat},"tseat":${this.tseat},"zhStr":"${this.zhStr}","remark":"${this.remark}"}`;
    }

    getStr(fmt) {
        switch (fmt) {
            case 'ICCS':
                return this.stepNo === 0 ? '' : `${ColChars[Board.getCol(this.fseat)]}${Board.getRow(this.fseat)}${ColChars[Board.getCol(this.tseat)]}${Board.getRow(this.tseat)}`;
            case 'zh':
                return this.zhStr;
            default: // 留待以后添加其他的描述格式
                return this.zhStr;
        }
    }

    setNext(next_) {
        next_.stepNo = this.stepNo + 1;
        next_.othCol = this.othCol; // 变着层数
        next_.prev = this;
        this.next_ = next_;
    }

    setOther(other) {
        other.stepNo = this.stepNo; // 与premove的步数相同
        other.othCol = this.othCol + 1; // 变着层数
        other.prev = this.prev;
        this.other = other;
    }

    setSeatFromICCS(board) {
        let [fcol, frow, tcol, trow] = [...this.zhStr]; // ...展开运算符
        this.fseat = Board.getSeat(Number(frow), ColChars[fcol]);
        this.tseat = Board.getSeat(Number(trow), ColChars[tcol]);
    }

    //根据中文纵线着法描述取得源、目标位置: (fseat, tseat)
    setSeatFromZhStr(board) {
        let __getNum = (char) => base.Num_Chinese[color].indexOf(char) + 1;
        let __getCol = (num) => isBottomSide ? 9 - num : num - 1;

        let fseat, seats, index,
            zhStr = this.zhStr,
            // 根据最后一个字符判断该着法属于哪一方
            color = base.Num_Chinese[base.RED].indexOf(zhStr[zhStr.length - 1]) >= 0 ? base.RED : base.BLACK,
            isBottomSide = board.isBottomSide(color),
            name = zhStr[0];
        if (base.PieceNames.has(name)) {
            seats = board.getSideNameColSeats(color, name, __getCol(__getNum(zhStr[1])));
            //# 排除：士、象同列时不分前后，以进、退区分棋子
            index = (seats.length === 2 && base.AdvisorBishopNames.has(name)
                && ((zhStr[2] === '退') === isBottomSide)) ? seats.length - 1 : 0;
        } else {
            //# 未获得棋子, 查找某个排序（前后中一二三四五）某方某个名称棋子
            index = base.Chinese_Index[zhStr[0]];
            name = zhStr[1];
            seats = board.getSideNameSeats(color, name);
            if (base.PawnNames.has(name)) {
                seats = Board.sortPawnSeats(isBottomSide, seats);  //# 获取多兵的列                    
                if (seats.length === 3 && zhStr[0] === '后')
                    index += 1;
            } else {
                seats = board.getSideNameSeats(color, name);
                if (seats.length < 2) {
                    console.log(`棋子列表少于2个 => ${zhStr} color:${color} name: ${name}\n${this}`);
                }
                if (isBottomSide) { //# 修正index
                    seats.reverse();
                }
            }
        }
        //if (seats.length === 0) console.log(`没有找到棋子 => ${zhStr} color:${color} name: ${name}\n${board}`);
        this.fseat = fseat = seats[index];

        // '根据中文行走方向取得棋子的内部数据方向（进：1，退：-1，平：0）'
        let movDir = base.Direction_Num[zhStr[2]] * (isBottomSide ? 1 : -1);
        let num = __getNum(zhStr[3])
        let toCol = __getCol(num);
        if (base.LineMovePieceNames.has(name)) {
            //#'获取直线走子toseat'
            let row = Board.getRow(fseat);
            this.tseat = (movDir === 0) ? Board.getSeat(row, toCol) : (
                Board.getSeat(row + movDir * num, Board.getCol(fseat)));
        } else {
            //#'获取斜线走子：仕、相、马toseat'
            let step = Math.abs(toCol - Board.getCol(fseat));//  # 相距1或2列            
            let inc = base.AdvisorBishopNames.has(name) ? step : (step === 1 ? 2 : 1);
            this.tseat = Board.getSeat(Board.getRow(fseat) + movDir * inc, toCol);
            //console.log(this.tseat);
        }
        // 断言已通过
        //this.setZhStr(board);
        //if (zhStr != this.zhStr)
        //    console.log(board.toString(), zhStr, '=>', this.fseat, this.tseat, '=>', this.zhStr);
    }

    setICCS() {
        let fcol = ColChars.indexOf(Board.getCol(this.fseat)),
            frow = Board.getRow(this.fseat),
            tcol = ColChars.indexOf(Board.getCol(this.tseat)),
            trow = Board.getRow(this.tseat);
        this.zhStr = `${fcol}${frow}${tcol}${trow}`;
    }

    // 根据源、目标位置: (fseat, tseat)取得中文纵线着法描述
    setZhStr(board) {
        function __getChar(color, col) {
            return base.Num_Chinese[color][isBottomSide ? 8 - col : col];
        }

        let firstStr;
        let fseat = this.fseat,
            tseat = this.tseat,
            fromPiece = board.getPiece(fseat),
            //console.log(fromPiece);
            color = fromPiece.color,
            name = fromPiece.name,
            isBottomSide = board.isBottomSide(color),
            fromRow = Board.getRow(fseat),
            fromCol = Board.getCol(fseat),
            seats = board.getSideNameColSeats(color, name, fromCol),
            length = seats.length;
        if (length > 1 && base.StrongeNames.has(name)) {
            if (base.PawnNames.has(name)) {
                seats = Board.sortPawnSeats(isBottomSide,
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
            firstStr = name + __getChar(color, fromCol);
        }

        let toRow = Board.getRow(tseat),
            toCol = Board.getCol(tseat),
            zhCol = __getChar(color, toCol),
            toChar = toRow === fromRow ? '平' : (isBottomSide === (toRow > fromRow) ? '进' : '退'),
            toZhCol = (toRow === fromRow || !base.LineMovePieceNames.has(name)) ? zhCol : (
                base.Num_Chinese[color][Math.abs(toRow - fromRow) - 1]);
        this.zhStr = firstStr + toChar + toZhCol;
        // 断言已通过
        //this.setSeatFromZhStr(board);
        //if (fseat != this.fseat || tseat != this.tseat)
        //    console.log(board.toString(), fseat, tseat, '=>', this.zhStr, '=>', this.fseat, this.tseat);
    }

    // （rootMove）调用, 设置树节点的seat or zhStr'
    initSet(setFunc, board) {
        let __set = (move) => {
            setFunc.call(move, board);
            board.__go(move);
            if (move.next_)
                __set(move.next_);
            board.__back(move);
            if (move.other)
                __set(move.other);
        }

        if (this.next_)
            __set(this.next_); // 驱动函数
    }

    fromJSON(moveJSON) {
        let __setMove = (move, moveData) => {
            Object.assign(move, moveData);
            if (move.other) {
                move.setOther(new Move());
                __setMove(move.other, moveData.other);
            }
            if (move.next_) {
                move.setNext(new Move());
                __setMove(move.next_, moveData.next_);
            }
        }

        try {
            __setMove(this, JSON.parse(JSON.parse(moveJSON)));  // 多次试验，不知为何需要两次解析？
        }
        catch (e) {
            console.log(e, JSON.parse(moveJSON));
        }
    }

    // （rootMove）调用
    fromICCSZh(moveStr, board) {
        let __setMoves = (move, mvstr, isOther) => {  //# 非递归 
            let lastMove = move;
            let isFirst = true;
            let mstr_remark;
            while ((mstr_remark = moverg.exec(mvstr)) != null) {
                let newMove = new Move();
                newMove.zhStr = mstr_remark[1];
                newMove.remark = mstr_remark[2] ? mstr_remark[2] : '';
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

        //console.log(moveStr);
        //let moverg = / ([\u4E00-\u9FA5]{4})(?:\s+\{([\s\S]*?)\})?/ugm; // 第一届“嘉宝杯”粤沪象棋对抗赛 - 上海胡荣华 (先和) 广东吕钦： 出现“审形度势”的错误！
        let moverg = / ([^\.\{\}\s/-]{4})(?:\s+\{([\s\S]*?)\})?/gm; // 插入:(?= )
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
                othMoves.push(__setMoves(thisMove, leftStrs.shift(), isOther));
                isOther = true;
            } else {
                leftStr = leftStrs[0].slice(0, index);
                leftStrs[0] = leftStrs[0].slice(index + 2);
                __setMoves(thisMove, leftStr, isOther);
                isOther = false;
            }
        }
    }

    fromCC(moveStr, board) {

        let __setMove = (move, row, col, isOther = false) => {
            let zhStr = moves[row][col].match(moverg),
                newMove = new Move();
            if (zhStr) {
                newMove.stepNo = row + 1;
                newMove.zhStr = zhStr[1];
                newMove.remark = '' || rems.get(`(${row + 1}, ${col})`);
                if (isOther) {
                    move.setOther(newMove);
                } else {
                    move.setNext(newMove);
                }
                if (moves[row][col][4] === '…') {
                    __setMove(newMove, row, col + 1, true);
                }
            } else if (isOther) {
                while (moves[row][col][0] === '…') {
                    col += 1;
                }
                __setMove(move, row, col, true);
            }
            if (zhStr && row < moves.length - 1 && moves[row + 1]) {
                __setMove(newMove, row + 1, col);
            }
        }

        let remStr;
        [moveStr, remStr] = base.partition(moveStr, /\n\(/);
        let moves = [],
            rems = new Map(),
            mstrrg = /.{5}/gm,
            moverg = /([^…　]{4})[…　]/;
        if (moveStr) {
            let lineStr = moveStr.split(/\n/gm);
            for (let i = 2; i < lineStr.length; i += 2) {
                moves.push(lineStr[i].match(mstrrg));
            }
        }
        if (remStr) {
            let rc_remark,
                remrg = /\(\s*(\d+),\s*(\d+)\): \{([\s\S]*?)\}/gm;
            while ((rc_remark = remrg.exec(remStr)) != null) {
                rems.set(`(${rc_remark[1]}, ${rc_remark[2]})`, rc_remark[3]);
            }
            this.remark = '' || rems.get('(0, 0)');
        }
        if (moves.length > 1) {
            __setMove(this, 0, 0);
        }
    }
}

// 棋局着法树类
class Moves {
    constructor() {
        this.__init();
    }

    __init() {
        this.rootMove = new Move();
        this.currentMove = this.rootMove;
        this.firstColor = base.RED; // 棋局载入时需要设置此属性！

        this.movCount = 0; //着法数量
        this.remCount = 0; //注解数量
        this.remLenMax = 0; //注解最大长度
        this.othCol = 0; //# 存储最大变着层数
        this.maxRow = 0; //# 存储最大着法深度
        this.maxCol = 0; //# 存储视图最大列数
    }

    toString() {
        let __remarkstr = (move) => !move.remark ? '' : `\n{${move.remark}}\n`;

        let __addstrl = (move, isOther = false) => {
            let boutNum = Math.floor((move.stepNo + 1) / 2);
            let isEven = move.stepNo % 2 === 0;
            let preStr = isOther ? `(${boutNum}. ${isEven ? '... ' : ''}` : (isEven ? ' ' : `${boutNum}. `);
            movestrl.push(`${preStr}${move.getStr('zh')} ${__remarkstr(move)}`);
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
        this.rootMove.zhStr = '1.开始';
        __setchar(this.rootMove);

        let totalstr = `\n着法深度：${this.maxRow}, 变着广度：${this.othCol}, 视图宽度：${this.maxCol}
着法数量：${this.movCount}, 注解数量：${this.remCount}, 注解最长：${this.remLenMax}\n`;
        let walkstr = lineStr.map(line => line.join('')).join('\n');
        let remstr = remstrs.join('\n');
        return [totalstr, walkstr, remstr].join('\n');
    }

    initNums(board) {
        let setNums = (move) => {
            this.movCount += 1;
            if (move.remark) {
                this.remCount += 1;
                this.remLenMax = Math.max(this.remLenMax, move.remark.length);
            }
            move.maxCol = this.maxCol; // # 本着在视图中的列数
            this.othCol = Math.max(this.othCol, move.othCol);
            this.maxRow = Math.max(this.maxRow, move.stepNo);
            board.__go(move);
            if (move.next_) {
                setNums(move.next_);
            }
            board.__back(move);
            if (move.other) {
                this.maxCol += 1;
                setNums(move.other);
            }
        }

        if (this.rootMove.next_)
            setNums(this.rootMove.next_);
        // # 驱动调用递归函数
    }

    setFrom(moveStr, board, fmt = 'zh') {
        this.__init();
        let setFunc;
        switch (fmt) {
            case 'JSON': {
                this.rootMove.fromJSON(moveStr, board);
                this.rootMove.initSet(this.rootMove.setZhStr, board);
                break;
            }
            default: {
                if (fmt === 'cc') {
                    this.rootMove.fromCC(moveStr, board);
                } else {
                    this.rootMove.fromICCSZh(moveStr, board);
                }
                if (fmt === 'ICCS') {
                    this.rootMove.initSet(this.rootMove.setSeatFromICCS, board);
                } else {
                    this.rootMove.initSet(this.rootMove.setSeatFromZhStr, board);
                }
            }
        }
        this.initNums(board);
    }

    get currentColor() {
        return this.currentMove.stepNo % 2 === 0 ? this.firstColor : (
            c => c === base.RED ? base.BLACK : base.RED)(this.firstColor);
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

    // 基本走法
    forward(board) {
        if (this.currentMove.next_) {
            this.currentMove = this.currentMove.next_;
            board.__go(this.currentMove);
        }
    }

    // 基本走法
    back(board) {
        if (this.currentMove.prev) {
            board.__back(this.currentMove);
            this.currentMove = this.currentMove.prev;
        }
    }

    // 基本走法
    forwardOther(board) {
        //'移动到当前节点的另一变着'
        if (this.currentMove.other) {
            let toMove = this.currentMove.other;
            this.back(board);
            board.__go(toMove);
            this.currentMove = toMove;
        }
    }

    // 复合走法
    to(move, board) {
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
        while (this.currentMove.next_) {
            this.forward(board);
        }
    }

    // 复合走法
    go(board, inc = 1) {
        let forward = inc > 0;
        inc = abs(inc);
        for (let i = 0; i < inc; i++) {
            if (forward) this.forward(board);
            else this.back(board);
        }
    }

    // 添加着法，复合走法
    addMove(fseat, tseat, remark, board, isOther = false) {
        let move = new Move();
        [move.fseat, move.tseat, move.remark] = [fseat, tseat, remark]; // 调用参数同此规格
        move.setZhStr(board);
        if (isOther) {
            this.currentMove.setOther(move);
            this.forwardOther(board);
        } else {
            this.currentMove.setNext(move);
            this.forward(board);
        }
    }

    cutNext() {
        this.currentMove.next_ = null;
    }

    cutOther() {
        if (this.currentMove.other) this.currentMove.other = this.currentMove.other.other;
    }

}

