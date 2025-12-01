// Copyright (c) 2025, Alphazen Technologies and contributors
// For license information, please see license.txt

frappe.query_reports["NSSA Report"] = {
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
			label: __("Payroll Period"),
			default: [frappe.datetime.month_start(), frappe.datetime.month_end()]
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
        report.page.add_inner_button(__("Print NSSA Report"), function() {
            // Get the latest data from the report
            const filters = report.get_values();
            
            // Run the report again to get fresh data
            frappe.query_report.refresh()
                .then(() => {
                    // After refresh, render the report with the latest data
                    renderNSSAForm(report);
                });
        });
    }
};

function renderNSSAForm(report) {
    // Get the report data
    const data = report.data || [];
    const filters = report.get_values();
    
    if (!data.length) {
        frappe.msgprint(__("No data found for the selected filters."));
        return;
    }
    
    // Calculate totals for the report
    const totals = {
        nssa_zig_employee: 0,
        nssa_zig_employer: 0,
        nssa_usd_employee: 0,
        nssa_usd_employer: 0
    };
	const reportData = data.length > 1 ? data.slice(0, -1) : data;

    // Process data and calculate totals
    reportData.forEach(row => {
        // Convert null values to 0 for calculations
        Object.keys(totals).forEach(key => {
            row[key] = row[key] || 0;
            totals[key] += flt(row[key]);
        });
    });
    
    // Get company information
    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Company",
            filters: { name: frappe.defaults.get_user_default("Company") },
            fieldname: ["company_name"]
        },
        callback: function(r) {
            const company = r.message || {};
            
            // Create HTML content for the report
            let html = `<!DOCTYPE html>
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
            text-align: center;
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
            width: 80%;
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
        }

        .employee-table thead:nth-child(2) {
            font-weight: normal;
            height: 50px;
            vertical-align: bottom;
            border-bottom: 1px solid black;
        }
        .employee-table thead:nth-child(1)>th{
            font-size: 18px;
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
        </div>
        <div class="contact-info">
            <h3>${company.company_name || 'COMPANY NAME'}</h3>
        </div>
    </div>

    <div class="employee-table">
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th colspan="2">Earnings (ZIG)</th>
                    <th colspan="2">NPS (ZIG)</th>
                    <th>Emp+Co</th>
                    <th></th>
                    <th></th>
                    <th class="text-primary" colspan="2">Earnings USD</th>
                    <th class="text-primary" colspan="2">NPS USD</th>
                </tr>
            </thead>
            <thead>
                <tr>
                    <th></th>
                    <th>First Names</th>
                    <th>Surname</th>
                    <th>Period</th>
                    <th>NPS</th>
                    <th>WCIF</th>
                    <th>Employee</th>
                    <th>Employer</th>
                    <th>Arrears</th>
                    <th>WCIF (ZIG)</th>
                    <th>Total NSSA (ZIG)</th>
                    <th>NPS</th>
                    <th>WCIF</th>
                    <th>Employee</th>
                    <th>Employer</th>
                    <th>WCIF USD</th>
                    <th>Total NSSA USD</th>
                </tr>
            </thead>
            <tbody>`;

            // Add rows for each employee
            reportData.forEach((row, index) => {
                const zigTotal = flt(row.nssa_zig_employee || 0) + flt(row.nssa_zig_employer || 0);
                const usdTotal = flt(row.nssa_usd_employee || 0) + flt(row.nssa_usd_employer || 0);
                
                html += `
                <tr>
                    <td>${index + 1}.</td>
                    <td class="text-primary">${row.first_name || ''}</td>
                    <td class="text-primary">${row.surname || ''}</td>
                    <td class="text-primary">${row.payroll_period || ''}</td>
                    <td class="text-danger"></td>
                    <td class="text-danger"></td>
                    <td class="text-danger">${format_currency(row.nssa_zig_employee || 0, 'ZWL')}</td>
                    <td class="text-danger">${format_currency(row.nssa_zig_employer || 0, 'ZWL')}</td>
                    <td class="text-danger"></td>
                    <td class="text-danger"></td>
                    <td class="text-danger">${format_currency(zigTotal, 'ZWL')}</td>
                    <td class="text-primary"></td>
                    <td class="text-primary"></td>
                    <td class="text-primary">${format_currency(row.nssa_usd_employee || 0, 'USD')}</td>
                    <td class="text-primary">${format_currency(row.nssa_usd_employer || 0, 'USD')}</td>
                    <td class="text-primary"></td>
                    <td class="text-primary">${format_currency(usdTotal, 'USD')}</td>
                </tr>`;
            });

            // Add totals row
            const zigGrandTotal = totals.nssa_zig_employee + totals.nssa_zig_employer;
            const usdGrandTotal = totals.nssa_usd_employee + totals.nssa_usd_employer;
            
            html += `
                <tr style="border-top: 1px double; border-bottom: 1px double black; margin-bottom: 40px;">
                    <td colspan="4" style="text-align: right; font-weight: bold;">
                        PERIOD TOTALS
                    </td>
                    <td class="text-danger"></td>
                    <td class="text-danger"></td>
                    <td class="text-danger">${format_currency(totals.nssa_zig_employee, 'ZWL')}</td>
                    <td class="text-danger">${format_currency(totals.nssa_zig_employer, 'ZWL')}</td>
                    <td class="text-danger"></td>
                    <td class="text-danger"></td>
                    <td class="text-danger">${format_currency(zigGrandTotal, 'ZWL')}</td>
                    <td class="text-danger"></td>
                    <td class="text-primary"></td>
                    <td class="text-primary">${format_currency(totals.nssa_usd_employee, 'USD')}</td>
                    <td class="text-primary">${format_currency(totals.nssa_usd_employer, 'USD')}</td>
                    <td class="text-primary"></td>
                    <td class="text-primary">${format_currency(usdGrandTotal, 'USD')}</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

</body>
</html>`;

            // Open the report in a new window
            const w = window.open();
            w.document.write(html);
            w.document.close();
            
            // Print after images are loaded
            setTimeout(() => {
                w.print();
            }, 1000);
        }
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