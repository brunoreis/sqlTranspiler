const checkCircularity = (macros, conditions, macrosStack) => {
  const [operator, ...args] = conditions
  if (['and', 'or'].includes(operator)) {
    args.forEach((conditionOrMacro) => {
      if (conditionOrMacro[0] === 'macro') {
        const innerMacroName = conditionOrMacro[1]
        macrosStack.push(innerMacroName)
        if (macrosStack.length !== Array.from(new Set(macrosStack)).length) {
          return null
        }
        checkCircularity(macros, macros[innerMacroName], macrosStack)
      } else {
        checkCircularity(macros, conditionOrMacro, macrosStack)
      }
    })
  }
  if (operator === 'macro') {
    const [innerMacroName] = args
    macrosStack.push(innerMacroName)
    checkCircularity(macros, macros[innerMacroName], macrosStack)
  }
  return null
}

export const nestedMacroErrors = (macros) => {
  const errors = []
  Object.keys(macros).forEach((macroName) => {
    const cycle = [macroName]
    checkCircularity(macros, macros[macroName], cycle)
    if (cycle.length !== Array.from(new Set(cycle)).length) {
      errors.push(cycle)
    }
  })
  return errors
}
