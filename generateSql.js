const addLimit = (dialect, where, limit) => {
  if(!limit) {
    return `SELECT * FROM data${where};`
  }
  switch (dialect) {
    case "sqlserver":
      return `SELECT TOP ${limit} * FROM data${where};`
    case "postgres":
    case "mysql":
      return `SELECT * FROM data${where} LIMIT ${limit};`
    defaul:
      throw new Error(`Unsupported dialect: ${dialect}`)
  }
}

const equalityOperator = (f, operator, args) => {
  if (args.length < 2) {
    throw new Error(' = and != require at least two args')
  }

  if (args.length === 2) {
    const secondArg = f(args[1])
    const finalOperator =
      secondArg === null ? (operator === '=' ? 'IS' : 'IS NOT') : operator === '!=' ? '<>' : '='

    const finalSecondArg = secondArg === null ? 'NULL' : secondArg
    return `${f(args[0])} ${finalOperator} ${finalSecondArg}`
  }

  if (args.length > 2) {
    const finalOperator = operator === '=' ? 'IN' : 'NOT IN'
    const [field, ...otherArgs] = args
    return `${f(field)} ${finalOperator} (${otherArgs.join(', ')})`
  }
}

const biggerOrSmallerOperator = (f, operator, args) => {
  if (args.length != 2) {
    throw new Error(' < and > require exactly two args')
  }
  const [firstArg, secondArg] = args
  if( firstArg === null || secondArg === null) {
    throw new Error(' < and > do not accept null values')
  }
  return `${f(firstArg)} ${operator} ${f(secondArg)}`
}


const emptyOrNotEmptyOperator = (f, operator, args) => {
  if (args.length > 1) {
    throw new Error('is-empty and not-empty need only one arg')
  }
  return equalityOperator(f, operator === 'is-empty' ? '=' : '!=', [...args, null])
}

const andOrOperator = (f, macros, operator, args) => {
  if(args.length === 1) {
    return where(f, macros, args[0])
  }
  else {
    return args.map( (innerCondition) => where(f, macros, innerCondition, true) ).join( operator === 'and' ? ' AND ' : ' OR ')
  }
}


const where = (f, macros, conditions, deep = false) => {
  if(!conditions) return ""

  const [ operator, ...args ] = conditions
  let whereClause
  if( ['and', 'or'].includes(operator) ) {
    const innerWhere = andOrOperator(f, macros, operator, args)
    whereClause = deep ? '('+ innerWhere + ')' : innerWhere
  }
  if( ['=', '!='].includes(operator) ) {
      whereClause = equalityOperator(f, operator, args)
  }
  if (['<', '>'].includes(operator)) {
    whereClause = biggerOrSmallerOperator(f, operator, args)
  }
  if(['is-empty', 'not-empty'].includes(operator)) {
    whereClause = emptyOrNotEmptyOperator(f, operator, args)
  }

  if( operator === 'macro') {
    const [ macroName ] = args
    if(macros[macroName]) {
      whereClause = where(f, macros, macros[macroName])
    } else {
      throw new Error(`Macro ${macroName} does not exist`)
    }
  }
  return whereClause
}

const applyF = (fields) => (arg) => {
  if(arg === null) return null
  if(Array.isArray(arg)) {
    return fields[arg[1]]
  }
  return typeof arg === 'number' ? arg : `'${arg}'`
}

const checkCircularity = (macros, conditions, macrosStack) => {
  const [operator, ...args] = conditions
  if( ['and', 'or'].includes(operator) ) {
    args.forEach( (conditionOrMacro) =>  {
      if(conditionOrMacro[0] === 'macro') {
        const innerMacroName = conditionOrMacro[1]
        macrosStack.push(innerMacroName)
        if(macrosStack.length !== Array.from(new Set(macrosStack)).length) {
          return null
        }
        checkCircularity(macros, macros[innerMacroName], macrosStack)
      } else {
        checkCircularity(macros, conditionOrMacro, macrosStack)
      }
    })
  }
  if(operator === 'macro') {
    const [innerMacroName] = args
    macrosStack.push(innerMacroName)
    checkCircularity(macros, macros[innerMacroName], macrosStack)
  }
  return null
}

const nestedMacroErrors = (macros) => {
  const errors = []
  Object.keys(macros).forEach( (macroName) => {
    const cycle = [macroName]
    checkCircularity(macros, macros[macroName], cycle)
    if( cycle.length !== Array.from(new Set(cycle)).length ) {
      errors.push(cycle)
    }
  })
  return errors
}

export const generateSql = (dialect, fields, macros, query) => {
  const errors = nestedMacroErrors(macros)
  if(errors.length) {
    return `Circular Macros Detected: ${JSON.stringify(errors)}`
  }
  const whereStr = where(applyF(fields), macros,  query.where)
  return addLimit(dialect, whereStr ? ` WHERE ${whereStr}` : '', query.limit)
}
