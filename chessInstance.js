// 中国象棋棋盘布局类型 by-cjp

import * as base from './base.js';
import { Info } from './info.js';
import { Pieces } from './piece.js';
import { Board } from './board.js';
import { Move, Moves } from './move.js';

//console.log('chessInstance.js!');

class ChessInstance {

    addListener(listener) {
        let fileInput = document.getElementById("fileInput");
        fileInput.addEventListener("change", listener, false);
        //let body = document.getElementById("body");    
        //body.addEventListener("load", listener, false);
    }

    constructor() {
        this.info = new Info();
        this.pieces = new Pieces();
        this.board = new Board();
        this.moves = new Moves();

        this.addListener(this.readFile());
    }

    toString() {
        return [this.info.toString(), this.moves.toString()].join('\n');
    }

    toLocaleString() {
        return [this.info.toString(), this.moves.toLocaleString(), this.board.toString()].join('\n');
    }

    __readBin(file) {
        //movestruct1 = struct.Struct('3B');
        //movestruct2 = struct.Struct('H');

    }

    __readPgn(pgnText) {
        let [infoStr, moveStr] = pgnText.split('\n1\.');
        this.info.setFromPgn(infoStr);
        this.board.setFen(this);

        let fmt = this.info.info['Format'];
        if (fmt == 'cc') {
            this.moves.rootMove.fromCC(moveStr, this.board);
        } else {
            let resultStr = moveStr.match(/\s(1-0|0-1|1\/2-1\/2|\*)(?!\S)/m);
            if (resultStr != null) {
                this.info.info['Result'] = resultStr[1];
            } //  # 棋局结果
            let remark = infoStr.match(/\{([\s\S]*?)\}/gm);
            if (remark) {
                this.moves.rootMove.remark = remark[0];
            }
            this.moves.rootMove.fromICCSZh(moveStr, this.board, fmt);
        }
        this.moves.initNums(this.board);
        
        let fileDisplay = document.getElementById("fileDisplay");
        fileDisplay.innerHTML = '';
        fileDisplay.appendChild(document.createTextNode(`${this.toString()}`));

        //console.log(this);
        console.log(JSON.stringify(this.moves.rootMove));
        //console.log(pgnText);
        console.log(this.toString());
        console.log(this.toLocaleString());
    }

    readFile() {
        let files = document.getElementById("fileInput").files;
        if (!Boolean(files)) {
            return;
        }
        let reader = new FileReader();
        reader.readAsText(files[0]);//, "utf-8", "GB2312"
        reader.onload = () => this.__readPgn(reader.result);
        reader.onerror = (e) => console.log("Error", e);
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

