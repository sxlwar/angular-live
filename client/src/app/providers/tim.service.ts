import COSSDK from 'cos-js-sdk-v5';
import { BehaviorSubject, from, Observable, of, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import TIM from 'tim-js-sdk';

import { Injectable } from '@angular/core';

export interface Member {
  userID: string;
  role?: "Admin";
  memberCustomField: {}[];
}

export interface GroupOptions {
  groupID?: string;
  name: string;
  type?: string;
  avatar?: string;
  introduction?: string;
  notification?: string;
  joinOption?: string;
  memberList?: string[];
}

export interface UserSig {
  SDKAppID: number;
  userSig: string;
}

export interface CreateGroupRes {
  ownerID: string;
  groupID: string;
}

export interface JoinGroupReq {
  username: string;
  userId: string;
  groupID: string;
}

export interface JoinGroupRes {
  username: string;
  userId: string;
  groupID: string;
  status: string;
}

export interface GetGroupMemberListReq {
  groupID: string;
  count?: number;
  offset?: number;
}

export interface GetGroupMemberListRes {
  userID: string;
  avatar: string;
  nick: string;
  role: string;
  joinTime: number;
  lastSendMsgTime: string;
  nameCard: string;
  muteUntil: number;
  memberCustomField: any[];
}

export interface SendTextMessageReq {
  to: string; // groupID
  text: string;
}

export interface TextMessagePayload {
  text: string;
}

export interface Message<T> {
  ID: string;
  clientSequence: number;
  conversationID: string;
  conversationType: string;
  flow: string;
  from: string;
  isRead: boolean;
  isResend: boolean;
  isRevoked: boolean;
  isSystemMessage: boolean;
  messagePriority: number; // 2.4.2 应该修改成了priority字段
  payload: T;
  status: "success" | "unSend" | "fail";
  time: number; // timestamp
  to: string;
  type: string;
}

export interface SendTextMessageRes extends Message<TextMessagePayload> {}

@Injectable({ providedIn: "root" })
export class TimService {
  tim: any;

  textMessages$: BehaviorSubject<
    Message<TextMessagePayload>
  > = new BehaviorSubject(null);

  constructor() {}

  /**
   *
   * @param userID 直播者的用户ID
   */
  initChatRoom(userID: string): Observable<CreateGroupRes> {
    const { SDKAppID, userSig } = this.genTestUserSig(userID);

    this.tim = TIM.create({ SDKAppID });
    // 无日志级别
    this.tim.setLogLevel(0);
    // 注册 cos
    this.tim.registerPlugin({ "cos-js-sdk": COSSDK });
    const subject: Subject<CreateGroupRes> = new Subject();

    this.tim.on(TIM.EVENT.SDK_READY, event => {
      console.log("tim on ready state", event);
      this.createGroup().subscribe(subject);
    });

    this.login(userID, userSig); // 需要直播者登录

    return subject.asObservable();
  }

  login(userID: string, userSig: string) {
    this.tim
      .login({
        userID,
        userSig
      })
      .then(res => console.log("login res", res));
  }

  /**
   * TODO: 需要后台创建接口返回SDKAppID
   */
  getUserSig() {}

  genTestUserSig(userID: string): UserSig {
    const SDKAPPID = 1400330461;
    const EXPIRETIME = 604800;
    const SECRETKEY =
      "a27db50f095d99a450d7cea44fac7c04db3aaa2f58e5f1540d7013c74688a0ba";

    const generator = new (<any>window).LibGenerateTestUserSig(
      SDKAPPID,
      SECRETKEY,
      EXPIRETIME
    );
    const userSig = generator.genTestUserSig(userID);
    return {
      SDKAppID: SDKAPPID,
      userSig: userSig
    };
  }

  /**
   * 直播来始时创建一个聊天群
   */
  createGroup(): Observable<CreateGroupRes> {
    const opt = this.getOptions();
    return from(this.tim.createGroup(opt)).pipe(
      map(imResponse => {
        const { data } = imResponse as any;

        return { ownerID: data.group.ownerID, groupID: data.group.groupID };
      })
    );
  }

  getOptions(): GroupOptions {
    return {
      groupID: "", // 后台最好生成一个,需要一个uniqID
      name: "username",
      type: TIM.TYPES.GRP_CHATROOM,
      avatar: "", // 可以设个默认值，已登录用户可以用已有的
      joinOption: TIM.TYPES.JOIN_OPTIONS_FREE_ACCESS,
      memberList: [], // 创建者的userId
      introduction: "",
      notification: ""
    };
  }

  /**
   * 在聊天群中添加用户
   */
  addUser(user: JoinGroupReq): Observable<JoinGroupRes> {
    const { username, groupID } = user;

    return from(this.tim.joinGroup({ groupID, applyMessage: username })).pipe(
      map(imResponse => {
        const {
          code,
          data: { status }
        } = imResponse as any;

        if (code !== 0) {
          throw new Error(`Add user to group(${groupID}) failed`);
        } else {
          return { ...user, status };
        }
      })
    );
  }

  /**
   * 获取聊天室内的用户列表
   */

  getGroupMemberList(
    req: GetGroupMemberListReq
  ): Observable<GetGroupMemberListRes | null> {
    if (!!req.groupID) {
      return from(this.tim.getGroupMemberList(req));
    } else {
      return of(null);
    }
  }

  sendTextMessage({ to, text }: SendTextMessageReq) {
    const message = this.tim.createTextMessage({
      to,
      conversationType: TIM.TYPES.CONV_GROUP,
      payload: { text }
    });

    this.tim.sendMessage(message).then(imResponse => {
      console.log("response------>", imResponse);
      const {
        data: { message }
      } = imResponse as any;

      this.textMessages$.next(message);
    });
  }

  getTextMessages(groupID: string): Observable<SendTextMessageRes> {
    return this.textMessages$.pipe(
      filter(message => message && message.to === groupID)
    );
  }
}
