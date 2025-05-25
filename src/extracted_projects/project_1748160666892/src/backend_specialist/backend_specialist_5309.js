// utils/validation.js (Example using Joi - install with `npm install joi`)
const Joi = require('joi');

const postSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  content: Joi.string().min(10).required(),
});

const userSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const validatePost = (post) => {
  return postSchema.validate(post);
};

const validateUser = (user) => {
  return userSchema.validate(user);
};

module.exports = { validatePost, validateUser };