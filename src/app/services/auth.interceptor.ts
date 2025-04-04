import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, catchError, throwError } from 'rxjs';
import { AppComponent } from '../app.component';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  
  console.log("Dentro del interceptador");

  const token = localStorage.getItem('access_token');
  const tokenRefresh = localStorage.getItem('refresh_token');
  const router = inject(Router);
  const toastr = inject(ToastrService);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  else if (tokenRefresh) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${tokenRefresh}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('access_token');
        toastr.error(
          'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
          'Sesión Expirada',
          {
            timeOut: 3000,
            closeButton: true
          }
        );
      }
      return throwError(() => error);
    })
  );
}
