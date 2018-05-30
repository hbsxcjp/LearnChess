// 中国象棋棋盘布局类型 by-cjp

import {blankBoard, View, multRepl, xmlIndent} from './base.js';
import {BLACK, RED, CharNames, Pieces} from './piece.js';

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
            linestr[(9-this.getRow(seat))*2][this.getCol(seat) * 2] = __getname(piece);
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
        return [this.__infostr(), str(this), totalstr, walkstr, remstr].join('\n');
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
   
    isBottomSide(color){
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

    getLivePieces(){
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

    getEatedPieces(){
        let livePieces = new Set(this.getLivePieces());
        return this.pieces.pies.filter(p => !livePieces.has(p));
    }

    iskilled(color){
        let othercolor = color == RED? RED :BLACK;
        let kingseat = this.getKingSeat(color);
        let otherseat = this.getkingseat(othercolor);
        if (this.issamecol(kingseat, otherseat)){  // 将帅是否对面
            if (every(getsamecolseats(kingseat, otherseat).filter(s => this.isblank(seat)))){
                return true;
            }
        for (let piece of this.getlivesidepieces(othercolor)){
            if (piece.isStronge && (kingseat in piece.getmvseats(this))){
                return true;
            }
        }
        return false
        }
    }

    canmvseats(fseat){    //    '获取棋子可走的位置, 不能被将军'
        let result = [];
        let piece = this.getpiece(fseat);
        let color = piece.color;
        for (let tseat of piece.getmvseats(this)){
            let topiece = this.__go(fseat, tseat);
            if (!this.iskilled(color)){
                result.push(tseat);
            }
            this.__back(fseat, tseat, topiece);
        }
        return result
    }
        
    isdied(color){
        for (let piece of this.getlivesidepieces(color)){
            if (this.canmvseats(this.getseat(piece))){
                return False;
            }
        }
        return True
    }

    __sortpawnseats(isbottomside, pawnseats){   //     '多兵排序'
        let result = [];
        let pawnseatdict = new Map(pawnseats.map(s => [this.getCol(s), []]));
        for (let seat of pawnseats){
            pawnseatdict[this.getCol(seat)].push(seat);
        }  // 列内排序
        let pawnseatarray = [...pawnseatdict].filter(([c, s]) => s.length > 1);
        pawnseatarray = pawnseatarray.sort((a, b) => a[0] - b[0]);
        for (let {col, seats} of pawnseatarray.entries()){
                result.concat(seats);
        }  // 按列排序
        return isbottomside? result.reverse(): result;
    }
    

    setmvseat(move){
        //根据中文纵线着法描述取得源、目标位置: (fseat, tseat)
        function __zhcol_col(zhcol){
            return (isbottomside? NumCols - ChineseToNum[zhcol]: ChineseToNum[zhcol] - 1);
        }

        let color = this.curcolor, 
            zhstr = move.zhstr;
        let isbottomside = this.isbottomside(color);
        let name = zhstr[0];
        if (name in CharNames.values()){
            let seats = this.getsidenamecolseats(color, name, __zhcol_col(zhstr[1]));
            // assert bool(seats), ('没有找到棋子 => %s color:%s name: %s\n%s' % (zhstr, color, name, this))

            let index = (seats.length == 2 && AdvisorBishopNames.indexof(name) >= 0
                            && ((zhstr[2] == '退') == isbottomside))? -1 : 0;
            //# 排除：士、象同列时不分前后，以进、退区分棋子
            move.fseat = seats[index];
        } else {
            //# 未获得棋子, 查找某个排序（前后中一二三四五）某方某个名称棋子
            let index = ChineseToNum[zhstr[0]], 
                name = zhstr[1];
            let seats = this.getsidenameseats(color, name);
            // assert len(seats) >= 2, 'color: %s name: %s 棋子列表少于2个! \n%s' % (     color, name, this)
            
            if (PawnNames.indexof(name) >= 0){
                let seats = this.__sortpawnseats(isbottomside, seats);  //# 获取多兵的列
                if (seats.length > 3){
                    index -= 1;
                }
            }  //# 修正index
            else if (isbottomside){
                seats = seats.reverse();
            }
            move.fseat = seats[index];
        }

        let movdir = ChineseToNum[zhstr[2]] * (isbottomside? 1 : -1);
        //# '根据中文行走方向取得棋子的内部数据方向（进：1，退：-1，平：0）'
        let tocol = __zhcol_col(zhstr[3]);
        if (LineMovePieceNames.indexof(name) >= 0){
            //#'获取直线走子toseat'
            let row = this.getrow(fseat);
            move.tseat = (movdir == 0)? this.getseat(row, tocol) : (
                            this.getseat(row + movdir * ChineseToNum[zhstr[3]],
                                this.getcol(fseat)));
        }        
        else {
            //#'获取斜线走子：仕、相、马toseat'
            let step = tocol - this.getcol(fseat);//  # 相距1或2列            
            let inc = (AdvisorBishopNames.indexof(name) >= 0)? abs(step) : (
                        abs(step) == 1? 2 : 1);
            move.tseat = this.getseat(this.getrow(fseat) + movdir * inc, tocol);
        }
        //move.fseat = fseat
        /*'''
        this.setzhstr(move)
        assert zhstr == move.zhstr, ('棋谱着法: %s   生成着法: %s 不等！' % (
                zhstr, move.zhstr))
        '''  
        */      
        }

    setzhstr(move){
        '根据源、目标位置: (fseat, tseat)取得中文纵线着法描述'
        function __col_chcol(color, col){
            return NumToChinese[color][isbottomside? NumCols - col : col + 1];
        }

        let fseat = move.fseat, 
            tseat = move.tseat;
        let frompiece = this.getpiece(fseat);
        let color = frompiece.color, 
            name = frompiece.name;
        let isbottomside = this.isbottomside(color);
        let fromrow = this.getrow(fseat), 
            fromcol = this.getcol(fseat);
        let seats = this.getsidenamecolseats(color, name, fromcol);
        let length = seats.length;
        let firstStr, lastStr;
        if (length > 1 && StrongePieceNames.indexof(name) >= 0){
            if (PawnNames.indexof(name) >= 0){
                seats = this.__sortpawnseats(isbottomside,
                    this.getsidenameseats(color, name));
                length = len(seats);
            }
            else if (isbottomside){  //# '车', '马', '炮'
                seats = seats.reverse();
            }
            let indexstr = length in [2, 3]? {2: '前后', 3: '前中后'}[length] : '一二三四五';
            firstStr = indexstr[seats.indexof(fseat)] + name;
        }
        else {
            //#仕(士)和相(象)不用“前”和“后”区别，因为能退的一定在前，能进的一定在后
            firstStr = name + __col_chcol(color, fromcol);
        }

        let torow = this.getrow(tseat), 
            tocol = this.getcol(tseat);
        let chcol = __col_chcol(color, tocol);
        let tochar = torow == fromrow? '平' : (isbottomside == (torow > fromrow)? '进' : '退')
        let tochcol = ((torow == fromrow || LineMovePieceNames.indexof(name) < 0)? chcol :
                   NumToChinese[color][abs(torow - fromrow)]);
        lastStr = tochar + tochcol;
        move.zhstr = firstStr + lastStr;
        /*'''
        this.setmvseat(move) # 不能成功断言，可能与curcolor值有关？2018.4.26
        assert (fseat, tseat) == (move.fseat, move.tseat), ('棋谱着法: %s   生成着法: %s 不等！' % ((fseat, tseat), (move.fseat, move.tseat)))
        '''*/
    }
            
    get curcolor(){
        return this.curmove.stepno % 2 == 0? this.firstcolor: (
            c => c == RED? BLACK : RED)(this.firstcolor);
    }

    get isstart(){
        return this.curmove === this.rootmove;
    }     

    get islast(){
        return this.curmove.next_ === null;
    }

    getprevmoves(move=null){
        if (!move) move = this.curmove;
        let result = [move];
        while (move.prev){
            result.push(move.prev)
            move = move.prev;
        }
        return result.reverse();
    }

    __go(fseat, tseat){
        let eatpiece = this.seats[tseat];
        this.seats[tseat] = this.seats[fseat];
        this.seats[fseat] = null;
        return eatpiece;
    }

    __back(fseat, tseat, backpiece){
        this.seats[fseat] = this.seats[tseat];
        this.seats[tseat] = backpiece;
    }
                
    movego(move){
        move.eatpiece = this.__go(move.fseat, move.tseat);
        this.curmove = move;
    }
            
    moveback(){
        this.__back(this.curmove.fseat, this.curmove.tseat, 
                this.curmove.eatpiece);
        this.curmove = this.curmove.prev;
    }

    moveother(){
        //'移动到当前节点的另一变着'
        if (this.curmove.other === null) return ;       
        let tomove = this.curmove.other;   
        this.moveback();
        this.movego(tomove);
        this.notifyviews();
    }

    movefirst(updateview=false){
        let moved = false;
        while (this.curmove !== this.rootmove){
            this.moveback();
            moved = true;
        }
        if (moved && updateview)
            this.notifyviews();
    }
    
    movelast(){
        let moved = false;
        while (this.curmove.next_ !== null){
            this.movego(this.curmove.next_);
            moved = true;
        }
        if (moved)
            this.notifyviews();
    }

    movestep(inc=1){
        let moved = false;
        let go = inc < 0? true : false;
        inc = abs(inc);
        for (let i=0; i<inc; i++){
            if (go){
                if (this.curmove.next_ === null) return ;
                this.movego(this.curmove.next_);
                moved = true;
            }
            else{
                if (this.curmove.prev === null) return ;
                this.moveback();
                moved = true;
            }
        }
        if (moved)
            this.notifyviews();
    }

    movethis(move){
        if (move === this.curmove) return ;
        this.movefirst();
        this.getprevmoves(move).map(mv => this.movego(mv));
        this.notifyviews();
    }

    addmove(fseat, tseat, remark='', isother=false){
        let move = new Move(isother? this.curmove.prev: this.curmove);
        move.fseat = fseat;
        move.tseat = tseat;
        move.remark = remark;
        this.setzhstr(move);
        if (isother){
            this.curmove.setother(move);
            this.moveother();
        }
        else{
            this.curmove.setnext(move);
            this.movestep();
        }
        this.__setmvinfo();
    }

    cutnext(){
        this.curmove.next_ = null;
    }

    cutother(){
        if (this.curmove.other) this.curmove.other = this.curmove.other.other;
    }

    __fen(piecechars=null){
        function __linetonums(){
            //'下划线字符串对应数字字符元组 列表'
            let result = [];
            for (let i=9; i>0; i--){
                result.push(['_'.repeat(i), String(i)]);
            }
            return result;
        }

        if (!piecechars)
            piecechars = this.seats.map(p => piece.char);
        let charls = [];
        for (let rowno=0; rowno<NumRows; rowno++){
            charls.push(piecechars.slice(rowno * NumCols, (rowno + 1) * NumCols));
        }
        let _fen = charls.reverse().map(chars => chars.join('')).join('/');
        for (let [_str, nstr] of __linetonums()){
            _fen = _fen.replace(_str, nstr);
        }
        return _fen;
    }

    __mergefen(_fen, whoplay){
        return `${_fen} ${whoplay? 'b' : 'r'} - - 0 0`;
    }

    getfen(){    
        let assignmove = this.curmove;
        this.movefirst();
        let fen = this.__mergefen(this.__fen(), this.curcolor == BLACK);
        this.movethis(assignmove);
        //assert this.info['FEN'] == fen, '\n原始:{}\n生成:{}'.format(this.info['FEN'], fen)
        return fen;
    }

    __setseatpieces(seatpieces){
        this.seats = new Array(90);
        for (let [seat, piece] of seatpieces.entries()){
            this.seats[seat] = piece;
        }
        this.bottomside = this.getrow(this.getkingseat(RED)) < 3? RED : BLACK;
    }     

    setfen(fen=''){    
        function __numtolines(){
            //'数字字符: 下划线字符串'
            numtolines = {};
            for (let i=0; i<10; i++)
                numtolines[String(i)] = '_'.repeat(i);
            return numtolines;
        }

        function __isvalid(charls){
            '判断棋子列表是否有效'
            if (charls.length != 90)
                return 'len(charls) != 90 棋局的位置个数不等于90，有误！';
            let chars = charls.filter(c => c);
            if (chars.length > 32)
                return 'len(chars) > 32 全部的棋子个数大于32个，有误！';        
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
        let charls = multrepl(fenstr, __numtolines()).split();
        let info = __isvalid(charls);
        if (info) console(info);
        let seatchars = charls.map(([n, char]) => [this.seat(n), char]);
        this.__setseatpieces(this.pieces.seatpieces(seatchars));
        this.firstcolor = afens[1] == 'b'? BLACK : RED;
        this.curmove = this.rootmove;
        this.notifyviews();
    }

    changeside(changetype='exchange'){
        
        function __changeseat(seltransfun):            
            '根据transfun改置每个move的fseat,tseat'
            
            __seat(move):
                move.fseat = transfun(move.fseat)
                move.tseat = transfun(move.tseat)
                if move.next_:
                    __seat(move.next_)
                if move.other:
                    __seat(move.other)
        
            if this.rootmove.next_:
                __seat(this.rootmove.next_) # 驱动调用递归函数
                    
        curmove = this.curmove
        this.movefirst()
        if changetype == 'exchange':
            this.firstcolor = not this.firstcolor
            seatpieces = {this.getseat(piece): this.pieces.getothsidepiece(piece)
                    for piece in this.getlivepieces()}
        else:
            transfun = (this.rotateseat if changetype == 'rotate'
                    else this.symmetryseat)
            __changeseat(transfun)
            seatpieces = {transfun(this.getseat(piece)): piece
                    for piece in this.getlivepieces()}
        this.__setseatpieces(seatpieces)
        if changetype != 'rotate':
            this.__setmvinfo()
        if curmove is not this.rootmove:
            this.movethis(curmove)
        else:
            this.notifyviews()
        }

    __setcounts(move){
        this.movcount += 1
        if move.remark:
            this.remcount += 1
            this.remlenmax = max(this.remlenmax, len(move.remark))
    }

            /*
    __readxqf(filename):    
        
        __tostr(bstr):
            return bstr.decode('GBK', errors='ignore').strip()
            
        __subbyte(a, b):
            return (a - b + 1024) % 256
            
        __readinfo(data):
        
            __calkey(bKey, cKey):
                return (((((bKey*bKey)*3+9)*3+8)*2+1)*3+8) * cKey % 256 # 保持为<256
                
            piechars = 'RNBAKABNRCCPPPPPrnbakabnrccppppp' # QiziXY设定的棋子顺序 
            #this.Signature = data[:2] # 2字节 文件标记 'XQ' = $5158;
            this.info['Version_xqf'] = data[2] # 版本号
            headKeyMask = data[3] # 加密掩码
            #this.ProductId = data[4] # 4字节 产品号(厂商的产品号)
            headKeyOrA = data[5] #
            headKeyOrB = data[6] #
            headKeyOrC = data[7] #
            headKeyOrD = data[8] #
            headKeysSum = data[9] # 加密的钥匙和
            headKeyXY = data[10] # 棋子布局位置钥匙       
            headKeyXYf = data[11] # 棋谱起点钥匙
            headKeyXYt = data[12] # 棋谱终点钥匙
            #// = 16 bytes
            headQiziXY = list(data[13:45]) # 32个棋子的原始位置
            #// 用单字节坐标表示, 将字节变为十进制数, 十位数为X(0-8)个位数为Y(0-9),
            #// 棋盘的左下角为原点(0, 0). 32个棋子的位置从1到32依次为:
            #// 红: 车马相士帅士相马车炮炮兵兵兵兵兵 (位置从右到左, 从下到上)
            #// 黑: 车马象士将士象马车炮炮卒卒卒卒卒 (位置从右到左, 从下到上)        
            #// = 48 bytes
            #this.PlayStepNo = data[45] # 棋谱文件的开始步数
            headWhoPlay = data[46] # 该谁下 0-红先, 1-黑先
            headPlayResult = data[47] # 最终结果 0-未知, 1-红胜 2-黑胜, 3-和棋
            #this.PlayNodes = data[48] # 本棋谱一共记录了多少步
            #this.PTreePos = data[49] # 对弈树在文件中的起始位置
            #this.Reserved1 = data[50:54] # : array [1..4] of dTByte;        
            #// = 64 bytes
            headCodeA = data[54] # 对局类型(开,中,残等)
            #this.CodeB = data[55] # 另外的类型
            #this.CodeC = data[56] #
            #this.CodeD = data[57] #
            #this.CodeE = data[58] #
            #this.CodeF = data[59] #
            #this.CodeH = data[60] #
            #this.CodeG = data[61] #
            #// = 80  bytes
            this.info['Title'] = __tostr(data[62]) # 标题
            #this.TitleB = __tostr(data[63]) #
            #// = 208 bytes
            this.info['Event'] = __tostr(data[64]) # 比赛名称
            this.info['Date'] = __tostr(data[65]) # 比赛时间
            this.info['Site'] = __tostr(data[66]) # 比赛地点
            this.info['Red'] = __tostr(data[67]) # 红方姓名
            this.info['Black'] = __tostr(data[68]) # 黑方姓名
            #// = 336 bytes
            this.info['Opening'] = __tostr(data[69]) # 开局类型
            #this.RedTime = __tostr(data[70]) #
            #this.BlkTime = __tostr(data[71]) #
            #this.Reservedh = __tostr(data[72]) #        
            #// = 464 bytes
            this.info['RMKWriter'] = __tostr(data[73]) # 棋谱评论员
            this.info['Author'] = __tostr(data[74]) # 文件的作者
            
            '''
            if this.Signature != (0x58, 0x51):
                print('文件标记不对。xqfinfo.Signature != (0x58, 0x51)')
            if (headKeysSum + headKeyXY + headKeyXYf + headKeyXYt) % 256 != 0:
                print('检查密码校验和不对，不等于0。')
            if this.info['Version_xqf'] > 18: 
                print('这是一个高版本的XQF文件，您需要更高版本的XQStudio来读取这个文件')
            '''            
            if this.info['Version_xqf'] <= 10: # 兼容1.0以前的版本
                KeyXY = 0
                KeyXYf = 0
                KeyXYt = 0
                KeyRMKSize = 0
            else:
                KeyXY = __calkey(headKeyXY, headKeyXY)
                KeyXYf = __calkey(headKeyXYf, KeyXY)
                KeyXYt = __calkey(headKeyXYt, KeyXYf)
                KeyRMKSize = ((headKeysSum * 256 + headKeyXY) % 65536 % 32000) + 767
                if this.info['Version_xqf'] >= 12: # 棋子位置循环移动
                    for i, xy in enumerate(headQiziXY[:]):
                        headQiziXY[(i + KeyXY + 1) % 32] = xy
                for i in range(32): # 棋子位置解密           
                    headQiziXY[i] = __subbyte(headQiziXY[i], KeyXY)
                    # 保持为8位无符号整数，<256
                    
            KeyBytes = [(headKeysSum & headKeyMask) | headKeyOrA,
                        (headKeyXY & headKeyMask) | headKeyOrB,
                        (headKeyXYf & headKeyMask) | headKeyOrC,
                        (headKeyXYt & headKeyMask) | headKeyOrD]
            F32Keys = [ord(c) & KeyBytes[i % 4]
                        for i, c in enumerate('[(C) Copyright Mr. Dong Shiwei.]')]
                        
            piecechars = ['_'] * 90
            for i, xy in enumerate(headQiziXY):
                if xy < 90:
                    piecechars[xy%10*9 + xy//10] = piechars[i]
                    # 用单字节坐标表示, 将字节变为十进制数, 
                    # 十位数为X(0-8),个位数为Y(0-9),棋盘的左下角为原点(0, 0)
            this.info['FEN'] = this.__mergefen(
                    this.__fen(piecechars), headWhoPlay)
            
            this.info['PlayType'] = {0: '全局', 1: '开局', 2: '中局', 3: '残局'}[headCodeA]
            this.info['Result'] = {0: '未知', 1: '红胜',
                    2: '黑胜', 3: '和棋'}[headPlayResult]            
            return (KeyXYf, KeyXYt, KeyRMKSize, F32Keys)            

        __readmove(move):
            '递归添加着法节点'
            
            __strstruct(size):
                return struct.Struct('{}s'.format(size))                        
                    
            __bytetoseat(a, b):
                xy = __subbyte(a, b)
                return this.getseat(xy % 10, xy // 10) #(xy % 10, xy // 10)
                    
            __readbytes(size):
                pos = fileobj.tell()
                bytestr = fileobj.read(size)                
                if this.info['Version_xqf'] <= 10:
                    return bytestr 
                else: # '字节串解密'
                    barr = bytearray(len(bytestr))  # 字节数组才能赋值，字节串不能赋值
                    for i, b in enumerate(bytestr):
                        barr[i] = __subbyte(int(b), F32Keys[(pos + i) % 32])
                    return barr
                    
            __readremarksize():
                bytestr = __readbytes(4)
                return movestruct2.unpack(bytestr)[0] - KeyRMKSize
                
            data = movestruct1.unpack(__readbytes(4))
            # 一步棋的起点和终点有简单的加密计算，读入时需要还原
            move.fseat = __bytetoseat(data[0], 0X18 + KeyXYf) # 一步棋的起点
            move.tseat = __bytetoseat(data[1], 0X20 + KeyXYt) # 一步棋的终点
            ChildTag = data[2]
            
            RemarkSize = 0
            if this.info['Version_xqf'] <= 0x0A:
                b = 0
                if (ChildTag & 0xF0) != 0: 
                    b = b | 0x80
                if (ChildTag & 0x0F) != 0: 
                    b = b | 0x40
                ChildTag = b
                RemarkSize = __readremarksize()
            else:
                ChildTag = ChildTag & 0xE0
                if (ChildTag & 0x20) != 0:                        
                    RemarkSize = __readremarksize()
                    
            if RemarkSize > 0: # 如果有注解
                bytestr = __readbytes(RemarkSize)
                remark = __tostr(__strstruct(RemarkSize).unpack(bytestr)[0])
                if remark:
                    move.remark = remark
            this.__setcounts(move) # 设置内部计数值
            
            if (ChildTag & 0x80) != 0: # 有左子树
                move.setnext(Move(move))
                __readmove(move.next_)
            if (ChildTag & 0x40) != 0: # 有右子树
                move.setother(Move(move.prev))
                __readmove(move.other)

        infofmt = '2B2BL8B32BH2B2L4B8H64p64p64p16p16p16p16p64p16p16p32p16p16p528B'
        #206个元素
        infostruct = struct.Struct(infofmt)
        #print('infostruct：', struct.calcsize(infofmt))
        movestruct1 = struct.Struct('4B')
        movestruct2 = struct.Struct('L')
        with open(filename, 'rb') as fileobj:
            this.__init__()
            bytestr = infostruct.unpack(fileobj.read(1024))
            KeyXYf, KeyXYt, KeyRMKSize, F32Keys = __readinfo(bytestr)
            __readmove(this.rootmove)
        this.info['Version_xqf'] = str(this.info['Version_xqf'])

    __readbin(filename):
    
        __readmove(move):
            hasothernextrem, fi, ti = movestruct1.unpack(fileobj.read(3))
            move.fseat, move.tseat = fi, ti
            if hasothernextrem & 0x20:
                rlength = movestruct2.unpack(fileobj.read(2))[0]
                move.remark = fileobj.read(rlength).decode()
            this.__setcounts(move) # 设置内部计数值
            if hasothernextrem & 0x80:
                move.setother(Move(move.prev))
                __readmove(move.other)
            if hasothernextrem & 0x40:
                move.setnext(Move(move))
                __readmove(move.next_)
                
        movestruct1 = struct.Struct('3B')
        movestruct2 = struct.Struct('H')
        with open(filename, 'rb') as fileobj:
            this.__init__()
            count = struct.Struct('B').unpack(fileobj.read(1))[0]
            infoks = struct.Struct('{}B'.format(count)).unpack(fileobj.read(count))
            infovstruct = struct.Struct(('{}s' * count).format(*infoks))
            infovs = infovstruct.unpack(fileobj.read(sum(infoks)))
            for n, key in enumerate(sorted(this.info)):
                this.info[key] = infovs[n].decode()
            __readmove(this.rootmove)
            
    __readxml(filename):
            
        __readelem(elem, i, move):
            move.stepno = int(elem[i].tag[1:]) # 元素名
            if move.stepno > 0:
                nstr = elem[i].text.strip()
                if fmt == 'ICCS':
                    move.setseat_ICCS(nstr)
                else:
                    move.zhstr = nstr
            move.remark = elem[i].tail.strip()
            
            this.__setcounts(move) # 设置内部计数值         

            if len(elem[i]) > 0: # 有子元素(变着)
                move.setother(Move(move.prev))
                __readelem(elem[i], 0, move.other)
            i += 1
            if len(elem) > i:
                move.setnext(Move(move))
                __readelem(elem, i, move.next_)
                
        etree = ET.ElementTree(ET.Element('root'), filename)
        rootelem = etree.getroot()
        infoelem = rootelem.find('info')
        for elem in infoelem.getchildren():
            text = elem.text.strip() if elem.text else ''
            this.info[elem.tag] = text
            
        fmt = this.info['Format']
        movelem = rootelem.find('moves')
        if len(movelem) > 0:
            __readelem(movelem, 0, this.rootmove)
            
    __readpgn(filename):
    
        __readmove_ICCSzh(movestr, fmt):                    
        
            __readmoves(move, mvstr, isother):  # 非递归                
                lastmove = move
                for i, (mstr, remark) in enumerate(moverg.findall(mvstr)):
                    newmove = Move(move.prev if isother else move)
                    if fmt == 'ICCS':
                        newmove.setseat_ICCS(mstr)
                    elif fmt == 'zh':
                        newmove.zhstr = mstr
                    if remark:
                        newmove.remark = remark                        
                    this.__setcounts(newmove) # 设置内部计数值
                    if isother and (i == 0): # 第一步为变着
                        lastmove.setother(newmove)
                    else:
                        lastmove.setnext(newmove)
                    lastmove = newmove
                return lastmove
                
            moverg = re.compile(' ([^\.\{\}\s]{4})(?:\s+\{([\s\S]*?)\})?')
            # 走棋信息 (?:pattern)匹配pattern,但不获取匹配结果;  注解[\s\S]*?: 非贪婪
            resultstr = re.findall('\s(1-0|0-1|1/2-1/2|\*)\s?', movestr)
            if resultstr:
                this.info['Result'] = resultstr[0]  # 棋局结果
            remark = re.findall('\{([\s\S]*?)\}', infostr)
            if remark:
                this.rootmove.remark = remark[0]
            this.__setcounts(this.rootmove) # 设置内部计数值
            othmoves = [this.rootmove]
            isother = False
            thismove = null
            leftstrs = re.split('\(\d+\.', movestr) # 如果注解里存在‘\(\d+\.’的情况，则可能会有误差
            while leftstrs:
                thismove = othmoves[-1] if isother else othmoves.pop()
                if not re.search('\) ', leftstrs[0]):
                    # 如果注解里存在‘\) ’的情况，则可能会有误差                  
                    othmoves.append(__readmoves(thismove, leftstrs.pop(0), isother))
                    isother = True
                else:
                    lftstr, leftstrs[0] = re.split('\) ', leftstrs[0], maxsplit=1)
                    __readmoves(thismove, lftstr, isother)
                    isother = False                    
            
        __readmove_cc(movestr):
            
            __readmove(move, row, col, isother=False):
                zhstr = moverg.findall(moves[row][col])                
                if zhstr:
                    newmove = Move(move.prev if isother else move)
                    newmove.stepno = row
                    newmove.zhstr = zhstr[0][:4]
                    newmove.remark = rems.get((row, col), '')
                    this.__setcounts(newmove) # 设置内部计数值
                    if isother:
                        move.setother(newmove)
                    else:
                        move.setnext(newmove)    
                    if zhstr[0][4] == '…':
                        __readmove(newmove, row, col+1, True)
                elif isother:
                    while moves[row][col][0] == '…':
                        col += 1
                    __readmove(move, row, col, True)
                if zhstr and row < len(moves)-1 and moves[row+1]:
                    __readmove(newmove, row+1, col)
                        
            movestr, p, remstr = movestr.partition('\n(')
            moves, rems = [], {}
            if movestr:
                mstrrg = re.compile('.{5}')
                moverg = re.compile('([^…　]{4}[…　])')
                moves = [mstrrg.findall(linestr) for linestr
                        in [line for i, line in enumerate(movestr.split('\n')) if i % 2 == 0]]
            if remstr:
                remrg = re.compile('\(\s*(\d+),\s*(\d+)\): \{([\s\S]*?)\}')
                rems = {(int(rowstr), int(colstr)): remark
                        for rowstr, colstr, remark in remrg.findall('(' + remstr)}
                this.rootmove.remark = rems.get((0, 0), '')
            this.__setcounts(this.rootmove) # 设置内部计数值
            if len(moves) > 1:
                __readmove(this.rootmove, 1, 0)
            
        infostr, p, movestr = open(filename).read().partition('\n1.')
        for key, value in re.findall('\[(\w+) "(.*)"\]', infostr):
            this.info[key] = value
        # 读取info内容（在已设置原始key上可能会有增加）
        fmt = this.info['Format']
        if fmt == 'cc':
            __readmove_cc(movestr)
        else:
            __readmove_ICCSzh(movestr, fmt)
        
    __setmvinfo(haszhstr=False):
    
        '根据board设置树节点的zhstr或seat'
        __set(move):
            setfunc(move)            
            move.maxcol = this.maxcol # 在视图中的列数
            this.othcol = max(this.othcol, move.othcol)
            this.maxrow = max(this.maxrow, move.stepno)
            this.movego(move)
            if move.next_:
                __set(move.next_)
            this.moveback()
            if move.other:
                this.maxcol += 1
                __set(move.other)
        
        setfunc = this.setmvseat if haszhstr else this.setzhstr
        this.othcol = 0 # 存储最大变着层数
        this.maxrow = 0 # 存储最大着法深度
        this.maxcol = 0 # 存储视图最大列数
        if this.rootmove.next_: # and this.movcount < 300: # 步数太多则太慢
            __set(this.rootmove.next_) # 驱动调用递归函数            
                    
    readfile(filename):
    
        this.__clearinfomove()
        if not (filename and os.path.exists(filename) and os.path.isfile(filename)):
            return
        this.dirname = os.path.splitdrive(os.path.dirname(filename))[1]
        this.filename = os.path.splitext(os.path.basename(filename))[0]
        ext = os.path.splitext(os.path.basename(filename))[1]
        if ext == '.xqf':
            this.__readxqf(filename) 
        elif ext == '.bin':
            this.__readbin(filename)
        elif ext == '.xml':
            this.__readxml(filename)
        elif ext == '.pgn':
            this.__readpgn(filename)
            
        this.setfen()
        this.__setmvinfo(ext in {'.xml', '.pgn'}
                and this.info['Format'] in {'zh', 'cc'})
            
    __saveasbin(filename):
    
        __addmoves(move):
            rembytes = move.remark.strip().encode()
            hasothernextrem = ((0x80 if move.other else 0) |
                                (0x40 if move.next_ else 0) |
                                (0x20 if rembytes else 0))
            resbytes.extend(movestruct1.pack(hasothernextrem, move.fseat, move.tseat))
            if rembytes:
                resbytes.extend(movestruct2.pack(len(rembytes)))
                resbytes.extend(rembytes)  # rbytes已经是字节串，不需要再pack
            if move.other:
                __addmoves(move.other)
            if move.next_:
                __addmoves(move.next_)
    
        resbytes = bytearray()
        infobytes = [value.encode() for key, value in sorted(this.info.items())]
        lenbytes = [len(infob) for infob in infobytes]
        resbytes.extend([len(lenbytes)]) # info条目数
        resbytes.extend(lenbytes)
        resbytes.extend(b''.join(infobytes))
            
        movestruct1 = struct.Struct('3B')
        movestruct2 = struct.Struct('H')
        __addmoves(this.rootmove)
        try:
            open(filename, 'wb').write(resbytes)
        except:
            print('错误：写入 {} 文件不成功！'.format(filename))

    __saveasxml(filename, fmt):
            
        __createlem(name, value='', remark=''):
            newelem = ET.Element(name) # 元素名
            newelem.text = value
            newelem.tail = remark
            return newelem
            
        __addelem(elem, move, fmt):
            rem = move.remark.strip()
            thissub = __createlem('m{0:02d}'.format(move.stepno),
                    move.ICCSzhstr(fmt), rem)
            if move.other: # 有变着
                __addelem(thissub, move.other, fmt)                
            elem.append(thissub)
            if move.next_:
                __addelem(elem, move.next_, fmt)
                
        this.info['Format'] = fmt
        rootelem = ET.Element('root')
        infoelem = __createlem('info')
        for name, value in sorted(this.info.items()):
            infoelem.append(__createlem(name, value))
        rootelem.append(infoelem)
        
        movelem = __createlem('moves')
        __addelem(movelem, this.rootmove, fmt)
        rootelem.append(movelem)
        xmlindent(rootelem)  # 美化
        ET.ElementTree(rootelem).write(filename, encoding='utf-8')
        
    __saveaspgn(filename, fmt):
    
        __movestr(fmt):
               
            __remarkstr(move):
                rem = move.remark
                return '' if not rem else '\n{{{}}}\n'.format(rem)
            
            __addstrl(move, isother=False):
                prestr = ('({0}. {1}'.format((move.stepno + 1) // 2, 
                        '... ' if move.stepno % 2 == 0 else '')
                        if isother else
                        (' ' if move.stepno % 2 == 0 else 
                        '{}. '.format((move.stepno + 1) // 2)))
                movestrl.append('{0}{1} {2}'.format(prestr,
                        move.ICCSzhstr(fmt), __remarkstr(move)))                
                if move.other:
                    __addstrl(move.other, True)
                    movestrl.append(') ')                   
                if move.next_:
                    __addstrl(move.next_)
        
            movestrl = [__remarkstr(this.rootmove)]
            if this.rootmove.next_:
                __addstrl(this.rootmove.next_)          
            return movestrl
            
        this.info['Format'] = fmt
        open(filename, 'w').write(repr(this) if fmt == 'cc' else 
                '\n'.join([this.__infostr(), ''.join(__movestr(fmt))]))
                    
    writefile(filename, ext, fmt='ICCS'):
        if ext == '.bin':
            this.__saveasbin(filename)
        elif ext == '.xml':
            this.__saveasxml(filename, fmt)
        elif ext == '.pgn':
            this.__saveaspgn(filename, fmt)

    transdir(dirfrom, dirto, text, fmt):
               
        __transdir(dirfrom, dirto, text, fmt):
            fcount = dcount = 0
            if not os.path.exists(dirto):
                os.mkdir(dirto)
            for subname in os.listdir(dirfrom):
                subname = os.path.normcase(subname)
                pathfrom = os.path.join(dirfrom, subname)          
                pathto = os.path.join(dirto, subname)
                if os.path.isfile(pathfrom): # 文件
                    extension = os.path.splitext(os.path.basename(pathfrom))[1]
                    if extension in ('.xqf', '.bin', '.xml', '.pgn'):
                        board = Board(pathfrom)                        
                        filenameto = os.path.join(dirto, 
                                os.path.splitext(os.path.basename(pathfrom))[0] + text)
                        count[0] += board.movcount
                        count[1] += board.remcount
                        count[2] = max(count[2], board.remlenmax)
                        dirtoboard.append((filenameto, text, fmt, board))
                        fcount += 1
                    elif extension == '.txt':
                        data = open(pathfrom).read()
                        open(pathto, 'w').write(data)
                        fcount += 1
                else:
                    below = __transdir(pathfrom, pathto, text, fmt)
                    fcount += below[0]
                    dcount += below[1]
                    dcount += 1
            return (fcount, dcount)
            
        count = [0, 0, 0]
        dirtoboard = []
        fcount, dcount = __transdir(dirfrom, dirto, text, fmt)
        #'''
        for filenameto, text, fmt, board in dirtoboard:
            board.writefile(filenameto, text, fmt)            
        print('{}==>：{}_{} 共有{}个文件，{}个目录转换成功！'.format(
                dirfrom, text, fmt, fcount, dcount))
        print('着法数量：{}，注释数量：{}, 注释最大长度：{}'.format(
                count[0], count[1], count[2]))
        #'''
        
    loadviews(views):
        this.views = views
        this.notifyviews()

    notifyviews(this):
        '通知视图更新'
        if not hasattr('views'):
            return
        for view in this.views:
            view.updateview()

*/    

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
