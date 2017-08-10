// 引入angular核心模块
import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, Renderer } from '@angular/core';
// 引入自定义服务
import { TodoDetailService } from './services/todo_detail.service';
import { AppLoginService, Device } from '../login/app.login.service';

// 获取路由参数
import { ActivatedRoute, Router } from '@angular/router';
// 生产环境与开发环境
import { environment } from '../../environments/environment';
//  导入 HTTP 库中的相关对象
import { Http, Response } from '@angular/http';
//设置title
import { Title } from '@angular/platform-browser';
import { Ng2DeviceService } from 'ng2-device-detector';

import * as _ from 'lodash';
import 'rxjs/add/operator/toPromise';
import { AuthHttpError } from 'angular2-jwt';



@Component({
  selector: 'todo-detail',
  templateUrl: './todo-detail.component.html',
  styleUrls: ['./todo-detail.component.css'],
  providers: [TodoDetailService, AppLoginService]
})

export class TodoDetailComponent implements OnInit, AfterViewChecked {
  @ViewChild('myTextarea') textarea: ElementRef;
  /**设备类型：ios/android */
  public mobileDevice: string = "";
  /**是否发送第一个请求完毕 */
  public isHasInitData: boolean = false;
  /**是否显示审批框 */
  public isShow: boolean = true;
  /**提交按钮的储存 */
  public status: number;
  /**审批框的提示文字 */
  public placeholder: string = '';
  /**页面类型的标题 */
  public detailTitle: string = '';
  /**判断是否显示成功页面 */
  public hidden_success: boolean = true;
  /**判断是否显示错误页面 */
  public hidden_error: boolean = true;
  /**返回错误信息的状态码 */
  public cb_dataErrCode: string = '';
  /**判断是否显示遮罩层 */
  public showMask: boolean = true;
  // 移动端的session
  public session: string = '';
  /**设备类型 */
  public device: Device;
  /** 请求参数：员工编号 */
  private qp_empId: string
  /** 请求参数：考勤申请流水号 */
  private qp_trxNumber: string
  /** 请求参数：考勤申请流程类型,如：INF_Leave */
  private qp_processId: string
  /** 请求参数：JWT */
  private qp_jwt: string
  /** 请求参数：手机端的用户session */
  private qp_session: string
  /** 是否显示重登录的遮罩提示 */
  public showReloginCover: boolean = false;
  /** 根据jwt获取到的审批人的工号 */
  private approver_empId: string;
  /** 是否显示审批列表 */
  public isDisplayApprovalButton: boolean = false;
  /** 是否调试移动端（mobile） */
  private isDebugMobile: boolean = false;
  /** 是否显示debug输入框区域 */
  public isHiddenDebugBox: boolean = true;
  /** 工作流信息 */
  public viewModel: any = {
    'applicatInfo': {},
    'historyList': []
  };

  constructor(
    public appLoginService: AppLoginService,
    public todoDetailService: TodoDetailService,
    public router: Router,
    public activeRoute: ActivatedRoute,
    private renderer: Renderer,
    private http: Http,
    private titleService: Title,
    private deviceService: Ng2DeviceService
  ) { };
  ngOnInit(): void {
    this.mobileDevice = this.deviceService.device;
    this.mobileDebugLog();
    this.activeRoute.params.subscribe(// 获取终端设备
      params => {
        this.device = this.appLoginService.parseDevice(params['device']);
      }
    );
    this.activeRoute.queryParams.subscribe(// 获取地址栏上的参数，保存，初始化登录，获取该事务订单
      queryParams => {
        this.qp_empId = queryParams['EMPLID'];
        this.qp_trxNumber = queryParams['TRANSACTION_NBR'];
        this.qp_processId = queryParams['PRCS_ID'];
        this.qp_jwt = queryParams['jwt'];
        this.isDebugMobile = queryParams['debug'] == "true" ? true : false;

        this.appLoginService.initLogin(this.device, queryParams);

        this.getTodoDetail();

        this.approver_empId = this.appLoginService.decodeToken()['employeeNumber'];
      }
    );

    this.detailTitle = this.todoDetailService.translateTitle(this.qp_processId);
    this.titleService.setTitle(this.detailTitle);

  }
  /**
   * 点击批准或拒绝时自动获取焦点
   */
  ngAfterViewChecked() {
    this.renderer.invokeElementMethod(this.textarea.nativeElement,
      'focus');
  }

