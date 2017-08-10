import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, Http, RequestOptions } from '@angular/http';
import { AppComponent } from './app.component';
//判断设备
import { Ng2DeviceDetectorModule } from 'ng2-device-detector';
//路由模块
import { RouterModule, Routes } from '@angular/router';

//导入组件 
import { TodoDetailComponent } from './todo_detail/todo-detail.component';

import { AUTH_PROVIDERS, provideAuth, AuthHttp, AuthConfig } from 'angular2-jwt';
import { tokenGetter } from './login/app.login.service';
import { AuthGuard } from './common/auth.guard';
//接入示例:
//http://127.0.0.1:4200/#/mobile/detail?PRCS_ID=INF_Leave&TRANSACTION_NBR=353440&EMPLID=0001411&SUBMIT_DT=2016-11-21
//http://127.0.0.1:4200/#/mobile/detail?PRCS_ID=INF_Leave&TRANSACTION_NBR=834123&EMPLID=0009818
const appRoutes: Routes = [
  // { path: '', redirectTo: '/todo', pathMatch: 'full' },
  { path: ':device/detail', component: TodoDetailComponent/*, canActivate: [AuthGuard]*/ }

];

export function authHttpServiceFactory(http: Http, options: RequestOptions) {
  return new AuthHttp( new AuthConfig({tokenGetter}), http, options);
}

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes, { useHash: true }),
    Ng2DeviceDetectorModule.forRoot(),
  ],
  declarations: [
    AppComponent,
    TodoDetailComponent,
  ],
  providers: [
    // TodoService,
    // AppLoginService,
    AuthGuard,
    {
      provide: AuthHttp,
      useFactory: authHttpServiceFactory,
      deps: [ Http, RequestOptions ]
    }
    // ...AUTH_PROVIDERS
  ],
  bootstrap: [AppComponent],
})

export class AppModule { }
