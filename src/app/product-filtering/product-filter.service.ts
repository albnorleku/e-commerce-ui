import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {
  ActionType,
  Bucket,
  FacetType,
  FilterPath,
  FilterRequest,
  FilterResponse,
  FilterSelection,
  GeoRequest,
  SearchRequest,
  SearchResponse
} from './search-filters-requests';
import {RestService} from '../rest-service';

/**
 * Product filter service.
 */
@Injectable()
export class ProductFilterService {

  /**
   * Initial default search request.
   */
  private state: SearchRequest = {
    page: 0,
    pageSize: 20,
    sort: ['numberSort.Price,ASC'],
    filters: {},
    exclude: []
  };


  private filterSubject: BehaviorSubject<FilterSelection[]> = new BehaviorSubject<FilterSelection[]>([]);
  public selectedFilters: Observable<FilterSelection[]> = this.filterSubject.asObservable();


  private searchResultsSubject: BehaviorSubject<SearchResponse> = new BehaviorSubject<SearchResponse>(null);
  public searchResults: Observable<SearchResponse> = this.searchResultsSubject.asObservable();

  constructor(private activatedRoute: ActivatedRoute,
              private restService: RestService) {
    this.initializeRequest();
  }

  /**
   * Search all products by full text search.
   * In case given search value is null or empty, the last search will be removed before sending the new request.
   * @param searchValue Full text search value.
   */
  public searchByText(searchValue: string): void {
    if (searchValue && searchValue.length) {
      this.state.searchBox = searchValue;
    } else {
      delete this.state.searchBox;
    }
    this.resetPagination();
    this.search(this.state, ActionType.SEARCH);
  }

  /**
   * Search by geo location.
   * In case the given geo request is null or empty, the geolocation will be removed before sending the request.
   * By default, on every geo location request the sort will be changed by location, ascending.
   * @param geo
   */
  searchByLocation(geo: GeoRequest): void {
    if (geo) {
      this.state.geo = geo;
      if (!this.state.sort || !this.state.sort.length || !this.state.sort.find(value => value.startsWith('geo'))) {
        this.state.sort = ['geo,ASC', 'numberSort.Price,ASC'];
      }
    } else {
      this.resetGeoSearch();
    }
    this.resetPagination();
    this.search(this.state, ActionType.LOCATION_CHANGE);
  }

  /**
   * Adds a filter to the current filter state and then sends the request.
   * In case the facet and filter path both are present, the value will be added to the list of values,
   * excluding number facets for which the value will be replaced.
   * In case the facet of the given filter is not present, both the facet and the filter path will be inserted.
   * @param filterSelection Filter selection.
   */
  public addFilter(filterSelection: FilterSelection): void {
    this.reloadFilters(filterSelection);
    const facetType = filterSelection.filterType;
    const filterPath = filterSelection.path;
    const bucketName = filterSelection.value.name;
    this.resetPagination();
    const filters = this.state.filters;
    if (this.hasFilters()) {
      if (this.hasFilter(facetType, filterPath)) {
        const foundFilters = filters[facetType][filterPath] as string[];
        facetType === 'numberFacet' ?
          filters[facetType][filterPath] = [bucketName] :
          foundFilters.push(bucketName);
      } else {
        filters[`${facetType}`] = {
          ...filters[facetType],
          [filterPath]: [bucketName]
        };
      }
    } else {
      this.state.filters = {
        [facetType]: {
          [filterPath]: [bucketName]
        }
      };
    }
    this.search(this.state, ActionType.ADD, filterSelection);
  }

  /**
   * Remove a filter from current filters.
   * If filter path contains no value, filter path will be deleted also.
   * If the filter facet does not contain any filters, the facet itself will be deleted.
   * @param filterSelection Filter selection.
   */
  public removeFilter(filterSelection: FilterSelection): void {
    this.reloadFilters(filterSelection);
    const filters = this.state.filters;
    const filterPath = filterSelection.path;
    const facetType = filterSelection.filterType;
    if (this.hasFilter(facetType, filterPath)) {
      const foundFilters = filters[facetType][filterPath] as string[];
      filters[facetType][filterPath] = foundFilters
        .filter(value => value !== filterSelection.value.name);
      if (!filters[facetType][filterPath].length) {
        delete filters[facetType][filterPath];
        if (!Object.keys(filters[facetType]).length) {
          delete filters[facetType];
        }
      }
    }
    this.resetPagination();
    this.search(this.state, ActionType.REMOVE, filterSelection);
  }

