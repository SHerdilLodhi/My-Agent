const Joi = require("joi");

// Custom validation for userId that accepts both UUID and MongoDB ObjectId
const userIdValidator = Joi.string().custom((value, helpers) => {
  // Check if it's a valid UUID (for Supabase compatibility)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Check if it's a valid MongoDB ObjectId (24 character hex string)
  const objectIdRegex = /^[0-9a-f]{24}$/i;
  
  if (uuidRegex.test(value) || objectIdRegex.test(value)) {
    return value;
  }
  
  return helpers.error('any.invalid');
}, 'userId validation');

// Validation schema for message endpoint
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Message is required',
    'string.min': 'Message must be at least 1 character long',
    'string.max': 'Message cannot exceed 1000 characters',
    'any.required': 'Message is required'
  }),
  userId: userIdValidator.required().messages({
    'any.invalid': 'User ID must be a valid UUID or MongoDB ObjectId',
    'any.required': 'User ID is required'
  }),
});

// Message validation middleware
function validateMessage(req, res, next) {
  const { error, value } = messageSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.validatedData = value;
  next();
}

module.exports = {
  validateMessage,
}; 