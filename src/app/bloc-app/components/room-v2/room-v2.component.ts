/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-03 17:30:03
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-03 20:15:05
 */
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonHelp } from '../../common/common-help';
import { KeyValue, stream } from '../../models/types';
import * as io from 'socket.io-client';
import { RoomClientV2, _EVENTSV2 } from '../../common/room-client-v2';
@Component({
  selector: 'app-room-v2',
  templateUrl: './room-v2.component.html',
  styleUrls: ['./room-v2.component.scss']
})
export class RoomV2Component implements OnInit {

  roomId: string;
  name: string;

  //当前选中音频设备
  audioSelectValue: string;
  //当前选中视频设备
  videoSelectValue: string;

  audioSelects: KeyValue[] = [];
  videoSelects: KeyValue[] = [];


  //按钮是否显示
  if_startAudio: boolean = true;
  if_stopAudio: boolean = false;
  if_startVideo: boolean = true;
  if_stopVideo: boolean = false;
  if_startScreen: boolean = true;
  if_stopScreen: boolean = false;
  if_videoMedia: boolean = true;


  //视频流
  localStream: stream;
  //远程音频流
  remoteAudioStream: stream[];
  //远程视频流
  remoteVideoStream: stream[];



  //lib
  _socket;
  _mediasoupClient;
  _window: any = window;
  _rc: RoomClientV2;

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(x => {
      this.roomId = x['roomId'];
      this.name = x['name'];
      document.title = '当前用户名：' + this.name;
    });
  }

  produce(type) { }
  closeProducer(type) { }
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

      CommonHelp.timingCall(x => {
        console.log(this.audioSelectValue);
        console.log(this.videoSelectValue);
        console.log(this.videoSelects);
        console.log(this.audioSelects);
      }, 3);
    }
    )
  }
  public initSocket() {
    this._socket = io('https://localhost:3016');
    let socket = this._socket;
    socket.request = function request(type, data = {}) {
      return new Promise((resolve, reject) => {
        socket.emit(type, data, (data) => {
          if (data.error) {
            reject(data.error)
          } else {
            resolve(data)
          }
        })
      })
    }
  }

  joinRoom(name, room_id) {
    let rc = this._rc;
    if (rc) {
      console.log('already connected to a room')
    } else {
      this._rc = new RoomClientV2(this._mediasoupClient, this._socket, room_id, name)
      this.addListeners();
    }
  }
  addListeners() {
    let rc = this._rc;
    rc.on(_EVENTSV2.startScreen, () => {
      this.if_startScreen = false;
      this.if_stopScreen = true;
    })

    rc.on(_EVENTSV2.stopScreen, () => {
      this.if_stopScreen = false;
      this.if_startScreen = true;
    })

    rc.on(_EVENTSV2.stopAudio, () => {
      this.if_stopAudio = false;
      this.if_startAudio = true;
    })
    rc.on(_EVENTSV2.startAudio, () => {
      this.if_startAudio = false;
      this.if_stopAudio = true;
    })

    rc.on(_EVENTSV2.startVideo, () => {
      this.if_startVideo = false;
      this.if_stopVideo = true;
    })
    rc.on(_EVENTSV2.stopVideo, () => {
      this.if_stopVideo = false;
      this.if_startVideo = true;
    })
    rc.on(_EVENTSV2.exitRoom, () => {

    })

    rc.on(_EVENTSV2.removeConsumer,(id)=>{
      
    })
  }
  
  ngOnInit() {
    this.initDevices();
    this.initSocket();
    this._mediasoupClient = this._window.mediasoupClient;


  }
  ngAfterViewInit(): void {

  }
}
