export const addLimit = (dialect, where, limit) => {
  if (!limit) {
    return `SELECT * FROM data${where};`
  }
  switch (dialect) {
    case 'sqlserver':
      return `SELECT TOP ${limit} * FROM data${where};`
    case 'postgres':
    case 'mysql':
      return `SELECT * FROM data${where} LIMIT ${limit};`
      defaul: throw new Error(`Unsupported dialect: ${dialect}`)
  }
}
