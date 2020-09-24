import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ProductCardListComponent} from './product-card-list.component';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ProductCardListComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
