import { nestedMacroErrors } from './nestedMacroErrors'
import { equalityOperator } from './equalityOperator'
import { biggerOrSmallerOperator } from './biggerOrSmallerOperator'
import { emptyOrNotEmptyOperator } from './emptyOrNotEmptyOperator'
import { addLimit } from './addLimit'
// there is a helper spread across the code with the name 'f'. I chose that small name to make the code more readable because it's repeatedly used all around the operators.
// not sure I would keep it like that, though.

const andOrOrOperator = (f, macros, operator, args) => {
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
  switch (operator) {
    case 'and':
    case 'or':
      const innerWhere = andOrOrOperator(f, macros, operator, args)
      return deep ? '('+ innerWhere + ')' : innerWhere
    case '=':
    case '!=':
      return equalityOperator(f, operator, args)
    case '<':
    case '>':
      return biggerOrSmallerOperator(f, operator, args)
    case 'is-empty':
    case 'not-empty':
      return emptyOrNotEmptyOperator(f, operator, args)
    case 'macro':
      const [ macroName ] = args
      if(macros[macroName]) {
        return where(f, macros, macros[macroName])
      } else {
        throw new Error(`Macro ${macroName} does not exist`)
      }
    default:
      throw new Error(`Unsuported operator: ${operator}`)
  }
}

const applyFormatArg = (fields) => (arg) => {
  if(arg === null) return null
  if(Array.isArray(arg)) {
    return fields[arg[1]]
  }
  return typeof arg === 'number' ? arg : `'${arg}'`
}

export const generateSql = (dialect, fields, macros, query) => {
  const errors = nestedMacroErrors(macros)
  if(errors.length) {
    return `Circular Macros Detected: ${JSON.stringify(errors)}`
  }
  const whereStr = where(applyFormatArg(fields), macros,  query.where)
  return addLimit(dialect, whereStr ? ` WHERE ${whereStr}` : '', query.limit)
}
