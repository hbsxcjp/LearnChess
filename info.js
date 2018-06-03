// 中国象棋棋盘布局信息类型 by-cjp

import * as base from './base.js';
export {info};


var info = {
    'Author': '',
    'Black': '',
    'BlackTeam': '',
    'Date': '',
    'ECCO': '',
    'Event': '',
    'FEN': base.FEN,
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
    'Version': ''
};

// 设置属性
Object.defineProperties(info, {
    toString: {
        value:  () => Object.keys(info).map(x => `[${x} "${info[x]}"]`).join('\n'),
        writable: false, 
        enumerable: false,
        configurable: false
    }    
   
});
