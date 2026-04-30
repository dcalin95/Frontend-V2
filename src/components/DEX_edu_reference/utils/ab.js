export function getVariant(key, options = ['A','B']){
  try{
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get('ab');
    if (fromUrl && options.includes(fromUrl.toUpperCase())) return fromUrl.toUpperCase();
    const storeKey = `ab_${key}`;
    let v = localStorage.getItem(storeKey);
    if (!v) { v = options[Math.floor(Math.random()*options.length)]; localStorage.setItem(storeKey, v); }
    return v;
  }catch(_){ return options[0]; }
}