  /**
   * Remove all values for a multi select filter.
   * @param facetType Facet Type
   * @param path Filter path.
   */
  public clearFilter(facetType: keyof FilterRequest, path: string): void {
    const filters = this.state.filters;
    if (this.hasFilter(facetType, path)) {
      delete filters[facetType][path];
      if (!Object.keys(filters[facetType]).length) {
        delete filters[facetType];
      }
    }
    const currentFilters = this.currentlySelectedFilters.filter(value => value.filterType !== facetType || (value.filterType === facetType && value.path !== path));
    this.filterSubject.next(currentFilters);
    this.resetPagination();
    this.search(this.state, ActionType.CLEAR_FILTER);
  }

  /**
   * Clear all filters leaving only the channel owner id.
   */
  public clearAllFilters(): void {
    const partnerId = this.activatedRoute.snapshot.queryParamMap.get('partnerId');
    this.resetPagination();
    this.state.filters = {};
    delete this.state.geo;
    delete this.state.searchBox;
    this.resetSort();
    this.filterSubject.next([]);
    this.search(this.state, ActionType.CLEAR_ALL, null);
  }

  /**
   * Changes sort of current state and sends a request with the updated sort.
   * @param sort Sorting parameters.
   */
  public sortBy(sort: string[]): void {
    this.resetPagination();
    this.state.sort = sort;
    this.search(this.state, ActionType.SORT_CHANGE);
  }

  /**
   * Increases pagination count by one on the internal state and sends the next request with the updated pagination.
   */
  loadNextPage(): void {
    this.state.page += 1;
    this.search(this.state, ActionType.PAGE_CHANGE);
  }

  public search(searchParams: SearchRequest, actionType: ActionType, filterSelection: FilterSelection = null): void {
    const specialFilterPaths = [FilterPath.BRAND, FilterPath.CATEGORY] as string[];
    if (filterSelection && specialFilterPaths.includes(filterSelection.path)) {
      combineLatest([this.getSearchRequest(searchParams), this.getSecondRequest(searchParams, actionType, filterSelection)])
        .subscribe(([searchResults, overriddenResults]) => {
          searchResults.geo = searchParams.geo;
          searchResults.actionType = actionType;
          searchResults.filters.forEach(value => value.path = value.name);
          this.overrideResults(overriddenResults, searchResults,
            filterSelection?.path ? [filterSelection.path] : specialFilterPaths);
          this.searchResultsSubject.next(searchResults);
        });
    } else {
      this.getSearchRequest(searchParams).subscribe(searchResults => {
        searchResults.geo = searchParams.geo;
        searchResults.actionType = actionType;
        searchResults.filters.forEach(value => value.path = value.name);
        this.searchResultsSubject.next(searchResults);
      });
    }
  }

  /**
   * Get currently selected category types. If none are present, an empty array is returned.
   */
  public getSelectedCategoryTypes(): string[] {
    if (this.state.filters && this.state.filters.nestedFacet && this.state.filters.nestedFacet[FilterPath.CATEGORY_TYPE]) {
      return this.state.filters.nestedFacet[FilterPath.CATEGORY_TYPE];
    }
    return [];
  }

  get currentlySelectedFilters(): FilterSelection[] {
    return this.filterSubject.getValue().slice();
  }

  /**
   * Reset pagination after a new search has been made.
   * Pagination is reset on every request except the request to load the next page.
   */
  private resetPagination(): void {
    this.state.page = 0;
    this.state.pageSize = 20;
  }

  /**
   * Reset sort to default sort which is by price, ascending.
   */
  private resetSort(): void {
    this.state.sort = ['numberSort.Price,ASC'];
  }

  /**
   * Reset geo search by removing geolocation and resetting the sort to the default one.
   */
  public resetGeoSearch(): void {
    delete this.state.geo;
    this.resetSort();
  }

  private getSearchRequest(searchParams: SearchRequest): Observable<SearchResponse> {
    return this.restService.publicRequest(searchParams);
  }

  /**
   * A second request to be sent in order to preserve the original list of given filter path while retrieving results for given filter path.
   * @param searchParams Original search parameters.
   * @param actionType Action Type
   * @param filterSelection Filter selection that also contains the type of event produced from filter change.
   * @return Second http request with modified filters.
   */
  private getSecondRequest(searchParams: SearchRequest, actionType: ActionType, filterSelection: FilterSelection): Observable<SearchResponse> {
    const clonedRequest: SearchRequest = JSON.parse(JSON.stringify(searchParams));
    const filters = clonedRequest.filters;
    delete clonedRequest.exclude;
    clonedRequest.include = this.getPathsWithInclude().filter(value => value.filterPath === filterSelection.path).map(value => value.includeValue);
    if (this.hasFilters(clonedRequest.filters)) {
      switch (filterSelection.path) {
        case FilterPath.CATEGORY:
          if (filters.nestedFacet) {
            delete filters.nestedFacet[FilterPath.CATEGORY];
          }
          break;
        case FilterPath.BRAND:
          if (filters.stringFacet) {
            delete filters.stringFacet[FilterPath.BRAND];
          }
          break;
      }
    }
    return this.getSearchRequest(clonedRequest);
  }

