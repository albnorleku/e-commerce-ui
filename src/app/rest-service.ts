import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SearchRequest, SearchResponse} from './product-filtering/search-filters-requests';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  constructor(private httpClient: HttpClient) {

  }

  public publicRequest(request: SearchRequest): Observable<SearchResponse> {
    return this.httpClient.post<SearchResponse>('http://localhost:8081/api/search/products', request);
  }
}
