// 中国象棋棋盘布局类型 by-cjp

import * as base from './base.js';
import {info} from './info.js';
import {Pieces} from './piece.js';
import {Seats} from './seat.js';
import {Move, Moves} from './move.js';

class Board {

    addListener(listener) {
        let fileInput = document.getElementById("fileInput");
        fileInput.addEventListener("change", listener, false);
        //let body = document.getElementById("body");    
        //body.addEventListener("load", listener, false);
    }
       
    constructor() {
        this.info = Object.create(info);        
        this.seats = new Seats();
        this.pieces = new Pieces();
        this.moves = new Moves();
        this.rootMove = this.moves.rootMove; // 本类对象方便引用
              
        this.addListener(this.readFile());
    }

    toString() {
        return [this.seats.toString(), this.info.toString(), this.moves.toString()].join('\n');
    }
    
    toLacelString() {
        return [this.info.toString(), this.seats.toString(), this.moves.toLocaleString(), totalstr, walkstr, remstr].join('\n');
    }

    setCounts(move) {
        this.movCount += 1;
        if (move.remark) {
            this.remCount += 1;
            this.remLenMax = Math.max(this.remLenMax, move.remark.length);
        }
    }

    __readbin(file) {
        movestruct1 = struct.Struct('3B');
        movestruct2 = struct.Struct('H');
        
    }

    __readpgn(pgnText) {
        let [infoStr, moveStr] = base.partition(pgnText, /\n1./gm);
        if (infoStr) {
            for (let [key, value] of infoStr.match(/\[(\S+) "(.*)"\]/gm)) {
                this.info[key] = value;
            } //# 读取info内容（在已设置原始key上可能会有增加）
        }                
        let fmt = this.info['Format'];
        if (fmt == 'cc') {
            this.moves.readMove_cc(moveStr, this);
        } else {
            let resultStr = moveStr.match(/\s(1-0|0-1|1\/2-1\/2|\*)(?!\S)/m);
            if (resultStr != null) {
                this.info['Result'] = resultStr[1];
            } //  # 棋局结果
            let remark = infoStr.match(/\{([\s\S]*?)\}/gm);
            if (remark) {
                this.rootMove.remark = remark[0];
            }   
            this.moves.readMove_ICCSzh(moveStr, fmt, this);
        }
        console.log(this.toString());
        console.log(this.rootMove.toString());
        console.log(this);          
    }

    readFile() {
        let files = document.getElementById("fileInput").files;
        if (!files) {
            return ;
        }
        let reader = new FileReader();
        reader.readAsText(files[0]);//, "utf-8", "GB2312"
        reader.onload = () => this.__readpgn(reader.result);
        reader.onerror = (e) => console.log("Error", e);                
        
        this.seats.setFen(this);
        this.moves.setMoveInfo(this);

        let fileDisplay = document.getElementById("fileDisplay");
        fileDisplay.innerHTML = '';
        fileDisplay.appendChild(document.createTextNode(`${this.toString()}`));        
    }

    loadViews(views) {
        this.views = views;
        this.notifyViews();
    }

    notifyViews() {
        //'通知视图更新'
        if (!('views' in this))
            return ;
        for (view in this.views)
            view.updateview();
    }   

}


var board = new Board();
//console.log(board);

