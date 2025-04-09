import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, catchError, throwError, switchMap, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const token = localStorage.getItem('access_token');
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        console.log('Sessió expirada, intentant refrescar el token...');

        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.log('No s\'ha trobat cap refresh token');
          return throwError(() => error);
        }
        const credentials = {
          refreshToken :refreshToken
        }
        return authService.generateAccesTokenFromRefreshToken(credentials).pipe(
          switchMap((response: any) => {
            const newAccessToken = response.accesToken;

            if (!newAccessToken) {
              console.log('No s\'ha pogut obtenir un nou token');
              return throwError(() => error);
            }

            localStorage.setItem('access_token', newAccessToken);

            // Tornem a intentar la request original amb el nou token
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newAccessToken}`
              }
            });

            return next(newReq); // 👈 Retorna la request original amb el token nou
          }),
          catchError(refreshErr => {
            console.log('Sessió expirada. Torna a iniciar sessió.');
            localStorage.clear();;
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
}
