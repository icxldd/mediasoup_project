/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-06 15:13:54
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-06 21:16:01
 */
import { Component, OnInit } from '@angular/core';
import { audioStream, KeyValue, stream } from '../../models/types';
import { ActivatedRoute } from '@angular/router';
import * as mediasoupClient from "mediasoup-client";
import { RoomClientTS } from '../../common/room-client-ts';
import { mediaTypeV2, _EVENTSV2 } from '../../common/room-client-v2';
import * as io from 'socket.io-client';
import { environment } from '@env/environment';
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


  //按钮是否显示
  if_startAudio: boolean = true;
  if_stopAudio: boolean = false;
  if_startVideo: boolean = true;
  if_stopVideo: boolean = false;
  if_startScreen: boolean = true;
  if_stopScreen: boolean = false;
  if_videoMedia: boolean = true;


  //视频流
  localStreams: stream[] = [];
  //远程音频流
  remoteAudioStream: stream[] = [];
  //远程视频流
  remoteVideoStream: stream[] = [];



  //lib
  _socket;
  _window: any = window;
  _rc: RoomClientTS;

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(x => {
      this.roomId = x['roomId'];
      this.name = x['name'];
      document.title = '当前用户名：' + this.name;
    });
  }


  ngOnInit() {
    this.initDevices();
    this.initSocket();
    this.joinRoom(this.name, this.roomId);
  }
  produce(type) {
    if (type == mediaTypeV2.audio) {
      this._rc.produce(mediaTypeV2.audio, this.audioSelectValue);
    }
    if (type == mediaTypeV2.video) {
      this._rc.produce(mediaTypeV2.video, this.videoSelectValue);
    }
    if (type == mediaTypeV2.screen) {
      this._rc.produce(mediaTypeV2.screen);
    }
  }
  closeProducer(type) {
    if (type == mediaTypeV2.audio) {
      this._rc.closeProducer(mediaTypeV2.audio);
    }
    if (type == mediaTypeV2.video) {
      this._rc.closeProducer(mediaTypeV2.video);
    }
    if (type == mediaTypeV2.screen) {
      this._rc.closeProducer(mediaTypeV2.screen);
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

      // CommonHelp.timingCall(x => {
      //   console.log(this.audioSelectValue);
      //   console.log(this.videoSelectValue);
      //   console.log(this.videoSelects);
      //   console.log(this.audioSelects);
      // }, 3);
    }
    )
  }

  public initSocket() {
    this._socket = io(environment.webSocketUrl);
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
      this._rc = new RoomClientTS(this._socket, room_id, name)
      this.addListeners();
    }
  }
  removeRemoteStream(id) {
    let elem: any = document.getElementById(id);
    elem.srcObject.getTracks().forEach(function (track) {
      track.stop()
    })
    this.remoteAudioStream = this.remoteAudioStream.filter(x => x.id != id);
    this.remoteVideoStream = this.remoteVideoStream.filter(x => x.id != id);
  }
  removeLocalStream(producer) {
    let elem: any = document.getElementById(producer.id);
    elem.srcObject.getTracks().forEach(function (track) {
      track.stop()
    })
    this.localStreams = this.localStreams.filter(x => x.id != producer.id);
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
      let a = 1;
    })

    rc.on(_EVENTSV2.removeConsumer, ({ consumer }) => {
      this.removeRemoteStream(consumer.id);
    })
    rc.on(_EVENTSV2.newConsumer, ({ consumer, stream, isVideo }) => {
      if (isVideo) {
        this.remoteVideoStream = [...this.remoteVideoStream, { id: consumer.id, stream: stream }];
      } else {
        this.remoteAudioStream = [...this.remoteAudioStream, { id: consumer.id, stream: stream }];
      }

    })

    rc.on(_EVENTSV2.removeProducer, ({ producer }) => {
      this.removeLocalStream(producer);
    })

    rc.on(_EVENTSV2.newProducer, ({ producer, stream }) => {
      this.localStreams = [...this.localStreams, { id: producer.id, stream: stream }];
    })


  }


}
