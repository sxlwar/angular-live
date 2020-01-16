import { Component, OnInit } from "@angular/core";
import {
  TokenProvider,
  ChatManager,
  PusherMessage,
  PusherUser,
  CurrentUser
} from "pusher__chatkit-client";
import axios from "axios";
import { trigger, state, style, transition, animate } from "@angular/animations";

declare var Aliplayer: any;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  animations: [
    trigger('flyInOut', [
      state('in', style({ transform: 'translateX(0)', display: 'block' })),
      state('out', style({ transform: 'translateX(100%)', display: 'none' })),
      transition('in <=> out', [animate('500ms ease-out')]),
  ]),
  ]
})
export class AppComponent implements OnInit {
  player: object;

  isUsersHide:boolean = false;

  messages: PusherMessage[] = [];

  users: PusherUser[] = [];

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

  constructor() {}

  ngOnInit() {
    this.initPlayer();
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
    axios
      .post("http://localhost:5200/users", { username })
      .then(() => {
        const tokenProvider = new TokenProvider({
          url: "http://localhost:5200/authenticate"
        });

        const chatManager = new ChatManager({
          instanceLocator: "v1:us1:52d3305b-bc55-4e29-bec8-218eadf0e421",
          userId: username,
          tokenProvider
        });

        return chatManager.connect().then(currentUser => {
          currentUser.subscribeToRoomMultipart({
            roomId: "daac5f27-4f2b-4d57-9b30-428b26c539e0",
            messageLimit: 100,
            hooks: {
              onMessage: message => {
                this.messages.push(message);
              },
              onPresenceChanged: (state, user) => {
                this.users = currentUser.users.sort(a => {
                  return a.presence === "online" ? -1 : 1;
                });
              }
            }
          });

          this.currentUser = currentUser;
          this.users = currentUser.users;
        });
      })
      .catch(error => console.error(error));
  }

  initPlayer() {
    this.player = new Aliplayer(
      {
        id: "player-con",
        source: "http://ivi.bupt.edu.cn/hls/cctv1hd.m3u8",
        // source: "http://live.hijavascript.com/testApp/testStream.flv?auth_key=1579136532-0-0-5a96852cbbb213a3c3f5cb4d665a4cf4",
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
