import React, { useState } from 'react';
import { Avatar, Box } from '@mui/material';

const CustomAvatar = ({ src, children, sx, ...props }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // 如果有src但图片加载失败，或者没有src，显示默认内容
  if (!src || imageError) {
    return (
      <Avatar sx={sx} {...props}>
        {children}
      </Avatar>
    );
  }

  // 尝试加载图片
  return (
    <Avatar sx={sx} {...props}>
      <Box
        component="img"
        src={src}
        onError={handleImageError}
        onLoad={handleImageLoad}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        crossOrigin="anonymous"
      />
    </Avatar>
  );
};

export default CustomAvatar;
