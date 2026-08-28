import {
  HttpContextToken,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';

import { signal } from '@angular/core';

import {
  Observable,
  of,
  tap,
  finalize,
  shareReplay,
  filter
} from 'rxjs';


// ============================================================
// CACHE REQUEST CONTEXT
// ============================================================

export const CACHE_REQUEST =
  new HttpContextToken<boolean>(() => false);


// ============================================================
// CACHE ENTRY
// ============================================================

interface CacheEntry {

  response: HttpResponse<unknown>;

  expiresAt: number;

}


// ============================================================
// CACHE
// ============================================================

const cache =
  new Map<string, CacheEntry>();


// ============================================================
// ACTIVE REQUESTS
// ============================================================

const activeRequests =
  new Map<
    string,
    Observable<HttpEvent<unknown>>
  >();


// ============================================================
// CACHE VERSION
// ============================================================

export const cacheVersion =
  signal(0);


// ============================================================
// CACHE TTL
// ============================================================

const CACHE_TTL =
  30 * 60 * 1000;


// ============================================================
// CACHEABLE RESOURCES
// ============================================================

type CacheResource =
  | 'brands'
  | 'categories'
  | 'subcategories';


// ============================================================
// CHECK CACHEABLE REQUEST
// ============================================================

function isCacheableRequest(
  req: HttpRequest<unknown>
): boolean {

  if (
    req.method.toUpperCase() !== 'GET'
  ) {

    return false;

  }

  if (
    req.context.get(CACHE_REQUEST)
  ) {

    return true;

  }

  return (
    getCacheResource(req.url) !== null
  );

}


// ============================================================
// GET RESOURCE
// ============================================================

function getCacheResource(
  url: string
): CacheResource | null {

  const normalizedUrl =
    url
      .toLowerCase()
      .split('?')[0];


  if (
    isEndpoint(
      normalizedUrl,
      '/brands'
    )
  ) {

    return 'brands';

  }


  if (
    isEndpoint(
      normalizedUrl,
      '/subcategories'
    )
  ) {

    return 'subcategories';

  }


  if (
    isEndpoint(
      normalizedUrl,
      '/categories'
    )
  ) {

    return 'categories';

  }


  return null;

}


// ============================================================
// ENDPOINT
// ============================================================

function isEndpoint(
  url: string,
  endpoint: string
): boolean {

  return (
    url.endsWith(endpoint) ||
    url.includes(`${endpoint}/`)
  );

}


// ============================================================
// CACHE KEY
// ============================================================

function getCacheKey(
  req: HttpRequest<unknown>
): string {

  return (
    req.method.toUpperCase() +
    ':' +
    req.urlWithParams
  );

}


// ============================================================
// RESOURCE CHECK
// ============================================================

function cacheKeyContainsResource(
  key: string,
  resource: CacheResource
): boolean {

  const normalized =
    key.toLowerCase();


  switch (resource) {

    case 'brands':

      return normalized.includes(
        '/brands'
      );


    case 'subcategories':

      return normalized.includes(
        '/subcategories'
      );


    case 'categories':

      return (
        normalized.includes('/categories') &&
        !normalized.includes('/subcategories')
      );


    default:

      return false;

  }

}


// ============================================================
// CLEAR CACHE
// ============================================================

function clearCacheForResource(
  resource: CacheResource
): void {

  for (
    const key of cache.keys()
  ) {

    if (
      cacheKeyContainsResource(
        key,
        resource
      )
    ) {

      cache.delete(key);

    }

  }


  cacheVersion.update(
    value => value + 1
  );

}


// ============================================================
// INVALIDATE CACHE
// ============================================================

function invalidateCache(
  req: HttpRequest<unknown>
): void {

  const resource =
    getCacheResource(req.url);


  if (
    resource === 'brands'
  ) {

    clearCacheForResource(
      'brands'
    );

    return;

  }


  if (
    resource === 'subcategories'
  ) {

    clearCacheForResource(
      'subcategories'
    );

    clearCacheForResource(
      'categories'
    );

    return;

  }


  if (
    resource === 'categories'
  ) {

    clearCacheForResource(
      'categories'
    );

    clearCacheForResource(
      'subcategories'
    );

  }

}


// ============================================================
// CACHE INTERCEPTOR
// ============================================================

export const cacheInterceptor:
  HttpInterceptorFn = (
    req,
    next
  ) => {

  // ==========================================================
  // MUTATION
  // ==========================================================

  const isMutation =
    [
      'POST',
      'PUT',
      'PATCH',
      'DELETE'
    ].includes(
      req.method.toUpperCase()
    );


  // ==========================================================
  // CACHEABLE GET
  // ==========================================================

  if (
    isCacheableRequest(req)
  ) {

    const cacheKey =
      getCacheKey(req);


    // ========================================================
    // CHECK CACHE
    // ========================================================

    const cached =
      cache.get(cacheKey);


    if (
      cached &&
      Date.now() < cached.expiresAt
    ) {

      return of(
        cached.response
      );

    }


    // ========================================================
    // REMOVE EXPIRED CACHE
    // ========================================================

    if (cached) {

      cache.delete(cacheKey);

    }


    // ========================================================
    // CHECK ACTIVE REQUEST
    // ========================================================

    const active =
      activeRequests.get(cacheKey);


    if (
      active
    ) {

      return active;

    }


    // ========================================================
    // CREATE REQUEST
    // ========================================================

    const request$ =
      next(req).pipe(

        // ----------------------------------------------------
        // ONLY CACHE HttpResponse
        // ----------------------------------------------------

        tap({
          next: event => {

            if (
              event instanceof HttpResponse
            ) {

              cache.set(
                cacheKey,
                {
                  response: event,
                  expiresAt:
                    Date.now() +
                    CACHE_TTL
                }
              );

              cacheVersion.update(
                value => value + 1
              );

            }

          }
        }),


        // ----------------------------------------------------
        // ALWAYS REMOVE ACTIVE REQUEST
        // ----------------------------------------------------

        finalize(() => {

          activeRequests.delete(
            cacheKey
          );

        }),


        // ----------------------------------------------------
        // SHARE REQUEST
        // ----------------------------------------------------

        shareReplay({
          bufferSize: 1,
          refCount: false
        })

      );


    // ========================================================
    // STORE ACTIVE REQUEST
    // ========================================================

    activeRequests.set(
      cacheKey,
      request$
    );


    return request$;

  }


  // ==========================================================
  // NORMAL REQUEST
  // ==========================================================

  return next(req).pipe(

    tap({

      next: () => {

        if (
          isMutation
        ) {

          invalidateCache(req);

        }

      }

    })

  );

};