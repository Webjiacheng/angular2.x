import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions, URLSearchParams } from '@angular/http';

import 'rxjs/add/operator/toPromise';


import { environment } from '../../environments/environment';
import { JwtHelper, tokenNotExpired, AuthConfigConsts } from 'angular2-jwt'
import * as _ from 'lodash'


const CONST_TOKEN_NAME = AuthConfigConsts.DEFAULT_TOKEN_NAME;
const CONST_SESSION_KEY_HIWORK = 'session.hiwork'
const CONST_SESSION_KEY_DEVICE = 'session.device'

/** 修改全局存放地方 */
const g_storage = sessionStorage;

@Injectable()
export class AppLoginService {

  private userInfo = {
    'authenticated': false
  };
  private authenticated = false;

  private jwtHelper: JwtHelper;

  constructor(public http: Http) {
    // this.checkLogin();
    this.bindWindowFunc_FinishGetSession();
    this.jwtHelper = new JwtHelper()
  }



  public initLogin(device: Device, queryParams: object) {

    if (queryParams) {
      if (queryParams['jwt']) {
        this.saveToken(queryParams['jwt']);
        // 去掉‘jwt’参数，再次请求页面
        location.href = location.href.split('&jwt=')[0];
        return;
      }

      if (queryParams['appSessionCode']) {
        this.saveHiworkSession(queryParams['appSessionCode']);
      }
    }

    if (!_.isUndefined(device)) {
      this.saveDevice(device);
    }

    // this.auth().catch(() => {
    //   this.tryLogin(device);
    // })

    if (this.isTokenNotExistedOrExpired()) {
      this.tryLogin(device);
    }

  }

  public auth(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isAuthenticated()) {
        reject('会话信息不存在');
      } else if (this.isTokenExpired()) {
        reject('会话信息过期');
      } else {
        resolve();
      }
    });
  }

  public tryLogin(device) {

    if (device === Device.PC) {

      this.locate2PCLoginPage();

    } else if (device === Device.Mobile) {
      const hiwork_session = this.getHiworkSession();
      if (hiwork_session) {
        // 如果请求地址带有‘session’参数，直接获取后，调用后台获取jwt
        this.callMobileLoginAndSaveToken(hiwork_session, undefined);
      } else {
        // 调用window域的函数，进行session的获取
        this.callWindowFunc_getAppCurrentSession();
      }
    }
  }

  /**
   * 绑定window全局函数，用户Hiwork登录完成后注入session
   */
  private bindWindowFunc_FinishGetSession() {
    window['Infinitus_finishGetSession'] = this.callMobileLoginAndSaveToken;
  }

  private callMobileLoginAndSaveToken(session: string, err: any) {
    this.postMobileLogin(session)// 调用自定义服务上移动端获取jwt的方法
      .subscribe(
      jwt => {
        this.saveToken(jwt);
        location.reload();
      }, error => {
        alert('[AppLoginService#bindWindowFunc_FinishGetSession()][error:%s]' + error);
      });
  };

  public postMobileLogin(session: string) {
    const path = '/sso/mobile/login';
    const url = environment.hostName + path;
    return this.http.post(url, {
      session: session,
    }).map((res: Response) => res.json().data.jwt)
  }

  private callWindowFunc_getAppCurrentSession() {
    try {
      window['Infinitus_getAppCurrentSession']();
    } catch (e) {
      console.error('[AppLoginService#callWindowFunc_getAppCurrentSession()][error:%s]' + e.toString(), e);
      alert('调用Infinitus_getAppCurrentSession方法失败');
    }
  };

  /**
   * 解释的终端类型
   * @private
   * @param {String} device 请求的路径解释
   * @returns device Device
   */
  public parseDevice(device: String) {
    switch (device) {
      case 'mobile': return Device.Mobile;
      case 'pc': return Device.PC;
      default: return Device.PC;
    }
  }

  private check() {
    const token = this.getToken();
    this.userInfo.authenticated = !!token;
  }

  public isAuthenticated() {
    this.check();
    return this.userInfo.authenticated;
  }

  public isTokenNotExistedOrExpired() {
    return !tokenNotExpired(AuthConfigConsts.DEFAULT_TOKEN_NAME, this.getToken());
  }

  private getStorage(): Storage {
    return g_storage;
  }

  private saveHiworkSession(session: string) {
    this.getStorage().setItem(CONST_SESSION_KEY_HIWORK, session);
  }

  private getHiworkSession() {
    return this.getStorage().getItem(CONST_SESSION_KEY_HIWORK);
  }

  private saveDevice(device: Device) {
    this.getStorage().setItem(CONST_SESSION_KEY_DEVICE, device.toString());
  }

  private getDevice() {
    return this.getStorage().getItem(CONST_SESSION_KEY_DEVICE);
  }


  private removeHiworkSession() {
    this.getStorage().removeItem(CONST_SESSION_KEY_HIWORK);
  }

  private existHiworkSession() {
    return !!this.getHiworkSession();
  }

  public saveToken(jwt: string) {
    tokenSetter(CONST_TOKEN_NAME, jwt);
    // this.getStorage().setItem(CONST_TOKEN_NAME, jwt);
  }

  public removeToken() {
    this.getStorage().removeItem(CONST_TOKEN_NAME);
  }

  public getToken(): string {
    // return this.getStorage().getItem(CONST_TOKEN_NAME);
    return tokenGetter(CONST_TOKEN_NAME);
  }

  public isTokenExpired(): boolean {
    return this.jwtHelper.isTokenExpired(this.getToken());
  }

  public decodeToken() {
    return this.isTokenNotExistedOrExpired() ?  "" : this.jwtHelper.decodeToken(this.getToken()) ;
  }

  public getAuthHeader() {
    return {
      Authorization: 'Bearer ' + this.getToken(),
    };
  }
  public locate2PCLoginPage() {
    const cbUrl = encodeURIComponent(location.href);
    location.href = environment.serverHost + '/sso/pc/login?cb=' + cbUrl;
  }
}

export function tokenGetter(tokenName = CONST_TOKEN_NAME) {
  return g_storage.getItem(tokenName);
};

export function tokenSetter(tokenName = CONST_TOKEN_NAME, token: string) {
  g_storage.setItem(tokenName, token);
};

export enum Device { Mobile, PC };
