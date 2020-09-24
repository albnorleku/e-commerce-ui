import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ProductFilterService} from './product-filtering/product-filter.service';
import {Subscription} from 'rxjs';
import {debounceTime, skipWhile, take} from 'rxjs/operators';
import {
  ActionType,
  Bucket,
  FilterPath,
  FilterResponse,
  FilterSelection,
  GeoRequest,
  SearchResponse
} from './product-filtering/search-filters-requests';
import {FormControl} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-product-card-list',
  templateUrl: './product-card-list.component.html',
  styleUrls: ['./product-card-list.component.scss'],
  providers: [ProductFilterService]
})

/**
 * Product Component - Used to show all products or filtered products as cards.
 */
export class ProductCardListComponent implements OnInit, OnDestroy {

  /**
   * Constructor.
   *
   * @param productFilterService ProductFilterService.
   * @param router Router.
   */
  constructor(
    private productFilterService: ProductFilterService,
    private router: Router) {
    /**
     * Page refresh.
     */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  /**
   * Loader of products.
   */
  loading = false;

  /**
   *  Sort option with static data.
   */
  sortOption = [];

  /**
   * Current selected sort
   */
  selectedSort: { value: string[], name: string };

  /**
   * Current search value
   */
  searchValue: FormControl;

  searchInputSubscription: Subscription;

  /**
   * Show, used to toggle sidebar.
   */
  show = true;

  /**
   * List of products.
   */
  products = [];

  /**
   * Object.keys function bound to a class property to be able to use it in the template.
   */
  public objectKeys = Object.keys;

  @ViewChild('searchBox', {static: true}) searchBox: ElementRef;

  /**
   * Sort given buckets by name.
   * To be passed as a higher order function to a sort function.
   * @param first First bucket
   * @param second Second Bucket
   */
  private sortByName = (first: Bucket, second: Bucket): number => first.name.localeCompare(second.name);

  /**
   * Total number of products found.
   */
  total = 0;

  public shownCategories: FilterResponse;
  public selectedFilters: FilterSelection[] = [];
  allCategories: FilterResponse;
  allCategoryTypes: FilterResponse;

  /**
   * Product filters service subscription.
   */
  private productFilterSubscription: Subscription;
  private selectedFiltersSubscription: Subscription;
  private categorySubscription: Subscription;

  ngOnInit(): void {
    this.loading = true;
    this.bindSearchResults();
    this.bindSelectedFilters();
    this.searchValue = new FormControl();
    this.searchInputSubscription = this.searchValue.valueChanges
      .pipe(debounceTime(500))
      .subscribe(value => this.onSearchInput(value));
    this.searchBox.nativeElement.focus();
  }

  /**
   * Remove all subscriptions to avoid memory leaks.
   */
  ngOnDestroy() {
    this.productFilterSubscription.unsubscribe();
    this.selectedFiltersSubscription.unsubscribe();
    this.searchInputSubscription.unsubscribe();
  }

  /**
   * Load next page of products if it hasn't exceeded the total number of products.
   */
  onScroll() {
    if (this.total !== this.products.length) {
      this.productFilterService.loadNextPage();
    }
  }

  /**
   * Show/hide filter sidebar.
   */
  toggleFilterSidebar(): void {
    this.show = !this.show;
  }

  /**
   * Clear all filters
   */
  onClickClearFilters(): void {
    this.searchValue.setValue(null, {emitEvent: false});
    this.productFilterService.clearAllFilters();
  }

  /**
   * Gets the removed filter and passes it to the service to remove it from selected filters and to reload search.
   * In case the removed filter is a category, the removed category is appended to the shown category list.
   * @param filterSelection Removed filter.
   */
  onFilterRemove(filterSelection: FilterSelection) {
    filterSelection.actionType = ActionType.REMOVE;
    if (filterSelection.path === FilterPath.CATEGORY) {
      const foundBucket = this.allCategories.buckets.find(value1 => value1.name === filterSelection.value.name);
      if (foundBucket) {
        this.shownCategories.buckets = [...this.shownCategories.buckets, foundBucket].sort(this.sortByName);
      }
    }
    this.productFilterService.removeFilter(filterSelection);
  }

  /**
   * Binds output event from product categories component and passes it to the service to be appended into filters.
   * @param $event Selected category.
   */
  onCategorySelection($event: FilterSelection) {
    this.productFilterService.addFilter($event);
    this.shownCategories.buckets = this.shownCategories.buckets.filter(value => value.name !== $event.value.name);
  }

  /**
   * Sort by given property specified in value property in sortOption field.
   * @param $event Selected sort
   */
  onSortClick($event: any) {
    this.selectedSort = $event;
    this.productFilterService.sortBy($event.value);
  }

  /**
   * Takes search parameter to be used as full text search and passes it onto the service.
   * @param newValue from input
   */
  onSearchInput(newValue) {
    this.productFilterService.searchByText(newValue);
  }

  private clone(valueToClone: any): any {
    return JSON.parse(JSON.stringify(valueToClone));
  }

  /**
   * Bind all selected filters from product filter service internal state.
   */
  private bindSelectedFilters(): void {
    this.selectedFiltersSubscription = this.productFilterService.selectedFilters
      .pipe(skipWhile(value => !value))
      .subscribe(value => {
        this.selectedFilters = this.clone(value);
        const foundIndex = this.selectedFilters.findIndex(value1 =>
          value1.filterType === 'nestedFacet' && value1.path === FilterPath.SELLER_ID);
        if (foundIndex > -1) {
          this.selectedFilters.splice(foundIndex, 1);
        }
      });
  }

  /**
   * Bind search results after every request.
   * In case the response returns a page greater than 0 (zero), then append results to the current list,
   * otherwise override previous result with current one.
   */
  private bindSearchResults(): void {
    this.productFilterSubscription = this.productFilterService.searchResults
      .pipe(skipWhile(value => !value))
      .subscribe(searchResponse => {
        this.loading = false;
        this.total = searchResponse.total || 0;
        this.products = searchResponse.page > 0 ? this.products.concat(searchResponse.items) : searchResponse.items;
        if (searchResponse.page === 0) {
          window.scroll(0, 0);
        }
        this.reloadSortOptions(searchResponse.geo);
      }, () => this.loading = false);
  }

  private reloadSortOptions(geo: GeoRequest) {
    const nearToFar = 'Near to Far';
    const farToNear = 'Far to Near';
    if (geo) {
      this.sortOption = [
        {value: ['numberSort.Price,ASC'], name: 'Price: Low to High'},
        {value: ['numberSort.Price,DESC'], name: 'Price: High to Low'},
        {value: ['geo,ASC', 'numberSort.Price,ASC'], name: nearToFar},
        {value: ['geo,DESC', 'numberSort.Price,DESC'], name: farToNear}];
    } else {
      this.sortOption = [
        {value: ['numberSort.Price,ASC'], name: 'Price: Low to High'},
        {value: ['numberSort.Price,DESC'], name: 'Price: High to Low'}];
      if (this.selectedSort?.name === nearToFar || this.selectedSort?.name === farToNear) {
        this.selectedSort = null;
      }
    }
  }
}
