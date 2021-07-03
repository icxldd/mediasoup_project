/*
 * @Descripttion: 
 * @version: 1.0
 * @Author: icxl
 * @Date: 2021-07-01 16:56:19
 * @LastEditors: icxl
 * @LastEditTime: 2021-07-03 17:31:10
 */
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { TestPageComponent } from './components/test-page/test-page.component';
import { RoomComponent } from './components/room/room.component';
import { RoomV2Component } from './components/room-v2/room-v2.component';


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
  { path: '', pathMatch: 'full', redirectTo: 'room' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlocAppRoutingModule { }