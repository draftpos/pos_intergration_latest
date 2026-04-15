// Copyright (c) 2025, Alphazen Technologies and contributors
// For license information, please see license.txt

frappe.query_reports["ZIMDEF Report"] = {
	"filters": [
		{
			fieldname: "currency",
			label: __("Currency"),
			fieldtype: "Link",
			options: "Currency",
		},
		{
			fieldname: "payroll_frequency",
			fieldtype: "DateRange",
			label: __("Payroll Frequency"),
		},
		{
			fieldname: "employee",
			fieldtype: "Link",
			label: __("Employee"),
			options: "Employee",
		},
	],
	"onload": function(report) {
        // Add a custom button to render the report
        report.page.add_inner_button(__("Print Zimdef Form"), function() {
            // Get the latest data from the report
            const latestData = report.get_values();
            
            // Run the report again to get fresh data
            frappe.query_report.refresh()
                .then(() => {
                    // After refresh, render the report with the latest data
                    renderZimdefForm(report);
                });
        });
    }
};

function renderZimdefForm(report) {
    // Get the report data
    const filters = report.get_values();
    const data = frappe.query_report.data;
    
    if (!data || data.length === 0) {
        frappe.msgprint(__("No data found for the selected filters."));
        return;
    }
    
    // Use all data except the last row if it's a total row
    const reportData = data.length > 1 ? data.slice(0, -1) : data;
    
    // Calculate totals
    let totalGrossZWD = 0;
    let totalStandardLevyZWD = 0;
    let totalGrossUSD = 0;
    let totalStandardLevyUSD = 0;
    
    reportData.forEach(row => {
        totalGrossZWD += flt(row.gross_zwd || 0);
        totalStandardLevyZWD += flt(row.standard_levy_zwd || 0);
        totalGrossUSD += flt(row.gross_usd || 0);
        totalStandardLevyUSD += flt(row.standard_levy_usd || 0);
    });
    
    // Get date range for the report title
    let periodTitle = "";
    if (filters.payroll_frequency) {
        const startDate = frappe.datetime.str_to_user(filters.payroll_frequency[0]);
        const endDate = frappe.datetime.str_to_user(filters.payroll_frequency[1]);
        periodTitle = `${startDate} to ${endDate}`;
    }
    
    // Generate HTML rows for employees
    let employeeRows = "";
    reportData.forEach((row, index) => {
        employeeRows += `
            <tr>
                <td>${index + 1}.</td>
                <td class="text-primary">${row.first_name || ""}</td>
                <td class="text-primary">${row.surname || ""}</td>
                <td class="text-primary">${frappe.datetime.str_to_user(row.start_date) || ""}</td>
                <td class="text-primary">${frappe.datetime.str_to_user(row.end_date) || ""}</td>
                <td class="text-danger">${format_currency(row.gross_zwd || 0, "ZWL")}</td>
                <td class="text-danger">${format_currency(row.standard_levy_zwd || 0, "ZWL")}</td>
                <td class="text-danger">${format_currency(row.gross_usd || 0, "USD")}</td>
                <td class="text-danger">${format_currency(row.standard_levy_usd || 0, "USD")}</td>
            </tr>
        `;
    });
    
    // Get company information
    frappe.db.get_value("Company", frappe.defaults.get_default("company"), ["company_name"], (r) => {
        const companyName = r.company_name || "";
        // const companyAddress = r.address || "";
        
        // Create the HTML content
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FORM P4 - Monthly Payment Schedule</title>
            <style>
                /* General Styles */
                .page {
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 11px;
                    line-height: 1.2;
                    width: 95%;
                    margin: 0px auto;
                    padding: 20px 30px;
                }

                /* Header Section */
                .header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    margin-top: 10px;
                    width: 100%;
                }

                .logo {
                    display: flex;
                    text-align: right;
                    width: 80%;
                    justify-content: flex-start;
                }

                .logo img {
                    height: auto;
                    width: auto;
                    max-width: 200px;
                }

                .title {
                    flex: 0 0 auto;
                    text-align: left;
                }

                .title h3 {
                    font-size: 16px;
                    margin-bottom: 5px;
                    color: red !important;
                }

                .title h4 {
                    font-size: 12px;
                    margin-top: 0;
                }

                .contact-info {
                    width: 20%;
                    text-align: right;
                }

                .contact-info p {
                    margin: 2px 0;
                    font-size: 13px;
                    font-weight: bold;
                    padding: 1px 0px;
                }

                /* Employer Details Section */
                .employer-details {
                    width: 100%;
                    margin-bottom: 40px;
                    font-size: 13px;
                    font-weight: bold;
                }

                .employer-details table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .employer-details td {
                    padding: 0px 5px;
                    border: none;
                }

                /* Employee Table Section */
                .employee-table {
                    width: 100%;
                }

                .employee-table table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .employee-table th,
                .employee-table td {
                    padding: 5px;
                    text-align: left;
                    font-size: 14px;
                }

                .employee-table thead:nth-child(1) {
                    font-weight: normal;
                    height: 50px;
                    vertical-align: bottom;
                    border-bottom: 1px solid black;
                }
                th{
                    font-size: 16px;
                }

                .employee-table tbody td {
                    vertical-align: top;
                    height: 20px;
                }

                /* Representative, Notes, Stamp */
                .representative {
                    margin-top: 10px;
                }

                .notes {
                    margin-top: 10px;
                    font-size: 9px;
                }

                .stamp {
                    margin-top: 20px;
                    height: 50px;
                    border: 1px dashed #ccc;
                }

                /* Footer Section */
                .footer {
                    width: 100%;
                    text-align: left;
                    margin-top: 20px;
                    font-size: 10px;
                    border-top: 0.5px solid #ccc;
                }
                .text-primary{
                    color: blue !important;
                }
                .text-danger{
                    color: red !important
                }
            </style>
        </head>
        <body>

        <div class="page">
            
            <div class="header">
                
                <div class="logo">
                    <img src="/files/payview.png" alt="NSSA Logo">
                    <h3>PERIOD STANDARDS DEV. LEV RETURN DUAL - ${periodTitle}</h3>
                </div>
                <div class="contact-info">
                    <h3>${companyName}</h3>
                </div>
                
            </div>
            <div class="employee-table">
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>First Names</th>
                            <th>Surname</th>
                            <th class="text-primary">Start Date</th>
                            <th class="text-primary">End Date</th>
                            <th>Gross ZWD</th>
                            <th>Standard Levy ZWD</th>
                            <th>Gross USD</th>
                            <th>Standard Levy USD</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employeeRows}
                        
                        <tr style="border-top: 1px double; border-bottom: 1px double black; margin-bottom: 40px;">
                            <td></td>
                            <td colspan="4" style="text-align: left; font-weight: bold;">
                                PERIOD TOTALS
                            </td>
                            <td class="text-danger">${format_currency(totalGrossZWD, "ZWL")}</td>
                            <td class="text-danger">${format_currency(totalStandardLevyZWD, "ZWL")}</td>
                            <td class="text-danger">${format_currency(totalGrossUSD, "USD")}</td>
                            <td class="text-danger">${format_currency(totalStandardLevyUSD, "USD")}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>

        </body>
        </html>
        `;
        
        // Open the report in a new window
        const w = window.open();
        w.document.write(htmlContent);
        w.document.close();
        
        // Add print functionality
        setTimeout(() => {
            w.print();
        }, 1000);
    });
}

// Helper function to parse float values
function flt(value) {
    return parseFloat(value) || 0;
}

// Simple currency formatter to avoid recursion
function format_currency(value, currency) {
    // Convert to number and ensure it's a valid number
    const numValue = parseFloat(value) || 0;
    
    // Format to 2 decimal places with thousand separators
    const formattedValue = numValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Add currency symbol
    return currency + " " + formattedValue;
}