  /**
   * 获取该事务的订单明细
   */
  public async getTodoDetail() {
    try {
      if (this.appLoginService.isTokenNotExistedOrExpired()) {
        console.log("Token not exist or expired!");
        return;
      }
      const data = await this.getTodoDetailPromise();
      console.log(data);
      this.constructViewModel(data['data']);
      this.isHasInitData = true;
    } catch (error) {
      console.log("执行错误捕捉");
      // 错误时触发
      this.handleAsyncAndAwiteError(error);
      this.isHasInitData = true;
    }
  }

  public getTodoDetailPromise() {
    return this.todoDetailService.getTodoDetail(this.qp_processId, this.qp_empId, this.qp_trxNumber).toPromise();
  }

  /**
   * 组装视图模型
   * @param data 事务的数据明细
   */
  private async constructViewModel(data: object) {
    const vm: any = {};

    // 1.组装申请人信息栏的model
    vm.applicatInfo = await this.getEmployeeInfo(data['EMPLID']);
    vm.applicatInfo.submitDate = data['SUBMIT_DT'];
    console.log('vm.applicatInfo:', vm.applicatInfo);

    // 2.组装考勤信息栏的model
    // vm.leaveDetailInfo = this.getLeaveDetailInfo(vm)
    // vm.workOTDetailInfo = this.getWorkOTDetailInfo(vm)
    // vm.workOTDetailInfo = this.getWorkOTConfirmDetailInfo(vm)
    // vm.punchCardAbnormallInfo = this.getPunchCardAbnormallInfo(vm)
    // vm.revocationDetailInfo = this.getRevocationDetailInfo(vm)

    vm.applyDetails = this.getApplyDetails(data);
    console.log(vm.applyDetails)
    vm.applyReason = _.isString(data['COMMENTS']) ? data['COMMENTS'] : '无';

    // 3.组装审批列表栏的model
    vm.historyList = await this.getHistoryList(data) || [];

    // 4.判断是否显示“审批”和“拒绝”按钮
    this.checkIfNeedHiddenApproverButton(data);


    this.viewModel = vm;
  }

  private getApplyDetails(data) {
    console.log(data);
    let list = [];
    switch (this.qp_processId) {
      case 'INF_Leave':
        list = this.getLeaveDetailInfo(data);
        break;
      case 'INF_OT':
        list = this.getWorkOTDetailInfo(data);
        break;
      case 'INF_OTIME_CONF':
        list = this.getWorkOTConfirmDetailInfo(data);
        break;
      case 'INF_Revocation':
        list = this.getRevocationDetailInfo(data);
        break;
      case 'INF_PUNCH_CARD':
        list = this.getPunchCardAbnormallInfo(data);
        break;
      default: {
        console.log('非法标题');
      }

    }
    return list;
  }

  /**
   * 将请假的工作流组装后返回
   * @param data 请假的工作流信息
   */
  private getLeaveDetailInfo(data) {
    const list = [];

    list.push(this.kv('假期类型', this.todoDetailService.translateTakeType(data['PIN_TAKE_NUM'])));
    const startTime = _.isObject(data['START_TIME']) ? "09:00" : data['START_TIME'].split(" ")[1];
    const entTime = _.isObject(data['END_TIME']) ? "18:00" : data['END_TIME'].split(" ")[1];
    list.push(this.kv('开始时间', data['BGN_DT'] + " " + startTime));
    list.push(this.kv('结束时间', data['END_DT'] + " " + entTime));
    list.push(this.kv('实际请假天数/时数', data['INF_DURATION_ABS'] + data['INF_ACCOUNT_UNIT']));
    list.push(this.kv('特批时数', data['INF_SPC_APPR_HRS'] + "小时"));

    return list;
  }

  private kv(label: string, value: any) {
    return { label, value }
  }

  /**
   * 将加班的工作流组装后返回
   * @param data 加班的工作流信息
   */
  private getWorkOTDetailInfo(data) {
    const list = [];

    list.push(this.kv('加班类型', this.todoDetailService.translateTakeType(data['PIN_TAKE_NUM'])))
    list.push(this.kv('加班日期', data['INF_OT_DATE'].replace(/-/g, "/")))
    list.push(this.kv('开始时间', data['START_TIME'].split(" ")[1]))
    list.push(this.kv('结束时间', data['END_TIME'].split(" ")[1]))
    list.push(this.kv('加班时数', data['INF_OT_HRS'] + "小时"))

    return list;
  }

