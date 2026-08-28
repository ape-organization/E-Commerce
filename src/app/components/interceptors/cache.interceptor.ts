import {
  HttpContextToken,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';

import { signal } from '@angular/core';

import {
  Observable,
  of,
  tap,
  finalize,
  shareReplay
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
  response: unknown;
  expiresAt: number;
}


// ============================================================
// CACHE STORAGE
// ============================================================

const cache =
  new Map<string, CacheEntry>();


// ============================================================
// ACTIVE REQUESTS
//
// Prevents duplicate simultaneous GET requests.
//
// Example:
//
// Component A -> GET /Brands
// Component B -> GET /Brands
//
// Only one request is sent to the API.
// Both subscribers receive the same response.
// ============================================================

const activeRequests =
  new Map<string, Observable<unknown>>();


// ============================================================
// CACHE VERSION
// ============================================================

export const cacheVersion =
  signal(0);


// ============================================================
// CACHE TTL
// ============================================================

const CACHE_TTL =
  30 * 60 * 1000; // 30 minutes


// ============================================================
// CACHEABLE RESOURCES
// ============================================================

type CacheResource =
  | 'brands'
  | 'categories'
  | 'subcategories';


// ============================================================
// CHECK IF REQUEST SHOULD BE CACHED
// ============================================================

function isCacheableRequest(
  req: HttpRequest<unknown>
): boolean {

  // Only GET requests
  if (
    req.method.toUpperCase() !== 'GET'
  ) {
    return false;
  }

  // Explicit cache request
  if (
    req.context.get(CACHE_REQUEST)
  ) {
    return true;
  }

  // Automatic lookup cache
  return (
    getCacheResource(req.url) !== null
  );
}


// ============================================================
// GET CACHE RESOURCE
// ============================================================

function getCacheResource(
  url: string
): CacheResource | null {

  const normalizedUrl =
    url
      .toLowerCase()
      .split('?')[0];

  // ----------------------------------------------------------
  // BRANDS
  // ----------------------------------------------------------

  if (
    isEndpoint(
      normalizedUrl,
      '/brands'
    )
  ) {
    return 'brands';
  }

  // ----------------------------------------------------------
  // SUBCATEGORIES
  //
  // Must be checked before categories.
  // ----------------------------------------------------------

  if (
    isEndpoint(
      normalizedUrl,
      '/subcategories'
    )
  ) {
    return 'subcategories';
  }

  // ----------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------

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
// ENDPOINT CHECK
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

  /*
   * urlWithParams is important.
   *
   * Example:
   *
   * /subcategories?categoryId=1
   * /subcategories?categoryId=2
   *
   * must have different cache entries.
   */

  return (
    req.method.toUpperCase() +
    ':' +
    req.urlWithParams
  );
}


// ============================================================
// CACHE KEY RESOURCE CHECK
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
// CLEAR RESOURCE CACHE
// ============================================================

function clearCacheForResource(
  resource: CacheResource
): void {

  // ----------------------------------------------------------
  // CLEAR CACHED RESPONSES
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // CLEAR ACTIVE REQUESTS
  //
  // Normally active requests finish naturally.
  // Removing them here prevents future callers from
  // attaching to an invalidated request.
  // ----------------------------------------------------------

  for (
    const key of activeRequests.keys()
  ) {

    if (
      cacheKeyContainsResource(
        key,
        resource
      )
    ) {

      activeRequests.delete(key);
    }
  }

  // ----------------------------------------------------------
  // UPDATE SIGNAL
  // ----------------------------------------------------------

  cacheVersion.update(
    value => value + 1
  );
}


// ============================================================
// INVALIDATE CACHE AFTER MUTATION
// ============================================================

function invalidateCache(
  req: HttpRequest<unknown>
): void {

  const resource =
    getCacheResource(req.url);

  // ----------------------------------------------------------
  // BRAND
  // ----------------------------------------------------------

  if (
    resource === 'brands'
  ) {

    clearCacheForResource(
      'brands'
    );

    return;
  }

  // ----------------------------------------------------------
  // SUBCATEGORY
  // ----------------------------------------------------------

  if (
    resource === 'subcategories'
  ) {

    clearCacheForResource(
      'subcategories'
    );

    /*
     * Categories may contain their subcategories.
     */

    clearCacheForResource(
      'categories'
    );

    return;
  }

  // ----------------------------------------------------------
  // CATEGORY
  // ----------------------------------------------------------

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
  // CACHEABLE GET REQUEST
  // ==========================================================

  if (
    isCacheableRequest(req)
  ) {

    const cacheKey =
      getCacheKey(req);


    // ========================================================
    // 1. CHECK VALID CACHE
    // ========================================================

    const cached =
      cache.get(cacheKey);

    if (
      cached &&
      Date.now() < cached.expiresAt
    ) {

      return of(
        cached.response
      ) as Observable<any>;
    }


    // ========================================================
    // 2. REMOVE EXPIRED CACHE
    // ========================================================

    if (cached) {

      cache.delete(cacheKey);
    }


    // ========================================================
    // 3. CHECK ACTIVE REQUEST
    // ========================================================

    const activeRequest =
      activeRequests.get(cacheKey);

    if (
      activeRequest
    ) {

      return activeRequest as Observable<any>;
    }


    // ========================================================
    // 4. SEND REQUEST
    // ========================================================

    const request$ =
      next(req).pipe(

        // ----------------------------------------------------
        // SAVE SUCCESSFUL RESPONSE
        // ----------------------------------------------------

        tap({
          next: response => {

            cache.set(
              cacheKey,
              {
                response,
                expiresAt:
                  Date.now() +
                  CACHE_TTL
              }
            );

            cacheVersion.update(
              value => value + 1
            );
          }
        }),

        // ----------------------------------------------------
        // ALWAYS REMOVE ACTIVE REQUEST
        //
        // Runs on:
        // - success
        // - error
        // - unsubscribe
        // ----------------------------------------------------

        finalize(() => {

          activeRequests.delete(
            cacheKey
          );
        }),

        // ----------------------------------------------------
        // SHARE HTTP REQUEST
        //
        // refCount:true prevents the shared observable from
        // staying subscribed unnecessarily.
        // ----------------------------------------------------

        shareReplay({
          bufferSize: 1,
          refCount: true
        })
      );


    // ========================================================
    // 5. STORE ACTIVE REQUEST
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

        // ----------------------------------------------------
        // INVALIDATE CACHE AFTER MUTATION
        // ----------------------------------------------------

        if (
          isMutation
        ) {

          invalidateCache(req);
        }
      }
    })
  );
};