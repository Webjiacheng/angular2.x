//当前环境下的文件内容将覆盖这些在构建。
//构建系统默认的dev环境使用的环境。ts’,但如果你做的
// ng build --env=prod'然后' environment.prod.ts将用来替代。
// env的列表映射到哪些文件可以在“.angular-cli.json”

export const environment = {
  production: false,
  msg: '我是开发环境',
  hostName: '',
  serverHost: '',
  mobileApprovalSuccessUrl: 'https://hiworktn-test.infinitus-int.com/gtask/mobile/index'
};