  /**
   * 将加班确认的工作流组装后返回
   * @param data 加班确认的工作流信息
   */
  private getWorkOTConfirmDetailInfo(data) {
    const list = [];

    list.push(this.kv('加班类型', this.todoDetailService.translateTakeType(data['PIN_TAKE_NUM'])))
    list.push(this.kv('加班日期', data['INF_OT_DATE'].replace(/-/g, "/")))
    list.push(this.kv('加班时数', data['INF_OT_HRS'] + "小时"))
    list.push(this.kv('提交日期', data['SUBMIT_DT'].replace(/-/g, "/")))
    list.push(this.kv('实际加班开始时间', data['START_TIME'].split(" ")[1]))
    list.push(this.kv('实际加班结束时间', data['END_TIME'].split(" ")[1]))
    list.push(this.kv('实际加班时数', data['INF_OT_HRS'] + "小时"))

    return list;
  }

  /**
   * 将打卡异常的工作流组装后返回
   * @param data 打卡异常的工作流信息
   */
  private getPunchCardAbnormallInfo(data) {
    const list = [];
    if (_.isString(data['START_TIME2'])) {//判断开始时间是不是字符串
      list.push(this.kv('开始时间', data['START_TIME2'].slice(0, -4).replace(/-/g, "/")))
      list.push(this.kv('结束时间', data['START_TIME'].slice(0, -4).replace(/-/g, "/")))
    } else {
      list.push(this.kv('开始时间', data['INF_PUNCH_CARD_DT'].replace(/-/g, "/") + " 09:00"))
      list.push(this.kv('结束时间', data['END_DATE'].replace(/-/g, "/") + " 18:00"))
    }
    list.push(this.kv('类型', this.todoDetailService.translateTakeType(data['INF_PUC_TYPE'])))

    return list;
  }

  /**
   * 将销假的工作流组装后返回
   * @param data 销假的工作流信息
   */
  private getRevocationDetailInfo(data) {
    const list = [];

    list.push(this.kv('假期类型', this.todoDetailService.translateTakeType(data['PIN_TAKE_NUM'])));
    const startTime = _.isObject(data['START_TIME']) ? "09:00" : data['START_TIME'].split(" ")[1];
    const entTime = _.isObject(data['END_TIME']) ? "18:00" : data['END_TIME'].split(" ")[1];
    list.push(this.kv('开始时间', data['BGN_DT'].replace(/-/g, "/") + " " + startTime));
    list.push(this.kv('结束时间', data['END_DT'].replace(/-/g, "/") + " " + entTime));
    list.push(this.kv('实际请假天数/时数', data['INF_DURATION_ABS'] + data['INF_ACCOUNT_UNIT']));
    list.push(this.kv('特批时数', data['INF_SPC_APPR_HRS'] + "小时"));

    return list;
  }

  /**
   * 组装审批历史数据
   * @param data 审批人历史数据 
   */
  private async getHistoryList(data) {
    let resList = [];

    //1.获取审批人列表
    const approveList = data['APPR_LIST']['APPR_LIST_GROUP'];
    //2.判断是数组还是对象
    if (_.isArray(approveList)) {//多个审批人
      resList = _.map(approveList, (item) => {
        item['comment'] = this.getApproveComment(item['OPRID'], data);
        const tmp = this.getApproveListItem(item)
        return tmp;
      })
    } else if (_.isObject(approveList)) {//1个审批人
      const item = approveList;
      item['comment'] = this.getApproveComment(item['OPRID'], data);
      resList = [await this.getApproveListItem(item)];
    }
    console.log('ApproveList list:', resList);
    resList = _.filter(resList, (item) => {
      return item['wfAction'] !== 'N';
    });

    return resList;
  }

