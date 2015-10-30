module.exports = {
  canRenderClipAnimationsNicely: () => {
    // The other browsers just don't animate the clip property
    // at 60fps. If they ever improve, change this function.
    return /Chrome/.test(window.navigator.userAgent);
  }
}