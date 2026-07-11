import apiClient from './client'

// GET /api/edit-data/wos
// Returns { sheet_name, headers: string[], rows: any[][], total_rows }
export const fetchWosSheet = async () => {
  const res = await apiClient.get('/api/edit-data/wos')
  return res.data
}

// GET /api/edit-data/ows
export const fetchOwsSheet = async () => {
  const res = await apiClient.get('/api/edit-data/ows')
  return res.data
}

// POST /api/edit-data/commit
// body: { sheet_name: 'wos'|'ows', headers: string[], rows: any[][] }
export const commitChanges = async ({ sheet_name, headers, rows }) => {
  const res = await apiClient.post('/api/edit-data/commit', {
    sheet_name, headers, rows,
  })
  return res.data
}