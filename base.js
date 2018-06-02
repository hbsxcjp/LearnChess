//中国象棋基础信息
    
export {blankBoard, View, multRepl, xmlIndent};

const blankBoard = `
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

 
class View {
    constructor(model) {
        self.board = model;
    }

    updateview() {
        // 更新视图（由数据模型发起）
    }
}
         
function multRepl(text, replStrs) {
    // 一次替换多个子字符串（字典定义）（方法来源于PythonCook）
    for (let oldNew of replStrs) {
        text = text.replace(RegExp(oldNew[0], 'g'), oldNew[1]);
    }
    return text;
}

function xmlIndent(elem, islast=False, level=0) {
    //'Get pretty look 取得漂亮的外观'
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