  /**
   * 比对审批人id返回其评论内容
   * @param id 审批人ID
   * @param data 总数据
   */
  private getApproveComment(id, data) {
    let comment = undefined;
    try {//有审批历史列表
      const approveHistList = data['APPR_HIST']['APPR_HIST_GROUP'];
      if (_.isArray(approveHistList)) {
        comment = _.result(_.find(approveHistList, function (item) {
          return item['EMPLID_CURR_APPR'] === id;
        }), 'COMMENTS');
        if (_.isObject(comment)) {
          comment = "没有填写";
        }
      } else if (_.isObject(approveHistList)) {
        if (approveHistList['EMPLID_CURR_APPR'] === id) {
          comment = _.isObject(approveHistList['COMMENTS']) ? "没有填写" : approveHistList['COMMENTS'];
        }
      }
    } catch (e) {//没有审批历史列表

    }
    return comment;
  }

  private getApproveListItem(item: any) {
    const self = this;
    const alitem = {
      /*审批人的单个数据模型
      EOAWDTTM_MODIFIED:'2017-07-20 15:59:23 '
      EOAWORIG_OPRID:'0008974'
      EOAWSTEP_STATUS:'A'
      OPRID:'0008974'*/
      'comment': item['comment'],
      'actionDate': _.isString(item['EOAWDTTM_MODIFIED']) ? item['EOAWDTTM_MODIFIED'] : "",
      'wfAction': item['EOAWSTEP_STATUS'],
      'wfActionDesc': self.todoDetailService.translateApprovalStatus(item['EOAWSTEP_STATUS']),
      'approverID': item['OPRID'],
    }
    
    if(item['OPRID']!=item['EOAWORIG_OPRID']){
      this.getEmployeeName(item['OPRID']).then((name) => { alitem['approverName'] = name });
      this.getEmployeeName(item['EOAWORIG_OPRID']).then((name) => { alitem['entrustName'] = name+"委托" });
    }else{
      this.getEmployeeName(item['OPRID']).then((name) => { alitem['approverName'] = name });
      alitem['entrustName']=null;
    }
    return alitem;
  }

  /**
   * 获取员工名称
   * @param employeeNumber 员工id
   */
  private async getEmployeeName(employeeNumber) {
    const empolyeeInfo = await this.getEmployeeInfo(employeeNumber)
    return empolyeeInfo['chsName'];
  }

  /**
   * 获取员工的用户信息
   * @param employeeNumber 员工id
   */
  private async getEmployeeInfo(employeeNumber) {
    const employeeInfo = await this.getEmployeeInfoPromise(employeeNumber);
    return employeeInfo['data']['userinfo'];
  }

  /**
   * 是否显示审批按钮
   * @param data 工作流订单详情
   */
  private checkIfNeedHiddenApproverButton(data) {

    // 1.获取审批人列表
    const approveList = data['APPR_LIST']['APPR_LIST_GROUP'];

    const match = (item) => {
      return item['EOAWSTEP_STATUS'] === 'P' && item['OPRID'] === this.approver_empId
    }

    // 2.判断是数组还是对象
    if (_.isArray(approveList)) {// 多个审批人, 遍历collection，判断当前登录人与审批人相同，并且流程状态是‘P'
      this.isDisplayApprovalButton = _.find(approveList, (item) => {
        return match(item);
      }) !== undefined

    } else if (_.isObject(approveList)) {// 1个审批人，当前登录人与审批人相同，并且流程状态是‘P'
      const item = approveList;
      this.isDisplayApprovalButton = match(item);
    }
  }

  /**
   * 根据员工id获取该员工的信息，如名字...
   * @param accountName 员工id
   */
  private getEmployeeInfoPromise(accountName: string): Promise<any[]> {
    if (!this.appLoginService.isAuthenticated()) {
      return;
    }
    return this.todoDetailService.getUserInfo(accountName).toPromise()
  }
  /**
   * 点击返回按钮触发的事件
   */
  public goback() {
    console.log('token exprire:' + this.appLoginService.isTokenExpired());
    // this.getTodoDetail();
    // _.toPath
    location.href = environment.mobileApprovalSuccessUrl;
  }
  // 显示隐藏审批输入框
  public Show(status: number) {
    this.isShow = !this.isShow;
    switch (status) {
      case 1:
        console.log('记录批准状态');
        this.status = 1;
        this.placeholder = '';
        this.textarea.nativeElement.value = '同意';
        break;
      case -1:
        console.log('记录拒绝状态');
        this.status = 0;
        this.placeholder = '请输入拒绝意见（非必填）';
        this.textarea.nativeElement.value = ''
        break;
      case 200:
        console.log('触发提交按钮');
        if (this.status == 1) {
          console.log('提交数据到批准接口');
          this.showMask = false;
          //  this.handleLeave(this.TRANSACTION_NBR, '0008974', this.textarea.nativeElement.value);
          this.approve();
        } else if (this.status == 0) {
          console.log('提交数据到拒绝接口');
          this.showMask = false;
          //  this.refusedLeave(this.TRANSACTION_NBR, '0008974', this.textarea.nativeElement.value);
          this.disapprove();
        }
        break;
      case 0:
        console.log('触发取消按钮');
        break;
      default:
        console.log('未匹配');
        break;
    }
  }

