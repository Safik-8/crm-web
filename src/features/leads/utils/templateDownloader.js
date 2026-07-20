import * as XLSX from 'xlsx';
import { toast } from '../../../shared/utils/toast';

export const downloadLeadsTemplate = (role) => {
  try {
    const headers = [
      "Lead Name",
      "Mobile Number",
      "Lead Source",
      "Interested Course/Product",
      "Email",
      "Alternate Contact",
      "Budget",
      "City",
      "State",
      "Country",
      "Notes"
    ];

    const sampleRow = {
      "Lead Name": "John Doe",
      "Mobile Number": "9876543210",
      "Lead Source": "Google",
      "Interested Course/Product": "Full Stack Development",
      "Email": "john.doe@example.com",
      "Alternate Contact": "9123456789",
      "Budget": 5000,
      "City": "Mumbai",
      "State": "Maharashtra",
      "Country": "India",
      "Notes": "Interested in weekend batches."
    };



    // Append optional Assigned To column:
    headers.push("Assigned To");
    sampleRow["Assigned To"] = "agent@company.com";

    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "leads_import_template.xlsx");
    toast.success("Import template downloaded.");
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate template.");
  }
};