  /**
   * Overrides Brand, Category and Category Type filters based on the given parameters.
   * @param clonedResults Second results from second request.
   * @param searchResults Original search results without modifications.
   * @param filterPaths Filter paths that the last search was performed with.
   */
  private overrideResults(clonedResults: SearchResponse, searchResults: SearchResponse, filterPaths: string[]): void {
    const categoryFilterPath = [FilterPath.CATEGORY] as string[];
    const isCategory = filterPaths.every(value => categoryFilterPath.includes(value));
    const filtersToOverride = isCategory ? categoryFilterPath : filterPaths;
    if (searchResults.filters && searchResults.filters.length > 0) {
      searchResults.filters = searchResults.filters.filter(value => !filtersToOverride.some(value1 => value1 === value.path));
      searchResults.filters = [...searchResults.filters, ...clonedResults.filters];
    }
  }

  /**
   * Initial request to be sent from optional query parameters given from the router.
   * All category types, categories and brands are loaded on the first request and are saved in a subject.
   * A possible extra request will be sent if the route contains any query parameters.
   */
  private initializeRequest(): void {
    const selectedFilters: FilterSelection[] = [];
    this.state.filters = {};
    this.getSearchRequest(this.state)
      .subscribe((searchResults) => {
        searchResults.filters.forEach(value => value.path = value.name);
        this.searchResultsSubject.next(searchResults);
        if (selectedFilters.length) {
          this.filterSubject.next(selectedFilters);
        }
      });
  }

  /**
   * Checks to see if the filter request contains any facets.
   * @param filterRequest Filter request to be checked. If none provided, default internal state will be used to check the condition.
   */
  private hasFilters(filterRequest?: FilterRequest): boolean {
    const filters = filterRequest ?? this.state.filters;
    return filters && Object.keys(filters).length > 0;
  }

  /**
   * Checks to see if filter request object contains the given facet.
   * @param facetType Facet Type to be checked.
   * @param filterRequest Filter request to check the condition in. If none provided, default internal state will be used to check the condition.
   */
  private hasFacet(facetType: FacetType, filterRequest?: FilterRequest): boolean {
    const filters = filterRequest ?? this.state.filters;
    return this.hasFilters(filters) && filters.hasOwnProperty(facetType);
  }

  /**
   * Checks to see if given facet type contains given filter path.
   * @param facetType Facet Type (String facet, Number facet, Nested facet).
   * @param filterPath Filter path to be checked.
   * @param filterRequest Optional parameter for the filter request object to be checked. If none provided, default internal state will be used to check the condition.
   */
  private hasFilter(facetType: FacetType, filterPath: string, filterRequest?: FilterRequest): boolean {
    const filters = filterRequest ?? this.state.filters;
    return this.hasFacet(facetType, filters) && filters[facetType].hasOwnProperty(filterPath);
  }

  /**
   * Reload filters based on event
   * @param filterSelection Filter selection.
   */
  private reloadFilters(filterSelection: FilterSelection): void {
    const currentFilters = this.currentlySelectedFilters;
    switch (filterSelection.actionType) {
      case ActionType.ADD:
        currentFilters.push(filterSelection);
        this.filterSubject.next(currentFilters);
        break;
      case ActionType.REMOVE:
        const foundFilterIndex = currentFilters.findIndex(value => {
          return value.filterType === filterSelection.filterType &&
            value.value.name === filterSelection.value.name &&
            value.path === filterSelection.path;
        });
        if (foundFilterIndex > -1) {
          currentFilters.splice(foundFilterIndex, 1);
        }
        this.filterSubject.next(currentFilters);
        break;
      case ActionType.SLIDER_CHANGE:
        const foundNumberFacetIndex = currentFilters.findIndex(value => value.path === filterSelection.path);
        if (foundNumberFacetIndex > -1) {
          currentFilters.splice(foundNumberFacetIndex, 1);
        }
        currentFilters.push(filterSelection);
        this.filterSubject.next(currentFilters);
        break;
      case ActionType.CLEAR_ALL:
        this.filterSubject.next([]);
        break;
    }
  }

  /**
   * A static list of must know filter paths with their include value.
   */
  private getPathsWithInclude(): any[] {
    return [
      {filterPath: FilterPath.BRAND, includeValue: 'Brand'},
      {filterPath: FilterPath.CATEGORY_TYPE, includeValue: 'categoryType'},
      {filterPath: FilterPath.CATEGORY, includeValue: 'Category'}
    ];
  }
}
