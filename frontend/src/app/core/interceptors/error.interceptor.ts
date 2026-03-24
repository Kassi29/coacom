import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiError } from '@shared/models/api-response.model';

const ERROR_MESSAGES: Record<number, string> = {
  0: 'No se pudo conectar con el servidor',
  400: 'Solicitud incorrecta',
  403: 'No tiene permisos para realizar esta acción',
  404: 'Recurso no encontrado',
  409: 'Conflicto con los datos existentes',
  500: 'Error interno del servidor',
};

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError: ApiError = {
        statusCode: error.status,
        message: (error.error as ApiError)?.message ?? ERROR_MESSAGES[error.status] ?? 'Error desconocido',
        error: (error.error as ApiError)?.error ?? error.statusText,
      };

      console.error(`[API Error] ${error.status}: ${apiError.message}`);

      return throwError(() => apiError);
    })
  );
};
