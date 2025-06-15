export const imageSource = (img, fallback) => {
  if (!img) return fallback;
  // allow either remote URI string or require() number
  return typeof img === 'string' ? { uri: img } : img;
};

export const avatarSource = (uri) =>
  imageSource(uri, require('../assets/user1.jpg'));

export const eventImageSource = (uri) =>
  imageSource(uri, require('../assets/logo.png'));
