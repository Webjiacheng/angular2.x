import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRoute } from '@angular/router';
import { tokenNotExpired } from 'angular2-jwt';


@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private activeRoute: ActivatedRoute
  ) { }

  canActivate() {

    //   this.activeRoute.queryParams.subscribe(
    //     queryParams => {
    //       if (tokenNotExpired()) {
    //         return true;
    //       }
    //       this.router.navigate(['/login', queryParams], { skipLocationChange: true });
    //   return false;
    // }
    // )
    this.activeRoute.params.subscribe(
      params => {
        if (tokenNotExpired()) {
          return true;
        }
        this.router.navigate(['/login', params], { skipLocationChange: true });
        return false;
      }
    )
    // if (tokenNotExpired()) {
    //   return true;
    // }

    // this.router.navigate(['/login'],queryParams);
    return false;
  }
}
