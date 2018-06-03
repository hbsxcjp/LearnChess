// 中国象棋棋盘布局信息类型 by-cjp

import * as base from './base.js';
export { Info };

//console.log('info.js!');

class Info {
    constructor() {
        this.info = {
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
    }

    toString() {
        return Object.keys(this.info).map((k) => `[${k} "${this.info[k]}"]`).join('\n');
    }

    setFromPgn(infoStr) {
        let result;
        let regexp = /\[(\S+) "(.*)"\]/gm;
        while ((result = regexp.exec(infoStr)) != null) {
            this.info[result[1]] = result[2];
        } //# 读取info内容（在已设置原始key上可能会有增加）
    }

}
