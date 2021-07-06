/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-06 15:13:54
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-06 16:00:41
 */
import { Component, OnInit } from '@angular/core';
import { audioStream, KeyValue } from '../../models/types';
import { ActivatedRoute } from '@angular/router';
import * as mediasoupClient from "mediasoup-client";
@Component({
  selector: 'app-room-ts',
  templateUrl: './room-ts.component.html',
  styleUrls: ['./room-ts.component.scss']
})
export class RoomTsComponent implements OnInit {

  roomId: string;
  name: string;

  //当前选中音频设备
  audioSelectValue: string;
  //当前选中视频设备
  videoSelectValue: string;

  audioSelects: KeyValue[] = [];
  videoSelects: KeyValue[] = [];

  //远程音频流
  remoteAudioStream: audioStream[] = [];


  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(x => {
      this.roomId = x['roomId'];
      this.name = x['name'];
      document.title = '当前用户名：' + this.name;
    });
  }

  ngOnInit() {
    this.initDevices();
    console.log(mediasoupClient);
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
