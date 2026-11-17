/**
 * Wraps an async controller so thrown errors reach Express error handling
 * instead of becoming an unhandled promise rejection.
 *
 * Usage: router.get("/", asyncHandler(myController))
 */
export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
