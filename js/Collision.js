export function rectsIntersect(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

export function resolvePlatformCollisions(player, platforms) {
  player.grounded = false;
  player.currentPlatform = null;
  let landedPlatform = null;

  const playerBox = player.getHitbox();
  for (const platform of platforms) {
    const platformBox = platform.getHitbox();
    const wasAbove = player.previousBottom <= platformBox.y + 8;
    const isFalling = player.velocityY >= 0;

    if (rectsIntersect(playerBox, platformBox) && wasAbove && isFalling) {
      player.y = platformBox.y - player.height;
      player.velocityY = 0;
      player.grounded = true;
      player.coyoteTimer = player.coyoteDuration;
      player.currentPlatform = platform;
      player.landedThisFrame = true;
      landedPlatform = platform;
      break;
    }
  }

  return landedPlatform;
}
