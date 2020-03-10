import COSSDK from 'cos-js-sdk-v5';
import { from, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
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

interface CreateGroupRes {
  ownerID: string;
  groupID: string;
}

@Injectable({ providedIn: "root" })
export class TimService {
  tim: any;

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
  addUser(user: { username: string; id: string }) {
    console.log(user);
  }
}
