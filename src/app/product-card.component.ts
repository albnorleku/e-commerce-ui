import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationExtras, Router} from '@angular/router';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})

/**
 * Product Card.
 */
export class ProductCardComponent implements OnInit {

  /**
   * Product
   */
  @Input() product: any;

  /**
   * Product (default)image
   */
  productImage;

  defaultImg = 'assets/images/ucx_logo.svg';

  categories: string[] = [];


  /**
   * Sum total price of product relations
   */
  relationTotalPrice: undefined | number = undefined;

  /**
   * Constructor.
   *
   * @param router      Router.
   * @param activatedRoute ActivatedRoute.
   * @param channelService ChannelService
   */
  constructor(private router: Router,
              private activatedRoute: ActivatedRoute) {
  }

  /**
   * NgOnInit.
   */
  ngOnInit(): void {
    const product = this.product;
    const partnerId = this.activatedRoute.snapshot.queryParamMap.get('partnerId') ?? this.activatedRoute.snapshot.paramMap.get('partnerId');
    if (this.product.sellerCategories && this.product.sellerCategories.length > 0) {
      this.categories = [];
    }

    if (product.imageUrl) {
      this.productImage = `http://${product.imageUrl}`;
    }

    if (product.hasRelations && product.relations.length > 0) {
      this.relationTotalPrice = 0;
      product.relations.forEach(relation => this.relationTotalPrice = this.relationTotalPrice + relation.price);
    }
  }

  get routeParams() {
    return this.activatedRoute.snapshot.paramMap;
  }

  get routeQueryParams() {
    return this.activatedRoute.snapshot.queryParamMap;
  }
}

