const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Assign parsed data back
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    
    next();
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid request data',
    });
  }
};

module.exports = validate;
