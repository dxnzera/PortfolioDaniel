export type AvatarVector = readonly [number, number, number];

export interface AvatarConfig {
  modelUrl: string | null;
  scale: number;
  position: AvatarVector;
  rotation: AvatarVector;
  poses: readonly [number, number, number, number];
}

export const avatarConfig: AvatarConfig = {
  modelUrl: "/images/Avatar-Daniel-optimized.glb",
  scale: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  poses: [0.38, 2.45, 3.85, Math.PI * 2 + 0.38],
};
