import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ActionType, Bucket, FilterResponse, FilterSelection} from '../search-filters-requests';
import {MatCheckboxChange} from '@angular/material/checkbox';

@Component({
  selector: 'app-dropdown',
  template: `
    <div class="select-wrap">
      <!--if there is no title remove this line <span>-->
      <div class="category-filter" *ngIf="filterResponse.name === 'categoryType'; else filterDropdown">
        <span>Category Type</span>
        <button (click)="onViewMore()"> <span class="material-icons">
                    {{isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}}
                </span></button>
        <div *ngIf="isExpanded" class="category-container">
          <div class="category-buckets" *ngFor="let buckets of filterResponse.buckets">
            <mat-checkbox [checked]="isItemSelected(buckets)" (change)="newMessage(buckets, $event)">
              <span>{{buckets.name}}</span>
            </mat-checkbox>
          </div>
        </div>
      </div>
      <ng-template #filterDropdown>
            <span class="filter-title">
                <ng-container [ngSwitch]="filterResponse.name">
                    <span *ngSwitchCase="'location'">Data Center/Region</span>
                    <span *ngSwitchCase="'Provider'">Seller</span>
                    <span *ngSwitchDefault>
                        <span *ngIf="!shortCutArray.includes(filterResponse.name.toLowerCase())">
                            {{filterResponse.name | titlecase}}
                        </span>
                      <span *ngIf="shortCutArray.includes(filterResponse.name.toLowerCase())">
                          {{filterResponse.name | uppercase}}</span>
                    </span>
                </ng-container>
            </span>

        <ng-select
          [items]="filterResponse.buckets"
          [(ngModel)]="selectedValues"
          bindLabel="name"
          class="ng-select"
          (add)="newMessage($event)"
          (clear)="onClear()"
          (remove)="onRemove($event)"
          [multiple]="true"
          [clearable]="true">

          <ng-template ng-option-tmp let-item="item">
            <mat-checkbox [checked]="isItemSelected(item)" [title]="item.name">{{item?.name}}</mat-checkbox>
          </ng-template>
          <ng-template ng-multi-label-tmp let-items="items" let-clear="clear">
            <div class="ng-value" *ngIf="items.length > 0">
              <span class="ng-value-label">{{items.length}} Selected</span>
            </div>
          </ng-template>

        </ng-select>
      </ng-template>
    </div>`
})

/**
 * DropDownComponent.
 */
export class DropDownComponent implements OnInit {

  @Input() filterResponse: FilterResponse;

  @Output() filterChange: EventEmitter<FilterSelection> = new EventEmitter<FilterSelection>();

  selectedValues: string[] = [];

  /**
   * show category type buckets
   */
  public isExpanded = true;

  shortCutArray = ['os', 'vpn', 'ram', 'cpu'];

  constructor() {
  }

  @Input() set selectedFilters(selectedFilters: FilterSelection[]) {
    const selectedFilter = selectedFilters.filter(value => value.filterType === this.filterResponse.type);
    if (selectedFilter && selectedFilter.length) {
      const selectedValues = selectedFilter.filter(value => value.path === this.filterResponse.path).map(value => value.value.name);
      console.log(selectedValues);
      this.selectedValues = selectedValues || [];
    } else {
      this.selectedValues = [];
    }
  }

  ngOnInit() {
    this.filterResponse.buckets.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Notify parent for changes.
   *
   * @param bucket Bucket
   * @param event any.
   */
  newMessage(bucket: Bucket, event?: MatCheckboxChange): void {
    const checked = event ? event.checked : true;
    if (bucket && checked) {
      const filterSelection: FilterSelection = {
        filterType: this.filterResponse.type,
        path: this.filterResponse.path,
        value: bucket,
        actionType: ActionType.ADD
      };
      this.filterChange.emit(filterSelection);
    } else {
      if (event) {
        const bucketClone = {
          value: bucket
        };
        this.onRemove(bucketClone);
      } else {
        this.onClear();
      }

    }
  }

  /**
   * Clear all values from filter.
   */
  onClear() {
    const filterSelection: FilterSelection = {
      filterType: this.filterResponse.type,
      path: this.filterResponse.path,
      actionType: ActionType.CLEAR_ALL
    };
    this.filterChange.emit(filterSelection);

  }

  /**
   * Remove a value from a multi-select filter.
   * @param $event Event
   */
  onRemove($event: any) {
    const bucket = $event.value as Bucket;
    const filterSelection: FilterSelection = {
      filterType: this.filterResponse.type,
      path: this.filterResponse.path,
      value: bucket,
      actionType: ActionType.REMOVE
    };
    this.filterChange.emit(filterSelection);
  }

  /**
   * Checks to see if given bucket is selected from the list of selected values.
   * @param item Bucket.
   */
  isItemSelected(item: Bucket) {
    return this.selectedValues.includes(item.name);
  }

  /**
   * Toggle dropdown.
   */
  onViewMore() {
    this.isExpanded = !this.isExpanded;
  }
}
