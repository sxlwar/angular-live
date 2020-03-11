import { CurrentUser } from 'pusher__chatkit-client';
import { interval } from 'rxjs';
import { filter, mapTo, scan, switchMap } from 'rxjs/operators';
import TIM from 'tim-js-sdk';

import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';

import { SendTextMessageRes, TimService } from './providers/tim.service';

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

  messages: SendTextMessageRes[] = [];

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

  groupID: string;

  constructor(public timService: TimService) {}

  /**
   * TODO: 用户进到直播页面前groupID就应该已经生成，也就是说初始化聊天室的操作实际在直播人员创建聊天室的时候就已经完成了
   */
  ngOnInit() {
    this.initPlayer();
    this.timService.initChatRoom("user0").subscribe(res => {
      this.users = [{ name: res.ownerID }];
      this.groupID = res.groupID;
      this.getGroupMemberList();
      this.getMessages();
    });
  }

  getGroupMemberList(): void {
    interval(2000)
      .pipe(
        mapTo(this.groupID),
        switchMap(groupID => this.timService.getGroupMemberList({ groupID })),
        filter(res => !!res)
      )
      .subscribe(res => {
        // console.log("member list: ", res);
      });
  }

  getMessages(): void {
    this.timService
      .getTextMessages(this.groupID)
      .pipe(
        scan(
          (acc: SendTextMessageRes[], cur: SendTextMessageRes) => [...acc, cur],
          []
        )
      )
      .subscribe(res => {
        console.log('message collection: ', res);
        this.messages = res;
      });
  }

  sendMessage() {
    const { message } = this;

    this.timService.sendTextMessage({ text: message, to: this.groupID });
  }

  /**
   * 用户进入直播时需要执行的操作，向后台发送请求，将用户添加到聊天室中
   * 此时可能有 2 种不同身份的用户
   * 1、匿名用户，无法发送消息，但是可以看到聊天内容
   * 2、已登录的用户，可以正常发送消息
   */
  addUser() {
    const { username } = this;
    this.timService
      .addUser({ username, userId: "xxxxx", groupID: this.groupID })
      .subscribe(res => {
        // FIXME: 添加user后的响应状态貌似都是AlreadyInGroup
        if (
          res.status === TIM.TYPES.JOIN_STATUS_SUCCESS ||
          (res.status === TIM.TYPES.JOIN_STATUS_ALREADY_IN_GROUP &&
            !this.users.some(user => user.name === username))
        ) {
          this.users = [...this.users, { name: res.username }];
        }
      });
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
