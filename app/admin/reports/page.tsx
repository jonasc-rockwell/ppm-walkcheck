// Converts stored JSON responses into flattened CSV columns
const exportDynamicCSV = (responses: any[]) => {
  if (responses.length === 0) return;

  // Gather all unique question labels across records
  const allQuestionKeys = Array.from(
    new Set(responses.flatMap((r) => Object.keys(r.responses || {})))
  );

  const headers = ['Inspection ID', 'Equipment ID', 'Inspector', 'Status', ...allQuestionKeys, 'Date'];

  const rows = responses.map((r) => {
    const questionValues = allQuestionKeys.map(
      (key) => `"${(r.responses?.[key] ?? 'N/A').toString().replace(/"/g, '""')}"`
    );

    return [
      r.id,
      r.equipment_id,
      `"${r.inspector_name || 'Inspector'}"`,
      r.status,
      ...questionValues,
      new Date(r.created_at).toLocaleString(),
    ];
  });

  const csvContent =
    'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `Facility_Inspection_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};