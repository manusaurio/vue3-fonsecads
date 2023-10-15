// eslint-disable-next-line import/prefer-default-export
export const dist = (p1: [number, number], p2: [number, number]): number => {
  const a = p1[0] - p2[0];
  const b = p1[1] - p2[1];

  return Math.sqrt(a ** 2 + b ** 2);
};
