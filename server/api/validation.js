exports.checkRequiredFields = (...requiredFields) => ({ body }, res, next) => {
  const missingFields = requiredFields.filter((field) => body[field] == null);
  if (missingFields.length) {
    res
      .status(400)
      .send(`Missing required fields: ${missingFields.join(', ')}`);
    return;
  }

  next();
};
