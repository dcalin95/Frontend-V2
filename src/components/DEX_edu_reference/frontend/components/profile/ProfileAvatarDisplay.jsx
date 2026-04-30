import React, { useMemo, useState, useEffect } from 'react';
import { getProfileInitials, isPresetAvatarValue } from '../../utils/profileAvatarPresets';

/**
 * Profile avatar: uploaded image URL, or initials (including legacy `preset:*` values).
 */
export default function ProfileAvatarDisplay({
  avatar,
  username,
  email,
  className,
  imgClassName,
  fallbackClassName,
  svgClassName,
}) {
  const initials = useMemo(() => getProfileInitials(username, email), [username, email]);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatar]);

  const isPhoto =
    avatar
    && !imgFailed
    && typeof avatar === 'string'
    && !isPresetAvatarValue(avatar);

  if (isPhoto) {
    return (
      <img
        src={avatar}
        alt=""
        className={imgClassName || className}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span className={fallbackClassName || svgClassName || className}>{initials}</span>
  );
}
