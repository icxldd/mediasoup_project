/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-03 22:15:24
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-06 15:26:55
 */

export interface KeyValue {
  key: string;
  value: string;
}

export interface videoStream extends stream {

}
export interface audioStream extends stream {

}


export interface stream {
  id: string;
  stream: any;
}