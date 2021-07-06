/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-01 16:56:19
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-06 15:14:22
 */
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { TestPageComponent } from './components/test-page/test-page.component';
import { RoomComponent } from './components/room/room.component';
import { RoomV2Component } from './components/room-v2/room-v2.component';
import { RoomTsComponent } from './components/room-ts/room-ts.component';


const routes: Routes = [
  {
    path: 'test-show',
    component: TestPageComponent
  },
  {
    path: 'room/:roomId/:name',
    component: RoomComponent
  },
  {
    path: 'room-v2/:roomId/:name',
    component: RoomV2Component
  },
  {
    path: 'room-ts/:roomId/:name',
    component: RoomTsComponent
  },
  { path: '', pathMatch: 'full', redirectTo: 'room' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlocAppRoutingModule { }