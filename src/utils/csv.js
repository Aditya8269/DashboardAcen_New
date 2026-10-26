// Downloads rows as a CSV file. `columns` = [[title, row => value], ...]
export function downloadCsv(fileName, columns, rows) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [columns.map(([title]) => title), ...rows.map((row) => columns.map(([, get]) => get(row)))]
    .map((line) => line.map(escape).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  Object.assign(document.createElement('a'), { href: url, download: fileName }).click()
  URL.revokeObjectURL(url)
}
