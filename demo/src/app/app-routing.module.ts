import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppGuard } from './app.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AppGuard],
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('./pages/home/home.module').then(m => m.HomeModule),
      },
      {
        path: 'list',
        loadChildren: () =>
          import('./pages/list/list.module').then(m => m.ListModule),
      },
      {
        path: 'register',
        loadChildren: () =>
          import('./pages/register/register.module').then(
            m => m.RegisterModule,
          ),
      },
    ],
  },
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: '**', redirectTo: 'register' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
