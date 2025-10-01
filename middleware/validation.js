const Joi = require("joi");

// Validation schema for message endpoint
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Message is required',
    'string.min': 'Message must be at least 1 character long',
    'string.max': 'Message cannot exceed 1000 characters',
    'any.required': 'Message is required'
  }),
  userId: Joi.string().uuid().required().messages({
    'string.guid': 'User ID must be a valid UUID',
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