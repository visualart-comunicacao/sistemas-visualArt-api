export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const err = new Error('Validation error');
      err.status = 422;
      err.name = 'ValidationError';
      err.details = result.error.flatten();
      return next(err);
    }

    req.validated = result.data;
    return next();
  };
}

export function validateBody(schema) {
  return (req, _res, next) => {
    console.log('entrei aqui')
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const err = new Error('Validation error');
      err.status = 422;
      err.name = 'ValidationError';
      err.details = result.error.flatten();
      return next(err);
    }

    req.validated = result.data;
    req.body = result.data;
    return next();
  };
}