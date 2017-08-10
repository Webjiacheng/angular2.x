import { Component, OnInit, AfterContentChecked } from '@angular/core';
// 获取路由参数
import { ActivatedRoute, Router } from '@angular/router';
// 生产环境与开发环境
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  
  public isDebugMobile: boolean = false;

  public device: string = "";

  constructor(
    public activeRoute: ActivatedRoute
  ) { };

  ngOnInit(): void {
    const locationUrl = location.href;
    this.device = locationUrl.indexOf("mobile") > 0 ? "mobile" : "pc";
    const hasParamDebug = locationUrl.indexOf("debug") > 0 ? true : false;
    if (hasParamDebug) {
      this.isDebugMobile = this.isDebug(locationUrl);
    }
    this.appendDebugScript();
  }

  /**
   * 往页面插入debug.js 
   */
  public appendDebugScript() {
    if ((this.device === "mobile") && (this.isDebugMobile)) {
      let debug = document.createElement('script');
      debug.setAttribute('src', './assets/debug/debug.min.js');
      document.getElementsByTagName('body')[0].appendChild(debug);
    }
  }

  /**
   * 存在debug参数时返回是否调试
   * @param url 地址栏
   */
  private isDebug(url: string) {
    const urlArr = url.split("?")[1].split("&");
    let isDebug = false;
    urlArr.forEach((item) => {
      if (item.split('=')[0] == "debug") {
        if (item.split('=')[1] == "true") {
          isDebug = true;
        }
      }
    })
    return isDebug;
  }


}

