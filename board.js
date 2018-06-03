// 中国象棋棋盘布局类型 by-cjp

import * as base from './base.js';
import { Info } from './info.js';
import { Pieces } from './piece.js';
import { Seats } from './seat.js';
import { Move, Moves } from './move.js';

//console.log('board.js!');

class Board {

    addListener(listener) {
        let fileInput = document.getElementById("fileInput");
        fileInput.addEventListener("change", listener, false);
        //let body = document.getElementById("body");    
        //body.addEventListener("load", listener, false);
    }

    constructor() {
        this.info = new Info();
        this.seats = new Seats();
        this.pieces = new Pieces();
        this.moves = new Moves();
        this.rootMove = this.moves.rootMove; // 本类对象方便引用

        this.addListener(this.readFile());
    }

    toString() {
        return [this.info.toString(), this.moves.toString()].join('\n');
    }

    toLocaleString() {
        return [this.info.toString(), this.moves.toLocaleString(), this.seats.toString()].join('\n');
    }

    setCounts(move) {
        this.movCount += 1;
        if (move.remark) {
            this.remCount += 1;
            this.remLenMax = Math.max(this.remLenMax, move.remark.length);
        }
    }

    __readBin(file) {
        movestruct1 = struct.Struct('3B');
        movestruct2 = struct.Struct('H');

    }

    __readPgn(pgnText) {
        let [infoStr, moveStr] = pgnText.split('\n1\.');
        this.info.setFromPgn(infoStr);

        let fmt = this.info.info['Format'];
        if (fmt == 'cc') {
            this.moves.readMove_cc(moveStr, this);
        } else {
            let resultStr = moveStr.match(/\s(1-0|0-1|1\/2-1\/2|\*)(?!\S)/m);
            if (resultStr != null) {
                this.info.info['Result'] = resultStr[1];
            } //  # 棋局结果
            let remark = infoStr.match(/\{([\s\S]*?)\}/gm);
            if (remark) {
                this.rootMove.remark = remark[0];
            }
            this.moves.readMove_ICCSzh(moveStr, fmt, this);
        }

        this.seats.setFen(this);

        let fileDisplay = document.getElementById("fileDisplay");
        fileDisplay.innerHTML = '';
        fileDisplay.appendChild(document.createTextNode(`${this.toString()}`));

        //console.log(this);
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
        for (view in this.views)
            view.updateview();
    }
}


var board = new Board();
//console.log(board);

