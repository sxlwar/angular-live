import { CurrentUser, PusherMessage } from 'pusher__chatkit-client';

import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';

import { TimService } from './providers/tim.service';

declare var Aliplayer: any;

export interface User {
  name: string;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  animations: [
    trigger("flyInOut", [
      state("in", style({ transform: "translateX(0)", display: "block" })),
      state("out", style({ transform: "translateX(100%)", display: "none" })),
      transition("in <=> out", [animate("500ms ease-out")])
    ])
  ]
})
export class AppComponent implements OnInit {
  player: object;

  isUsersHide: boolean = false;

  messages: PusherMessage[] = [];

  users: User[] = [];

  currentUser: CurrentUser;

  currentRoom = {};

  _username: string = "";
  get username(): string {
    return this._username;
  }

  set username(value: string) {
    this._username = value;
  }

  _message: string = "";
  get message(): string {
    return this._message;
  }

  set message(value: string) {
    this._message = value;
  }

  constructor(public timService: TimService) {}

  ngOnInit() {
    this.initPlayer();
    this.timService.initChatRoom("user0").subscribe(res => {
      this.users = [{ name: res.ownerID }];
    });
  }

  sendMessage() {
    const { message, currentUser } = this;
    currentUser.sendSimpleMessage({
      text: message,
      roomId: "daac5f27-4f2b-4d57-9b30-428b26c539e0"
    });

    this.message = "";
  }

  addUser() {
    const { username } = this;
    this.timService.addUser({ username, id: "xxxxx" });

    // TODO 添加成功后加入到 this.users
  }

  initPlayer() {
    this.player = new Aliplayer(
      {
        id: "player-con",
        // source: "http://ivi.bupt.edu.cn/hls/cctv1hd.m3u8", // CCTV 直播地址
        source: "<换成拉流地址>",
        width: "100%",
        height: "500px",
        cover:
          "https://img.alicdn.com/tps/TB1EXIhOFXXXXcIaXXXXXXXXXXX-760-340.jpg",
        /* To set an album art, you must set 'autoplay' and 'preload' to 'false' */
        autoplay: false,
        preload: false,
        isLive: false
      },
      function(player) {
        console.log("The player is created");
      }
    );
  }
}
