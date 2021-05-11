export const solveMathEquation = (
  operator: string,
  numbers: number[],
): number => {
  let result = 0;
  switch (operator) {
    case '+':
      result = numbers[0] + numbers[1];
      break;
    case '−':
    case '-':
      result = numbers[0] - numbers[1];
      break;
    case '*':
    case '×':
      result = numbers[0] * numbers[1];
      break;
    case '/':
    case '÷':
      result = numbers[0] / numbers[1];
      break;
    default:
      console.log('Wrong operator', operator);
      break;
  }

  return result;
};
