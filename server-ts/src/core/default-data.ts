/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-08 10:40:05
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-08 11:12:28
 */
import { Peer } from "./peer";

export class DefaultData {
  public static names: string[] = ['1', '2', '3', '4'];
  public static orders: number[] = [1, 2, 3, 4];


  public static getName(peers: Peer[]) {
    let selfs = peers.map(x => x.name);
    let news = DefaultData.arrSubtraction(DefaultData.names, selfs);
    if (news && news.length == 0) {
      return "违规昵称";
    }
    else {
      return news[0];
    }
  }


  public static getOrder(peers: Peer[]) {
    let selfs = peers.map(x => x.order);
    let news = DefaultData.arrSubtraction(DefaultData.orders, selfs);
    if (news && news.length == 0) {
      return -1;
    }
    else {
      return news[0];
    }
  }

  private static arrSubtraction<T>(a: T[], b: T[]) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.filter((i) => !b.includes(i));
    }
    return [];
  }

}
