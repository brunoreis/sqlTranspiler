export const equalityOperator = (f, operator, args) => {
  if (args.length < 2) {
    throw new Error(' = and != require at least two args')
  }

  if (args.length === 2) {
    const secondArg = f(args[1])
    const finalOperator =
      secondArg === null
        ? operator === '='
          ? 'IS'
          : 'IS NOT'
        : operator === '!='
        ? '<>'
        : '='

    const finalSecondArg = secondArg === null ? 'NULL' : secondArg
    return `${f(args[0])} ${finalOperator} ${finalSecondArg}`
  }

  if (args.length > 2) {
    const finalOperator = operator === '=' ? 'IN' : 'NOT IN'
    const [field, ...otherArgs] = args
    return `${f(field)} ${finalOperator} (${otherArgs.join(', ')})`
  }
}
