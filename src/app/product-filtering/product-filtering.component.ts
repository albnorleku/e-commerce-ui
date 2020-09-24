import {Component, Inject, OnDestroy} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {ProductFilterService} from './product-filter.service';
import {Subscription} from 'rxjs';
import {map, skipWhile} from 'rxjs/operators';
import {ActionType, FilterPath, FilterResponse} from './search-filters-requests';

@Component({
  selector: 'app-product-filtering',
  templateUrl: './product-filtering.component.html',
  styleUrls: ['./product-filtering.component.scss']
})
export class ProductFilteringComponent implements OnDestroy {
  /**
   *  Input params filters as object.
   */
  filters: FilterResponse[] = [];

  /**
   * If the filter response was due to a call to clearAllFilters.
   * Needed to reset list of filters and scroll on filter widget component.
   */
  actionType: ActionType;

  /**
   * Element which contains the product filtering component.
   */
  private productFilteringContainer: HTMLCollectionOf<Element>;

  filterResponse: { actionType: ActionType, filters: FilterResponse[] };

  private filterSubscription: Subscription;

  /**
   * Constructor.
   */
  constructor(@Inject(DOCUMENT) private document: Document, private productFilterService: ProductFilterService) {
    this.productFilteringContainer = document.getElementsByClassName('sidebar-left-inner');
    this.filterSubscription = this.productFilterService.searchResults
      .pipe(
        skipWhile(value => !value),
        map(searchResponse => {
          const filters = searchResponse.filters;
          this.actionType = searchResponse.actionType;
          if (searchResponse.actionType === ActionType.CLEAR_ALL) {
            this.productFilteringContainer[0].scroll(0, 0);
          }
          return filters.filter(value => value.name !== 'category');
        })
      ).subscribe(filterResponse => {
        let filters = [...filterResponse];
        filters = [...filters].sort((a, b) => a.type === 'numberFacet' || b.type === 'numberFacet' ? -1 : a.name.localeCompare(b.name));
        this.filters = [...filters];
        this.filterResponse = {
          actionType: this.actionType,
          filters: this.filters
        };
      });
  }

  ngOnDestroy() {
    this.filterSubscription.unsubscribe();
  }
}
