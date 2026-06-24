import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: true;
  data: T;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((value) => {
        // If the handler already returned a full envelope, we respect it
        if (value && typeof value === 'object' && 'success' in value) {
          return value;
        }
        // Otherwise we wrap data
        return {
          success: true,
          data: value?.data ?? value,
          ...(value?.meta ? { meta: value.meta } : {}),
        };
      }),
    );
  }
}