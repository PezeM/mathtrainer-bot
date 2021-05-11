export const getRandomNumber = (minimum: number, maximum: number) =>
  (Math.random() * (maximum - minimum + 1)) << 0;
