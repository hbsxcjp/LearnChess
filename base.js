//中国象棋基础信息
    
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
         
function multRepl(text, xdict) {
    // 一次替换多个子字符串（字典定义）（方法来源于PythonCook）
    //rx = re.compile('|'.join(map(re.escape, xdict)));  // 模式
    //def one_xlat(match):
    //    return xdict[match.group(0)]  # 替换值
    //return rx.sub(one_xlat, text)  # 执行替换
    }

function xmlIndent(elem, islast=False, level=0) {
    //'Get pretty look 取得漂亮的外观'
    __isblank(text) {
        //return not text or not text.expandtabs(4).strip()
    }
    __addblank(text) {
        //return '{}{}'.format(text.expandtabs(4).strip(), tabstr)
    }
    __cuttab(tail, islast) {
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