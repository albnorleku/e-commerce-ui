import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {ProductCardListComponent} from './product-card-list.component';
import {FilterWidgetModule} from './product-filtering/filter-widget.module';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {NgSelectModule} from '@ng-select/ng-select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {ProductCardComponent} from './product-card.component';

@NgModule({
  declarations: [
    AppComponent,
    ProductCardListComponent,
    ProductCardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FilterWidgetModule,
    InfiniteScrollModule,
    NgSelectModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
