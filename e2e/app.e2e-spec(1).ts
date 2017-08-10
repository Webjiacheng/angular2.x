import { TestdemoPage } from './app.po';

describe('testdemo App', () => {
  let page: TestdemoPage;

  beforeEach(() => {
    page = new TestdemoPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
