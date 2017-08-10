import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions, URLSearchParams } from '@angular/http';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { environment } from '../../../environments/environment';
import { AuthHttp } from 'angular2-jwt';

@Injectable()
export class TodoDetailService {
    // api接口示例：http:// localhost:7004/api/leave?empid=0009818&trxnum=834103
    constructor(public http: Http, public authHttp: AuthHttp) {
    }

    /**
     * 根据路径的信息获取简单信息
     * @param processId 要调用的接口类型
     * @param empId 申请人的id
     * @param transactionNbr 工作流id
     * @return 申请人的具体信息
     */
    public getTodoDetail(processId: string, empId: string, transactionNbr: string): Observable<any[]> {
        console.log('[processId=%s][empId=%s][transactionNbr=%s]', processId, empId, transactionNbr);
        let path = '';
        switch (processId) {
            case 'INF_Leave':
                path = '/api/hris/leave/details'
                break;
            case 'INF_OT':
                path = '/api/hris/workot/details'
                break;
            case 'INF_OTIME_CONF':
                path = '/api/hris/workotcf/details'
                break;
            case 'INF_PUNCH_CARD':
                path = '/api/hris/abnormal_punch/details'
                break;
            case 'INF_Revocation':
                path = '/api/hris/revocation/details'
                break;
            default: {
                console.error('[TodoDetailService#getTodoDetail()][error:非法参数]', processId);
            }
        }
        path = path + '?EMPID=' + empId + '&TRANSACTION_NBR=' + transactionNbr
        // return this.http.get(url, this.commonRequestOptions()).map((res: Response) => res.json())
        return this.httpGet(path)
    }


    /**
     * 根据员工id获取详细信息
     * @param {string} accountName 申请人的工号
     * @returns {Observable<any[]>}
     */
    public getUserInfo(accountName: string): Observable<any[]> {
        const path = '/api/user/?accountName=' + accountName;
        return this.httpGet(path);
    }

    /**
     * 审批通过
     * @param processId 要调用的接口类型
     * @param {string} transactionNbr 流水号
     * @param {string} operatorId 操作人ID
     * @param {string} comments 批准意见
     * @returns {Observable<any[]>}
     */
    public approve(processId: string, transactionNbr: string, operatorId: string, comments: string): Observable<any[]> {

        let path = '';
        switch (processId) {
            case 'INF_Leave':
                path = '/api/hris/leave/approve'
                break;
            case 'INF_OT':
                path = '/api/hris/workot/approve'
                break;
            case 'INF_OTIME_CONF':
                path = '/api/hris/workotcf/approve'
                break;
            case 'INF_PUNCH_CARD':
                path = '/api/hris/abnormal_punch/approve'
                break;
            case 'INF_Revocation':
                path = '/api/hris/revocation/approve'
                break;
            default: {
                console.error('[TodoDetailService#approve()][error:非法参数]', processId);
            }
        }

        return this.httpPost(path, {
            TRANSACTION_NBR: transactionNbr,
            OPERATORID: operatorId,
            COMMENTS: comments
        })
    }

    /**
     * 审批拒绝
     * @param processId 要调用的接口类型
     * @param {string} transactionNbr 流水号
     * @param {string} operatorId 操作人ID
     * @param {string} comments 批准意见
     * @returns {Observable<any[]>}
     */
    public deny(processId: string, transactionNbr: string, operatorId: string, comments: string): Observable<any[]> {

        let path = '';
        switch (processId) {
            case 'INF_Leave':
                path = '/api/hris/leave/deny'
                break;
            case 'INF_OT':
                path = '/api/hris/workot/deny'
                break;
            case 'INF_OTIME_CONF':
                path = '/api/hris/workotcf/deny'
                break;
            case 'INF_PUNCH_CARD':
                path = '/api/hris/abnormal_punch/deny'
                break;
            case 'INF_Revocation':
                path = '/api/hris/revocation/deny'
                break;
            default: {
                console.error('[TodoDetailService#approve()][error:非法参数]', processId);
            }
        }

        return this.httpPost(path, {
            TRANSACTION_NBR: transactionNbr,
            OPERATORID: operatorId,
            COMMENTS: comments
        })
    }

