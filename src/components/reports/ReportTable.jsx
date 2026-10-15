export default function ReportTable({ data }) {
  return (
    <table className="report-table">
      <tbody>
        {data?.map((row, index) => (
          <tr key={index}>
            <td>{row.label}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
