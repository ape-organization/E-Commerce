import {
  HttpContextToken,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';

import {
  signal
} from '@angular/core';

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

/*
 * Allows a request to explicitly enable caching.
 *
 * Example:
 *
 * this.http.get(url, {
 *   context: new HttpContext().set(CACHE_REQUEST, true)
 * });
 *
 * The interceptor also automatically caches the lookup
 * endpoints configured below.
 */

export const CACHE_REQUEST =
  new HttpContextToken<boolean>(
    () => false
  );


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
// Prevents duplicate requests:
//
// Component A -> GET /brands
// Component B -> GET /brands
//
// Only one request goes to the API.
// Both subscribers receive the same result.
// ============================================================

const activeRequests =
  new Map<
    string,
    Observable<unknown>
  >();


// ============================================================
// CACHE SIGNAL
// ============================================================

/*
 * This signal changes whenever the cache is modified.
 *
 * We don't need to read it in every component.
 * It gives us a reactive cache state that can be used later
 * if needed.
 */

export const cacheVersion =
  signal(0);


// ============================================================
// CACHE TTL
// ============================================================

const CACHE_TTL =
  30 * 60 * 1000;


// ============================================================
// CACHEABLE RESOURCE
// ============================================================

type CacheResource =
  | 'brands'
  | 'categories'
  | 'subcategories';


// ============================================================
// CACHEABLE REQUEST
// ============================================================

function isCacheableRequest(
  req: HttpRequest<unknown>
): boolean {

  // ==========================================================
  // ONLY GET
  // ==========================================================

  if (
    req.method.toUpperCase() !== 'GET'
  ) {

    return false;

  }


  // ==========================================================
  // EXPLICIT CACHE REQUEST
  // ==========================================================

  if (
    req.context.get(
      CACHE_REQUEST
    )
  ) {

    return true;

  }


  // ==========================================================
  // AUTOMATIC LOOKUP CACHE
  // ==========================================================

  return (
    getCacheResource(
      req.url
    ) !== null
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


  // ==========================================================
  // BRANDS
  // ==========================================================

  if (
    isEndpoint(
      normalizedUrl,
      '/brands'
    )
  ) {

    return 'brands';

  }


  // ==========================================================
  // SUBCATEGORIES
  //
  // Check this BEFORE categories because:
  //
  // /subcategories
  //
  // also contains the word "categories".
  // ==========================================================

  if (
    isEndpoint(
      normalizedUrl,
      '/subcategories'
    )
  ) {

    return 'subcategories';

  }


  // ==========================================================
  // CATEGORIES
  // ==========================================================

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
    url.includes(
      `${endpoint}/`
    )
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
// CLEAR RESOURCE CACHE
// ============================================================

function clearCacheForResource(
  resource: CacheResource
): void {

  const keysToDelete: string[] = [];


  // ==========================================================
  // FIND CACHE ENTRIES
  // ==========================================================

  for (
    const key of cache.keys()
  ) {

    if (
      cacheKeyContainsResource(
        key,
        resource
      )
    ) {

      keysToDelete.push(
        key
      );

    }

  }


  // ==========================================================
  // DELETE CACHE ENTRIES
  // ==========================================================

  for (
    const key of keysToDelete
  ) {

    cache.delete(
      key
    );

  }


  // ==========================================================
  // CLEAR ACTIVE REQUESTS
  // ==========================================================

  for (
    const key of activeRequests.keys()
  ) {

    if (
      cacheKeyContainsResource(
        key,
        resource
      )
    ) {

      activeRequests.delete(
        key
      );

    }

  }


  // ==========================================================
  // UPDATE SIGNAL
  // ==========================================================

  cacheVersion.update(
    value => value + 1
  );


  console.log(
    `CACHE CLEARED: ${resource}`
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


  switch (
    resource
  ) {

    case 'brands':

      return normalized.includes(
        '/brands'
      );


    case 'subcategories':

      return normalized.includes(
        '/subcategories'
      );


    case 'categories':

      /*
       * Do NOT match /subcategories here.
       */

      return (
        normalized.includes(
          '/categories'
        ) &&
        !normalized.includes(
          '/subcategories'
        )
      );


    default:

      return false;

  }

}


// ============================================================
// INVALIDATE CACHE AFTER MUTATION
// ============================================================

function invalidateCache(
  req: HttpRequest<unknown>
): void {

  const resource =
    getCacheResource(
      req.url
    );


  // ==========================================================
  // BRAND
  // ==========================================================

  if (
    resource === 'brands'
  ) {

    clearCacheForResource(
      'brands'
    );

    return;

  }


  // ==========================================================
  // SUBCATEGORY
  // ==========================================================

  if (
    resource === 'subcategories'
  ) {

    clearCacheForResource(
      'subcategories'
    );

    /*
     * If your category API returns categories together
     * with their subcategories, category cache must also
     * be cleared.
     */

    clearCacheForResource(
      'categories'
    );

    return;

  }


  // ==========================================================
  // CATEGORY
  // ==========================================================

  if (
    resource === 'categories'
  ) {

    clearCacheForResource(
      'categories'
    );

    /*
     * Category changes can affect available
     * subcategories.
     */

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
  // GET CACHE
  // ==========================================================

  if (
    isCacheableRequest(req)
  ) {

    const cacheKey =
      getCacheKey(
        req
      );


    // ========================================================
    // CHECK CACHE
    // ========================================================

    const cached =
      cache.get(
        cacheKey
      );


    if (
      cached &&
      Date.now() <
      cached.expiresAt
    ) {

      console.log(
        'CACHE HIT:',
        req.urlWithParams
      );


      return of(
        cached.response
      ) as Observable<any>;

    }


    // ========================================================
    // REMOVE EXPIRED CACHE
    // ========================================================

    if (cached) {

      cache.delete(
        cacheKey
      );

    }


    // ========================================================
    // CHECK ACTIVE REQUEST
    // ========================================================

    const activeRequest =
      activeRequests.get(
        cacheKey
      );


    if (
      activeRequest
    ) {

      console.log(
        'CACHE REQUEST REUSED:',
        req.urlWithParams
      );


      return activeRequest as Observable<any>;

    }


    // ========================================================
    // SEND API REQUEST
    // ========================================================

    const request$ =
      next(req).pipe(

        // ====================================================
        // SAVE RESPONSE
        // ====================================================

        tap(
          response => {

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


            console.log(
              'CACHE SET:',
              req.urlWithParams
            );

          }
        ),


        // ====================================================
        // REMOVE ACTIVE REQUEST
        // ====================================================

        finalize(() => {

          activeRequests.delete(
            cacheKey
          );

        }),


        // ====================================================
        // SHARE REQUEST
        // ====================================================

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

        // ====================================================
        // INVALIDATE AFTER POST / PUT / PATCH / DELETE
        // ====================================================

        if (
          isMutation
        ) {

          invalidateCache(
            req
          );

        }

      }

    })

  );

};