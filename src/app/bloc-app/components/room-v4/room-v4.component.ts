/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-07 17:37:55
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-08 13:27:21
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KeyValue, stream } from '../../models/types';
import * as io from 'socket.io-client';
import { RoomClientV4 } from '../../common/room-client-v4';
import { mediaTypeV2, _EVENTSV2 } from '../../common/room-client-v2';
import { environment } from '@env/environment';
export interface peer {
  id: string;
  name: string;
  order: number;
  isSpeaker: boolean;
}
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
  _socket: any;
  _rc: RoomClientV4;
  current: peer;
  peers: peer[] = [];
  remoteAudioStream: stream[] = [];
  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe(x => {
      this.roomId = x['roomId'];
      document.title = '当前房间ID：' + this.roomId;
    });
  }

  getPeerByOrder(order: number) {
    return this?.peers?.find(x => x.order == order);
  }

  getValue(getPeerByOrder: peer) {
    return getPeerByOrder?.name;
  }
  getSpeaker(getPeerByOrder: peer) {
    return getPeerByOrder?.isSpeaker;
  }
  isMe(getPeerByOrder: peer) {
    return this?.current?.id == getPeerByOrder?.id;
  }
  ngAfterViewInit(): void {
    // this._rc.produce(mediaTypeV2.audio, this.audioSelectValue);
  }
  ngOnInit() {
    this.initDevices();
    this.initSocket();
    this.joinRoom(this.roomId);

    setTimeout(() => {
      this._rc.produce(mediaTypeV2.audio, this.audioSelectValue);
    }, 2000);

  }
  joinRoom(room_id) {
    let rc = this._rc;
    if (rc) {
      console.log('already connected to a room')
    } else {
      this._rc = new RoomClientV4(this._socket, room_id);
      this.addListeners();
    }
  }
  removeRemoteStream(id) {
    let elem: any = document.getElementById(id);
    elem.srcObject.getTracks().forEach(function (track) {
      track.stop()
    })
    this.remoteAudioStream = this.remoteAudioStream.filter(x => x.id != id);
  }

  addListeners() {
    let rc = this._rc;

    // rc.on(_EVENTSV2.exitRoom, () => {
    //   let a = 1;
    // })

    rc.on(_EVENTSV2.removeConsumer, ({ consumer }) => {
      this.removeRemoteStream(consumer.id);
    })
    rc.on(_EVENTSV2.newConsumer, ({ consumer, stream, isVideo }) => {
      if (isVideo) {
      } else {
        this.remoteAudioStream = [...this.remoteAudioStream, { id: consumer.id, stream: stream }];
      }
    })

    rc.on(_EVENTSV2.roomUpdate, (data) => {
      let peers_ = JSON.parse(data.peers);
      this.peers = peers_.map(x => x[1])
      console.log(this.peers);
    });


    rc.on(_EVENTSV2.selfUpdate, (data) => {
      this.current = data;
      console.log("self ", this.current);
    });

    rc.on(_EVENTSV2.activeSpeaker, (data) => {
      console.log(data);
      let id = data.peerId;
      let peer = this.peers.find(x => x.id == id);
      peer.isSpeaker = true;
      setTimeout(() => {
        peer.isSpeaker = false;
      }, 2500);
    });
    // rc.on(_EVENTSV2.removeProducer, ({ producer }) => {
    //   this.removeLocalStream(producer);
    // })

    rc.on(_EVENTSV2.newProducer, ({ producer, stream }) => {
      // this.localStreams = [...this.localStreams, { id: producer.id, stream: stream }];
    })


  }
  public initSocket() {
    this._socket = io(environment.webSocketUrl);
    let socket = this._socket;
    socket.request = function request(type, data = {}) {
      return new Promise((resolve, reject) => {
        socket.emit(type, data, (data) => {
          if (data != null && data.error) {
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
    );


  }

}
