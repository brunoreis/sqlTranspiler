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

const equality = (f, operator, args) => {
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

const biggerOrSmaller = (f, operator, args) => {
  if (args.length != 2) {
    throw new Error(' < and > require exactly two args')
  }
  const [firstArg, secondArg] = args
  if( firstArg === null || secondArg === null) {
    throw new Error(' < and > do not accept null values')
  }
  return `${f(firstArg)} ${operator} ${f(secondArg)}`
}

const andOrOperator = (f, operator, args) => {
  if(args.length === 1) {
    return where(f, args[0])
  }
  else {
    return args.map( (innerCondition) => where(f, innerCondition, true) ).join( operator === 'and' ? ' AND ' : ' OR ')
  }
}

const emptyOrNotEmpty = (f, operator, args) => {
  if(args.length > 1) {
    throw new Error('is-empty and not-empty need only one arg')
  }
  return equality(f, operator === 'is-empty' ? '=' : '!=' , [...args, null])
}

const where = (f, conditions, deep = false) => {
  if(!conditions) return ""
  const [ operator, ...args ] = conditions
  let whereClause
  if( ['and', 'or'].includes(operator) ) {
    const innerWhere = andOrOperator(f, operator, args)
    whereClause = deep ? '('+ innerWhere + ')' : innerWhere
  }
  if( ['=', '!='].includes(operator) ) {
      whereClause = equality(f, operator, args)
  }
  if (['<', '>'].includes(operator)) {
    whereClause = biggerOrSmaller(f, operator, args)
  }
  if(['is-empty', 'not-empty'].includes(operator)) {
    whereClause = emptyOrNotEmpty(f, operator, args)
  }
  return whereClause
}
//"SELECT TOP 20 * FROM data;"
// "SELECT * FROM data LIMIT 20;"

const applyF = (fields) => (arg) => {
  if(arg === null) return null
  if(Array.isArray(arg)) {
    return fields[arg[1]]
  }
  return typeof arg === 'number' ? arg : `'${arg}'`
}
export const generateSql = (dialect, fields, query) => {

  const whereStr = where(applyF(fields), query.where)

  return addLimit(dialect, whereStr ? ` WHERE ${whereStr}` : '', query.limit)

}
