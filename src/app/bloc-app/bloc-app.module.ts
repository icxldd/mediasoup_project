import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlocAppComponent } from './bloc-app.component';
import { TestPageComponent } from './components/test-page/test-page.component';
import { BlocAppRoutingModule } from './bloc-app.routing';
import { ShareUiModule } from '../shared-module/public-api';
import { RoomComponent } from './components/room/room.component';
import { SocketRoomSignallingService } from './services/socket-room-signalling.service';
@NgModule({
  imports: [
    CommonModule,
    BlocAppRoutingModule,
    ShareUiModule
  ],
  declarations: [BlocAppComponent,
    TestPageComponent, RoomComponent
  ],
  providers:[
    SocketRoomSignallingService
  ]
})
export class BlocAppModule { }
