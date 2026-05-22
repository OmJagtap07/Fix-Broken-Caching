# Changes Log - Fix Broken Caching

## 1. Identified Issues
The initial application had several critical bugs that caused hanging requests, incorrect data caching, and potential memory leaks:
- **Global Cache Key (`global_data_key`)**: A single cache key was used for all requests, leading to data collisions.
- **Missing Await**: In `GET /tasks`, the code was caching a Promise (`prisma.task.findMany()`) instead of the actual resolved data.
- **Caching Null Values**: In `GET /tasks/:id`, if a task didn't exist, it still cached a `null` value permanently.
- **No Cache Expiration (TTL)**: Cached data stayed in memory forever, leading to stale responses and increased memory consumption.
- **Cache Invalidation Missing**: In `DELETE /tasks/:id` and `POST /tasks`, the old cache was never cleared, meaning users still saw deleted tasks and didn't see newly created ones.
- **Swallowed Errors**: Caught errors were merely logged, leaving the client hanging without a proper HTTP response.
- **Incorrect HTTP Status Codes**: Operations like POST and DELETE returned a 200 instead of their correct codes (201 Created, 204 No Content).

## 2. Improvements Implemented
To ensure system reliability, the following changes were made:
- **Cache Service Layer**: Created a new `CacheService` using a Map to handle caching logic, including generic `set`, `get`, `del`, and TTL (Time-To-Live).
- **Namespaced Cache Keys**: Instead of a global key, the cache keys are now specific to the resource (e.g., `tasks:list` for all tasks, `task:ID` for individual tasks).
- **TTL Mechanism**: Every cache entry is now set with an expiration time of 60 seconds.
- **Proper Async/Await Flow**: Ensures the application waits for Prisma to resolve before storing data in the cache.
- **Null Safety**: Validates if `prisma.task.findUnique()` returns a result. If it returns null, a `404 Not Found` is returned and the null value is *not* cached.
- **Centralized Error Handling**: Replaced individual `console.log()` statements with `next(err)` to pass errors down to a global error handler middleware.
- **Cache Invalidation**: On successful `POST /tasks`, the `tasks:list` cache is invalidated. On `DELETE /tasks/:id`, both `tasks:list` and `task:ID` caches are cleared.
- **Standardized Status Codes**:
  - `201 Created` for successful POST requests.
  - `204 No Content` for successful DELETE requests.
  - `404 Not Found` when requesting an ID that doesn't exist.

## 3. Reasoning
- Refactoring the cache into a dedicated service layer keeps the routing logic clean and ensures caching behavior is consistent across endpoints.
- Setting TTL prevents memory from growing indefinitely while ensuring clients eventually get fresh database data.
- Returning the correct HTTP status code aligns the API with REST standards, making it easier for clients to correctly parse outcomes.
