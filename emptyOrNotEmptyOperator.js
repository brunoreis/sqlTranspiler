import { equalityOperator } from './equalityOperator'

export const emptyOrNotEmptyOperator = (f, operator, args) => {
  if (args.length > 1) {
    throw new Error('is-empty and not-empty need only one arg')
  }
  return equalityOperator(f, operator === 'is-empty' ? '=' : '!=', [
    ...args,
    null,
  ])
}
