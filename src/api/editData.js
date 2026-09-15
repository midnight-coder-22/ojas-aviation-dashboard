import apiClient from './client'


// GET /api/edit-data/sheet/{sheet key}
//
// Returns:
// {
//   sheet_name,
//   headers: string[],
//   rows: any[][],
//   total_rows
// }

export const fetchEditSheet = async (sheetKey) => {
  const res = await apiClient.get(
    `/api/edit-data/sheet/${sheetKey}`,
  )

  return res.data
}


// POST /api/edit-data/commit
//
// IMPORTANT:
// This endpoint updates ONLY the selected
// Google Sheet.
//
// It does NOT trigger Databricks.

export const commitChanges = async ({
  sheet_name,
  headers,
  rows,
}) => {
  const res = await apiClient.post(
    '/api/edit-data/commit',
    {
      sheet_name,
      headers,
      rows,
    },
  )

  return res.data
}


// POST /api/edit-data/post-data
//
// IMPORTANT:
// This is the ONLY frontend action
// that triggers the Databricks job.

export const postData = async () => {
  const res = await apiClient.post(
    '/api/edit-data/post-data',
  )

  return res.data
}