    private commonRequestOptions(): RequestOptions {
        const headers = new Headers({
            'Accept': 'application/json',
            'Content-type': 'application/json'
        });
        // const headers = new Headers({
        //     'Accept': 'application/json',
        //     'Authorization': 'Bearer ' + this.getJWT()
        // });
        const options = new RequestOptions({ headers });
        return options;
    }

    /**
     *  发送http get 请求，其中后端服务的hostName从{environment}读取，请求的Header是。
     * @private
     * @param {string} path 请求的path
     * @returns Observable
     */
    private httpGet(path: string): Observable<any[]> {
        const url = environment.hostName + path;
        console.log('[httpGet()][url=%s]', url);
        // return this.http.get(url, this.commonRequestOptions()).map((res: Response) => res.json())
        return this.authHttp.get(url, this.commonRequestOptions()).map((res: Response) => res.json())
    }

    /**
     *  发送http get 请求，其中后端服务的hostName从{environment}读取，请求的Header是。
     * @private
     * @param {string} path 请求的path
     * @param {object} params post参数
     * @returns Observable
     */
    private httpPost(path: string, params: object): Observable<any[]> {
        const url = environment.hostName + path;
        console.log('[httpPost()][url=%s]', url);
        // return this.http.post(url, params, this.commonRequestOptions()).map((res: Response) => res.json())
        return this.authHttp.post(url, params, this.commonRequestOptions()).map((res: Response) => res.json())
    }

    public translateTakeType(typeCode) {
        let formType = '';
        switch (typeCode) {
            case '250253': formType = '年假'; break;
            case '250255': formType = '无薪病假'; break;
            case '250284': formType = '调休'; break;
            case '250231': formType = '事假'; break;
            case '250254': formType = '带薪病假'; break;
            case '250270': formType = '婚假'; break;
            case '250271': formType = '产检假'; break;
            case '250273': formType = '产假'; break;
            case '250274': formType = '陪产假'; break;
            case '250282': formType = '哺乳假'; break;
            case '250272': formType = '计划生育假'; break;
            case '250283': formType = '丧假'; break;
            case '250269': formType = '探亲假'; break;
            case '250511': formType = '公假'; break;
            case '250524': formType = '长期服务奖'; break;
            case '250521': formType = '市场考察假期'; break;
            case '250560': formType = '工伤假'; break;
            case '250591': formType = '生日假'; break;
            case '250287': formType = '休息日加班（计加班费）'; break;
            case '250292': formType = '休息日加班（转调休）'; break;
            case '250285': formType = '工作日加班（计加班费）'; break;
            case '250291': formType = '工作日加班（转调休）'; break;
            case '250289': formType = '节假日加班（计加班费）'; break;
            case '01': formType = '未带卡'; break;
            case '02': formType = '漏打卡'; break;
            case '03': formType = '外出'; break;
            case '04': formType = '出差'; break;
            case '05': formType = '其他'; break;
            default:
                formType = '[unknown form type]'
                break;
        }
        return formType;
    }

    // 改变状态信息，将APV DNY改为已同意 已拒绝translateApprovalStatus
    public translateApprovalStatus(status: string) {
        switch (status) {
            case 'APV':
                return '已批准';
            case 'DNY':
                return '已拒绝';
            case 'P':
                return '处理中';
            case 'A':
                return '已批准';
            case 'D':
                return '已拒绝';
            case 'N':
                return '未发送';
            case 'L':
                return '勿需审批';
        }
    }

    /**
   * 转换标题
   * @private
   * @param {string} processId 处理类型，如 INF_Leave
   */
    public translateTitle(processId: string) {
        let detailTitle = '';
        switch (processId) {
            case 'INF_Leave':
                detailTitle = '请假申请';
                break;
            case 'INF_OT':
                detailTitle = '加班申请';
                break;
            case 'INF_OTIME_CONF':
                detailTitle = '加班确认申请';
                break;
            case 'INF_Revocation':
                detailTitle = '销假申请';
                break;
            case 'INF_PUNCH_CARD':
                detailTitle = '打卡异常申请';
                break;
            default: {
                console.log('translateTitle() 非法processId', processId);
            }
        }
         return detailTitle;
    }

}
