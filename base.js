//中国象棋基础信息 by-cjp

export {
    View, range, multRepl, xmlIndent,
    BLACK, RED, CharNames, KingChars, StrongeChars,
    PieceNames, LineMovePieceNames, AdvisorBishopNames, PawnNames,
    NumCols, NumRows, maxColNo, MinColNo,
    Num_Chinese, DirectionToNum, FEN, BlankBoard, ColChars
};

// 视图模型
class View {
    constructor(model) {
        self.board = model;
    }

    updateview() {
        // 更新视图（由数据模型发起）
    }
}

// 取得数字序列数组
function range(from, end) {
    let array = new Array();
    for (let i = from; i < end; i++) {
        array.push(i);
    }
    return array;
}


// 一次替换多个子字符串（字典定义）（方法来源于PythonCook）
function multRepl(text, replStrs) {
    for (let oldNew of replStrs) {
        text = text.replace(RegExp(oldNew[0], 'g'), oldNew[1]);
    }
    return text;
}

//'Get pretty look 取得漂亮的外观'
function xmlIndent(elem, islast = False, level = 0) {
    function __isblank(text) {
        //return not text or not text.expandtabs(4).strip()
    }

    function __addblank(text) {
        //return '{}{}'.format(text.expandtabs(4).strip(), tabstr)
    }

    function __cuttab(tail, islast) {
        //return tail[:-1] if islast else tail
    }

    /*tabstr = '\n' + level * '\t'
    if len(elem):
        elem.text = '{}\t'.format(
            tabstr if __isblank(elem.text) else __addblank(elem.text))
    for n, e in enumerate(elem):
        xmlindent(e, bool(len(elem) - 1 == n), level + 1)
    elem.tail = __cuttab(
        tabstr if __isblank(elem.tail) else __addblank(elem.tail), islast)
        */
}

// 棋子相关常量
const BLACK = 'black';
const RED = 'red';
const CharNames = {
    'K': '帅', 'A': '仕', 'B': '相', 'N': '马',
    'R': '车', 'C': '炮', 'P': '兵',
    'k': '将', 'a': '士', 'b': '象', 'n': '马',
    'r': '车', 'c': '炮', 'p': '卒', '_': ''
};
// 全部棋子ch值与中文名称映射字典
const KingChars = new Set('kK');
const StrongeChars = new Set('rncpRNCP');
const PieceNames = new Set('帅仕相马车炮兵将士象卒');
const LineMovePieceNames = new Set('帅车炮兵将卒');
const AdvisorBishopNames = new Set('仕相士象');
const PawnNames = new Set('兵卒');

// 棋盘相关常量
const NumCols = 9;
const NumRows = 10;
const MinColNo = 0;
const maxColNo = 8;
const FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1';
const ColChars = 'abcdefghi';
const Num_Chinese = {
    'red': ' 一二三四五六七八九',
    'black': ' １２３４５６７８９'
};
const DirectionToNum = {
    '前': 0, '中': 1, '后': -1,
    '进': 1, '退': -1, '平': 0
};
const BlankBoard = `
┏━┯━┯━┯━┯━┯━┯━┯━┓
┃　│　│　│╲│╱│　│　│　┃
┠─┼─┼─┼─╳─┼─┼─┼─┨
┃　│　│　│╱│╲│　│　│　┃
┠─╬─┼─┼─┼─┼─┼─╬─┨
┃　│　│　│　│　│　│　│　┃
┠─┼─╬─┼─╬─┼─╬─┼─┨
┃　│　│　│　│　│　│　│　┃
┠─┴─┴─┴─┴─┴─┴─┴─┨
┃　　　　　　　　　　　　　　　┃
┠─┬─┬─┬─┬─┬─┬─┬─┨
┃　│　│　│　│　│　│　│　┃
┠─┼─╬─┼─╬─┼─╬─┼─┨
┃　│　│　│　│　│　│　│　┃
┠─╬─┼─┼─┼─┼─┼─╬─┨
┃　│　│　│╲│╱│　│　│　┃
┠─┼─┼─┼─╳─┼─┼─┼─┨
┃　│　│　│╱│╲│　│　│　┃
┗━┷━┷━┷━┷━┷━┷━┷━┛
`
// 边框粗线            

