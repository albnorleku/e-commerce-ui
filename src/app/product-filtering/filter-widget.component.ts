import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ActionType, FilterResponse, FilterSelection, Location} from './search-filters-requests';
import {ProductFilterService} from './product-filter.service';
import {Subscription} from 'rxjs';
import {skipWhile} from 'rxjs/operators';

@Component({
  selector: 'app-filter-widget',
  template: `
    <div class="filter-list">
      <form>
        <div class="filter-wrap" *ngFor="let field of filters">
          <app-dropdown *ngIf="field.type === 'stringFacet'"
                        [filterResponse]="field"
                        [selectedFilters]="selectedFilters"
                        (filterChange)="onFilterSelection($event)">
          </app-dropdown>
          <app-slider *ngIf="field.type === 'numberFacet'"
                      [filterResponse]="field"
                      (valueChanged)="onFilterSelection($event)">
          </app-slider>
        </div>
      </form>
    </div>`,
  styleUrls: ['filter.scss']
})

export class FilterWidgetComponent implements OnInit, OnDestroy {

  readonly sideBarSelector = '.sidebar-left-inner';

  filters: FilterResponse[] = [];
  currentPage = 0;
  readonly itemsPerPage: number = 20;

  /**
   *  Input params filters as object.
   */
  @Input() set fields(filterResponse: { actionType: ActionType, filters: FilterResponse[] }) {
    this.filters = JSON.parse(JSON.stringify(filterResponse.filters)) as FilterResponse[];
  }

  @Output() locationChange: EventEmitter<Location> = new EventEmitter<Location>();

  selectedFilters: FilterSelection[] = [];

  selectedFiltersSubscription: Subscription;

  /**
   * Constructor.
   */
  constructor(private productFilterService: ProductFilterService) {
    this.selectedFiltersSubscription = this.productFilterService.selectedFilters
      .pipe(skipWhile(value => !value))
      .subscribe(selectedFilters => this.selectedFilters = JSON.parse(JSON.stringify(selectedFilters)));
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.selectedFiltersSubscription.unsubscribe();
  }

  onFilterSelection($event: FilterSelection) {
    if ($event.filterType === 'stringFacet' || $event.filterType === 'nestedFacet') {
      switch ($event.actionType) {
        case ActionType.ADD:
          this.productFilterService.addFilter($event);
          break;
        case ActionType.REMOVE:
          this.productFilterService.removeFilter($event);
          break;
        case ActionType.CLEAR_ALL:
          this.productFilterService.clearFilter($event.filterType, $event.path);
          break;
        default:
          console.warn('Unknown action type: ' + $event.actionType);

      }
    } else {
      this.productFilterService.addFilter($event);
    }
  }
}
