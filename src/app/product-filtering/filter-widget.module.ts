import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
// components
import {FilterWidgetComponent} from './filter-widget.component';
import {DropDownComponent} from './widget/dropdown';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {SliderComponent} from './widget/slider';
import {Ng5SliderModule} from 'ng5-slider';
import {NgSelectModule} from '@ng-select/ng-select';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {ProductFilteringComponent} from './product-filtering.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    Ng5SliderModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatInputModule,
    NgSelectModule,
    MatCheckboxModule,
    InfiniteScrollModule,
  ],
  declarations: [
    FilterWidgetComponent,
    DropDownComponent,
    SliderComponent,
    ProductFilteringComponent
  ],
  exports: [FilterWidgetComponent, DropDownComponent, SliderComponent, ProductFilteringComponent],
})
export class FilterWidgetModule {
}
