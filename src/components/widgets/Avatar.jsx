import React from 'react';

export const Avatar = ({ src, alt, className = '' }) => (
  <img
    src={src}
    alt={alt}
    className={`inline-block h-10 w-10 rounded-full ${className}`}
  />
);

export default Avatar;