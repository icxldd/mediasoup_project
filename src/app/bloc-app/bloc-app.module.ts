/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-01 16:56:19
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-07 18:34:53
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlocAppComponent } from './bloc-app.component';
import { TestPageComponent } from './components/test-page/test-page.component';
import { BlocAppRoutingModule } from './bloc-app.routing';
import { ShareUiModule } from '../shared-module/public-api';
import { RoomComponent } from './components/room/room.component';
import { SocketRoomSignallingService } from './services/socket-room-signalling.service';
import { FormsModule } from '@angular/forms';
import { RoomV2Component } from './components/room-v2/room-v2.component';
import { RoomTsComponent } from './components/room-ts/room-ts.component';
import { RoomV4Component } from './components/room-v4/room-v4.component';
@NgModule({
  imports: [
    CommonModule,
    BlocAppRoutingModule,
    ShareUiModule,
    FormsModule
  ],
  declarations: [BlocAppComponent,
    TestPageComponent, RoomComponent,RoomV2Component,RoomTsComponent,RoomV4Component
  ],
  providers:[
    SocketRoomSignallingService
  ]
})
export class BlocAppModule { }