  /**
   * 发送请假批准请求
   */
  private approve() {

    const operatorId = this.approver_empId;
    const comments = this.textarea.nativeElement.value;
    this.todoDetailService.approve(this.qp_processId, this.qp_trxNumber, operatorId, comments)
      .subscribe(this.commonApprovalRespHandler(), this.errorHandlerBuilder())


  }

  /**
  * 发送请假拒绝请求
  */
  private disapprove() {

    const operatorId = this.approver_empId;
    const comments = this.textarea.nativeElement.value;

    this.todoDetailService.deny(this.qp_processId, this.qp_trxNumber, operatorId, comments)
      .subscribe(this.commonApprovalRespHandler(), this.errorHandlerBuilder())

  }


  /**
   * 显示登陆遮罩层
   */
  private showLoginCover() {
    this.showReloginCover = true;
  }

  /**
   * 重新登陆
   */
  public reLogin() {
    this.appLoginService.removeToken();
    location.reload()
  }


  /**
   * 返回错误时的处理
   */
  private errorHandlerBuilder() {
    return (error) => {
      this.handleAsyncAndAwiteError(error);
    }

  }

  /**
   * 处理同步或异步产生的错误
   * @param error 同步或异步捕获到的错误内容
   */
  private handleAsyncAndAwiteError(error) {
    const self = this;
    if (error.status === 504) {
      console.log('服务器无响应,请联系管理员');
    } else {
      const errorString = error.toString();
      const isExistNoJwt = errorString.indexOf('No JWT present');
      const isExistJwtExpired = errorString.indexOf('expired');
      self.showMask = true;//隐藏加载页面
      if (isExistNoJwt > 0 && isExistJwtExpired > 0) {//点击提交按钮时jwt过期了
        self.showLoginCover();//显示重新等登陆页面
      } else {//未知错误
        console.log(error);
      }
    }
  }

  /**
   * 返回正确信息的处理
   */
  private commonApprovalRespHandler() {
    const self = this;

    return (error) => {
      this.cb_dataErrCode = error.errcode;
      if (error['success']) {
        self.hidden_success = false;
        self.showMask = true;
        setTimeout(() => {
          //self.hidden_success = true;
          //审批成功后要做什么操作
          //self.isDisplayApprovalButton = false;
          self.approvalDoneTodo();
        }, 3000);
      } else {
        self.hidden_error = false;
        self.showMask = true;
        setTimeout(() => {
          self.hidden_error = true;
          self.approvalDoneTodo();
        }, 3000);
      }
    }
  }

  /**
   * 审批成功/失败后 移动端和PC段所要做的操作
   */
  private approvalDoneTodo() {
    if (this.device === 0) {//移动端要跳转
      location.href = environment.mobileApprovalSuccessUrl;
    } else if (this.device === 1) {//pc端要关闭页面
      location.reload();
    }
  }

  /**
   * 移动端日志埋点处理
   */
  private mobileDebugLog() {//3种情况：1.pc端输出在控制台 2.mobile端debug 3.mobile端不debug
    if (0 === this.device) {//mobile端debug
      if (this.isDebugMobile) {
        this.isHiddenDebugBox = false;
        window['console']['log'] = this._log;
      }
    }
  }

  private _log(msg, param) {
    window['debug']['log'](msg);
  }

  /**
   * 移动端debug情况下执行脚本
   * @param debugScript 需要执行的脚本
   */
  public runScript(debugScript: string) {
    eval(debugScript)
  }


}