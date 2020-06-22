import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import SECURITY from '../Constants/SECURITY';

// hash password
export const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  return hashedPassword;
};

// match hashed & plain password
export const matchPassword = async (plainPassword, hashedPassword) => await bcrypt.compare(plainPassword, hashedPassword);

// generate a jwt
export const generateJwt = (data) =>
  jsonwebtoken.sign(
    // user information
    data,
    // jwt secret
    process.env.JWT_SECRET,
    // token configuration
    {
      audience: process.env.JWT_AUD,
      issuer: process.env.JWT_ISS,
      expiresIn: SECURITY.JWT_AGE,
    }
  );
