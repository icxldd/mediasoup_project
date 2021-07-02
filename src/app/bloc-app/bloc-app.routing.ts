import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { TestPageComponent } from './components/test-page/test-page.component';
import { RoomComponent } from './components/room/room.component';


const routes: Routes = [
  {
    path: 'test-show',
    component: TestPageComponent
  },
  {
    path: 'room/:roomId/:name',
    component: RoomComponent
  },
  { path: '', pathMatch: 'full', redirectTo: 'room' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlocAppRoutingModule { }