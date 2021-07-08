/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-07 17:37:55
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-08 10:35:41
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KeyValue } from '../../models/types';
import * as io from 'socket.io-client';
import { RoomClientV4 } from '../../common/room-client-v4';

@Component({
  selector: 'app-room-v4',
  templateUrl: './room-v4.component.html',
  styleUrls: ['./room-v4.component.scss']
})
export class RoomV4Component implements OnInit {

  //当前选中音频设备
  audioSelectValue: string;
  //当前选中视频设备
  videoSelectValue: string;

  audioSelects: KeyValue[] = [];
  videoSelects: KeyValue[] = [];

  roomId: string;
  name:string;
  _socket: any;
  _rc: RoomClientV4;
  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(x => {
      this.roomId = x['roomId'];
      this.name = x['name'];
      document.title = '当前房间ID：' + this.roomId;
    });
  }


  ngOnInit() {
    this.initDevices();
    this.initSocket();
    this.joinRoom(this.roomId);


  }
  joinRoom(room_id) {
    let rc = this._rc;
    if (rc) {
      console.log('already connected to a room')
    } else {
      this._rc = new RoomClientV4(this._socket, room_id, this.name)
    }
  }
  public initSocket() {
    this._socket = io('https://localhost:3016');
    let socket = this._socket;
    socket.request = function request(type, data = {}) {
      return new Promise((resolve, reject) => {
        socket.emit(type, data, (data) => {
          if (data != null &&  data.error) {
            reject(data.error)
          } else {
            resolve(data)
          }
        })
      })
    }
  }
  initDevices() {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      devices.forEach(device => {
        let key = device.label, value = device.deviceId;
        let obj = { key, value } as KeyValue;
        if ('audioinput' === device.kind) {
          this.audioSelects.push(obj);
        } else if ('videoinput' === device.kind) {
          this.videoSelects.push(obj);
        }
      })
      this.audioSelectValue = this.audioSelects[0].value;
      this.videoSelectValue = this.videoSelects[0].value;
    }
    )
  }

}
