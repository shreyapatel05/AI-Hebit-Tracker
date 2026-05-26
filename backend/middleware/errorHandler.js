// errorHandler.js

// Middleware to handle 404 Not Found errors
export const notFound = (req, res, next) => {
    res.status(404).json({
        error: {
            message: `Route not found: ${req.originalUrl}`,
            code: 404
        }
    });
};

// Middleware to handle general errors
export const errorHandler = (err, req, res, next) => {
    // Log the error details for debugging
    console.error(err);

    // Determine the status code
    const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    // Send the error response
    res.status(status).json({
        error: {
            message: err.message || "Server Error",
            code: status,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Include stack trace in development
        }
    });
};
