// 中国象棋棋盘布局类型 by-cjp

import * as base from './base.js';
import { Info } from './info.js';
import { Pieces } from './piece.js';
import { Board } from './board.js';
import { Moves } from './move.js';


class ChessInstance {
    constructor() {
        this.pieces = new Pieces();
        this.board = new Board();
        this.info = new Info();
        this.moves = new Moves();
        
        document.getElementById("fileInput").addEventListener("change", this.readFile(), false);
        //document.body.addEventListener("load", this.readFile());
    }

    toString() {
        return [this.info.toString(), this.moves.toString()].join('\n');
    }

    toLocaleString() {
        return [this.info.toString(), this.moves.toLocaleString(), this.board.toString()].join('\n');
    }

    readBin(file) {
        //movestruct1 = struct.Struct('3B');
        //movestruct2 = struct.Struct('H');

    }

    readPgn(pgnText) {
        let [infoStr, moveStr] = base.partition(pgnText, /\s+1\./);
        //console.log(infoStr);
        console.log(moveStr);
        this.info.setFromPgn(infoStr);
        this.board.setFen(this);

        this.moves.setFrom(moveStr, this.board, this.info.info['Format']);
        let resultStr = moveStr.match(/\s(1-0|0-1|1\/2-1\/2|\*)(?!\S)/m);
        if (resultStr != null) {
            this.info.info['Result'] = resultStr[1];
        } //  # 棋局结果
        let remark = infoStr.match(/\{([\s\S]*?)\}/m);
        this.moves.rootMove.remark = remark ? remark[1] : ''; // 0:匹配文本，1:圆括号内文本        

        let fileDisplay = document.getElementById("fileDisplay");
        fileDisplay.innerHTML = '';
        fileDisplay.appendChild(document.createTextNode(`${this.toString()}`));

        let moveJSON = JSON.stringify(this.moves.rootMove);
        console.log(this.info.info['Title'], moveJSON.length);
        //console.log(this.board.toString());//.toLocaleString()
        //this.moves.setFrom(moveJSON, this.board, 'JSON');

        [infoStr, moveStr] = base.partition(this.moves.toLocaleString(), /\s+1\./);
        this.moves.setFrom(moveStr, this.board, 'cc');
        //this.moves.setFromJSON(moveJSON, this.board);
        //console.log(this.toString());
        //console.log(this.toLocaleString());         
        console.log((new Date).getTime() - this.time, "ms");
    }

    readFile() {
        this.time = (new Date).getTime();
        let files = document.getElementById("fileInput").files;
        for (let file of files) {
            let reader = new FileReader();
            reader.readAsText(file, "GB2312");//, "utf-8"
            reader.onload = () => {
                this.readPgn(reader.result);
            }
            reader.onerror = (e) => console.log("Error", e);
        }        
    }

    loadViews(views) {
        this.views = views;
        this.notifyViews();
    }

    notifyViews() {
        //'通知视图更新'
        if (!('views' in this))
            return;
        for (let view of this.views)
            view.updateview();
    }
}


var chessInstance = new ChessInstance();
//console.log(chessInstance);

