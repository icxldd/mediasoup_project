/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-03 17:48:22
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-03 17:51:49
 */
export class CommonHelp {
  public static async timingCall(fun, time) {
    setInterval(fun, time * 1000);
  }
}
