import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CustomStepDefinition, LabelType, Options} from 'ng5-slider';
import {FilterConstant} from '../filter-constant';
import {ActionType, FilterResponse, FilterSelection} from '../search-filters-requests';

@Component({
    selector: 'app-slider',
    template: `
        <div class="slide-wrap">
            <ng-container [ngSwitch]="filterResponse.name">
                <span *ngSwitchCase="'ram'" class="filter-title">{{'RAM (GB)'}}</span>
                <span *ngSwitchCase="'cpu'" class="filter-title">{{'CPU'}}</span>
                <span *ngSwitchDefault class="filter-title">{{filterResponse.name}}</span>
            </ng-container>
            <div class="range-slider">
                <div class="range-slider-inner">
                    <div class="range-width">
                        <ng5-slider class="range-server" [(value)]="filterResponse.min" [(highValue)]="filterResponse.max"
                                    [options]="options" (userChangeEnd)="onRangeSelected($event)"></ng5-slider>
                    </div>
                </div>
            </div>
        </div>`
})
/**
 * Slider Component.
 */
export class SliderComponent implements OnInit {

    /**
     *  Input params field as object.
     */
    @Input() filterResponse: FilterResponse;

    options: Options = {
        translate: (value: any, label: LabelType): string => {
            switch (this.filterResponse.name) {
                case 'ram':
                    return this.displayRAM(value, label);
                case 'cpu':
                    return this.displayCores(value, label);
                default:
                    return value;
            }
        }
    };

    copiedField: any;

    @Output() valueChanged = new EventEmitter<FilterSelection>();

    /**
     * Constructor.
     *
     */
    constructor() {
    }

    /**
     * On Range selected.
     *
     * @param event any.
     */
    onRangeSelected(event: any): void {
        const selection = this.computeSubmitValue(event);
        const filterSelection: FilterSelection = {
            filterType: this.filterResponse.type,
            path: this.filterResponse.path,
            value: {name: selection},
            actionType: ActionType.SLIDER_CHANGE
        };
        this.valueChanged.emit(filterSelection);
    }

    /**
     * NgOnInit.
     */
    ngOnInit(): void {
        this.pushStepArray();
        this.copiedField = Object.assign({}, this.filterResponse);

        /* for sliders that aren't CPU or RAM */
        if (this.copiedField.name !== 'cpu' && this.copiedField.name !== 'ram') {
            this.options.floor = this.copiedField.min;
            this.options.ceil = this.copiedField.max;
        }
    }

    /**
     * Return submit value on format minValue - highValue,
     * if slider is for RAM (returned value is always in MB)
     * method convert to GB.
     *
     * @param option any.
     * @return       string.
     */
    public computeSubmitValue(option: any): string {
        if (option.highValue > this.copiedField.highValue) {
            option.highValue = this.copiedField.highValue;
        }

        if (option.value < this.copiedField.value) {
            option.value = this.copiedField.value;
        }

        option.highValue = this.filterResponse.name.includes('cpu') && option.highValue === FilterConstant.CORES ? 1024 : option.highValue;

        return option.value + '-' + option.highValue;
    }

    /**
     *  Convert ceil limit to > 1024, based on condition.
     *
     *  @param value any    floor value of slider.
     *  @param label any    to display.
     *
     *  @return display label
     */
    private displayRAM(value: any, label: LabelType): string {
        switch (label) {
            case LabelType.Low:
                return value;
            case LabelType.High:
                return value > FilterConstant.RAM ? '>' + FilterConstant.RAM : value;
            default:
                return '';
        }
    }

    /**
     *  Convert ceil limit to > 64, based on condition.
     *
     *  @param value any    floor value of slider.
     *  @param label any    to display.
     *
     *  @return display label
     */
    private displayCores(value: any, label: LabelType): string {
        switch (label) {
            case LabelType.Low:
                return value;
            case LabelType.High:
                return value > FilterConstant.CORES + 1 ? '>' + FilterConstant.CORES : value;
            default:
                return '';
        }
    }

    /**
     * Generate steps power of 2.
     *
     * @param upperBound number    ceil of RAM or Cores.
     *
     * @return Array<CustomStepDefinition> list.
     */
    private generateSteps(upperBound: number): Array<CustomStepDefinition> {
        const steps = [];
        for (let i = 0; i < Math.log2(upperBound); i++) {
            steps.push({value: Math.pow(2, i)});
        }
        steps.push({value: upperBound + 1});
        return steps;
    }

    /**
     * Push step array to slider option for RAM and CORES.
     */
    private pushStepArray(): void {
        switch (this.filterResponse.name) {
            case 'ram':
                this.options.stepsArray = this.generateSteps(FilterConstant.RAM);
                break;
            case 'cpu':
                this.options.stepsArray = this.generateSteps(FilterConstant.CORES);
                break;
        }
    }
}
