import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketRoomSignallingService } from '../../services/socket-room-signalling.service';
import { mediaType } from '../../common/room-client';
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  
  roomId: string;
  name: string;
  public _io:any;

  audioSelect:any;
  videoSelect:any;


  @ViewChild('videoSelect') _videoSelect: ElementRef;
  @ViewChild('audioSelect') _audioSelect: ElementRef;
  constructor(private route: ActivatedRoute, private io: SocketRoomSignallingService) {
    
    this.route.params.subscribe(x => {
      this.roomId = x['roomId'];
      this.name = x['name'];
      document.title = '当前用户名：' + this.name;
    });
    this._io = io;
  }

  ngOnInit() {
    this._io.joinRoom(this.name,this.roomId);
  }


  ngAfterViewInit(): void {
    this.videoSelect = this._videoSelect.nativeElement;
    this.audioSelect = this._audioSelect.nativeElement;
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    navigator.mediaDevices.enumerateDevices().then(devices =>
      devices.forEach(device => {
        let el = null
        let strId;
        if ('audioinput' === device.kind) {
          strId = 'audioSelect'
        } else if ('videoinput' === device.kind) {
          strId = 'videoSelect'
        }
        el = document.getElementById(strId);
        if (!el) return

        let option = document.createElement('option')
        option.value = device.deviceId
        option.innerText = device.label
        el.appendChild(option)
      })
    )
  }

}
