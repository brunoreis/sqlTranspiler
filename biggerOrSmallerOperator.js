export const biggerOrSmallerOperator = (f, operator, args) => {
  if (args.length != 2) {
    throw new Error(' < and > require exactly two args')
  }
  const [firstArg, secondArg] = args
  if (firstArg === null || secondArg === null) {
    throw new Error(' < and > do not accept null values')
  }
  return `${f(firstArg)} ${operator} ${f(secondArg)}`
}
