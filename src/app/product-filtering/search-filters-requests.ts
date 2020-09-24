export interface SearchRequest extends SearchAndPaginationRequest {
    geo?: GeoRequest;
    include?: string[];
    exclude?: string[];
    filters?: FilterRequest;
}

export interface FilterRequest {
    stringFacet?: {
        [key: string]: string[]
    };
    numberFacet?: {
        [key: string]: [string]
    };
    nestedFacet?: {
        [key: string]: string[]
    };
}

export interface SearchAndPaginationRequest {
    page?: number;
    pageSize?: number;
    sort?: string[];
    searchBox?: string;
}

export interface SearchResponse {
    items?: any[];
    page?: number;
    pageSize?: number;
    total?: number;
    sort?: {
        [key: string]: 'ASC' | 'DESC'
    };
    geo: GeoRequest;
    actionType?: ActionType;
    filters?: FilterResponse[];
}

export interface FilterResponse {
    path: string;
    type: FacetType;
    name: string;
    buckets: Bucket[];
    min: number;
    max: number;
    documentsFound: number;
    location?: Location;
}

export type FacetType = 'stringFacet' | 'nestedFacet' | 'numberFacet';

export interface Bucket {
    name: string;
    documentsFound?: number;
    additionalData?: any;
}

export interface FilterSelection {
    filterType: keyof FilterRequest;
    path: string;
    value?: Bucket;
    actionType?: ActionType;
}

export interface Location {
    location: string;
    geo: GeoRequest;
}

export interface GeoRequest {
    latitude: number;
    longitude: number;
    radius: number;
    distanceUnit: 'KILOMETERS' | 'MILES';
}

export enum FilterPath {
    CATEGORY_TYPE = 'sellers.categoryTypes.categoryType',
    CATEGORY = 'Category',
    SELLER_ID = 'sellers.sellerId',
    BRAND = 'Brand',
}

export enum ActionType {
    ADD,
    REMOVE,
    CLEAR_ALL,
    CLEAR_FILTER,
    SLIDER_CHANGE,
    SEARCH,
    PAGE_CHANGE,
    LOCATION_CHANGE,
    SORT_CHANGE
}
