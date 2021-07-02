import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
    {
        path: 'bloc',
        loadChildren: () => import('./bloc-app/bloc-app.module').then(m => m.BlocAppModule)
    },
    { path: '', pathMatch: 'full', redirectTo: 'bloc' },
    { path: '**', redirectTo: 'bloc' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { enableTracing: false, initialNavigation: 'enabled' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
