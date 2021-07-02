import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { RoomClient } from '../common/room-client';
import { RoomLog } from '../common/room-log';

@Injectable({
  providedIn: 'root'
})
export class SocketRoomSignallingService {

  //socket.io client
  _socket;
  //roomClient
  public _rc;
  _mediasoupClient;
  _window: any = window;

  constructor() {
    this.initSocket();
    this._mediasoupClient = this._window.mediasoupClient;
    // RoomLog.ErrorLog(this._mediasoupClient);
  }
  joinRoom(name, room_id) {
    let rc = this._rc;
    if (rc && rc.isOpen()) {
      console.log('already connected to a room')
    } else {
      this._rc = new RoomClient(this.getEl('localMedia'), this.getEl('remoteVideos'), this.getEl('remoteAudios'), this._mediasoupClient, this._socket, room_id, name, this.roomOpen)
      this.addListeners();
    }
  }
  hide(elem) {
    elem.className = 'hidden'
  }

  reveal(elem) {
    elem.className = ''
  }

  addListeners() {
    let rc = this._rc;
    rc.on(RoomClient.EVENTS.startScreen, () => {
      this.hide(this.getEl('startScreenButton'))
      this.reveal(this.getEl('stopScreenButton'))
    })

    rc.on(RoomClient.EVENTS.stopScreen, () => {
      this.hide(this.getEl('stopScreenButton'))
      this.reveal(this.getEl('startScreenButton'))

    })

    rc.on(RoomClient.EVENTS.stopAudio, () => {
      this.hide(this.getEl('stopAudioButton'))
      this.reveal(this.getEl('startAudioButton'))

    })
    rc.on(RoomClient.EVENTS.startAudio, () => {
      this.hide(this.getEl('startAudioButton'))
      this.reveal(this.getEl('stopAudioButton'))
    })

    rc.on(RoomClient.EVENTS.startVideo, () => {
      this.hide(this.getEl('startVideoButton'))
      this.reveal(this.getEl('stopVideoButton'))
    })
    rc.on(RoomClient.EVENTS.stopVideo, () => {
      this.hide(this.getEl('stopVideoButton'))
      this.reveal(this.getEl('startVideoButton'))
    })
    rc.on(RoomClient.EVENTS.exitRoom, () => {
      this.hide(this.getEl('control'))
      this.reveal(this.getEl('login'))
      this.hide(this.getEl('videoMedia'))
    })
  }
  roomOpen() {
    const _getEl = (id) => {
      return document.getElementById(id);
    };
    const _reveal = (elem) => {
      elem.className = '';
    }
    const _hide = (elem) => {
      elem.className = 'hidden';
    }
    _reveal(_getEl('startAudioButton'))
    _hide(_getEl('stopAudioButton'))
    _reveal(_getEl('startVideoButton'))
    _hide(_getEl('stopVideoButton'))
    _reveal(_getEl('startScreenButton'))
    _hide(_getEl('stopScreenButton'))
    _reveal(_getEl('exitButton'))
    _getEl('control').className = ''
    _reveal(_getEl('videoMedia'))
  }
  getEl(id) {
    return document.getElementById(id);
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



}
