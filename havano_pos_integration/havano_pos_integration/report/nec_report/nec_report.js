// Copyright (c) 2025, Alphazen Technologies and contributors
// For license information, please see license.txt

frappe.query_reports["NEC Report"] = {
	"filters": [
		{
			fieldname: "currency",
			label: __("Currency"),
			options: "Currency",
			fieldtype: "Link",
			default: "USD",
		},
		{
            "fieldname": "payroll_period",
            "label": __("Payroll Period"),
            "fieldtype": "DateRange",
            "reqd": 0
        },
	],
	"onload": function(report) {
        // Add a custom button to render the report
        report.page.add_inner_button(__("Print Nec Form"), function() {
            // Get the latest data from the report
            const latestData = report.get_values();
            
            // Run the report again to get fresh data
            frappe.query_report.refresh()
                .then(() => {
                    // After refresh, render the report with the latest data
                    renderNecForm(report);
                });
        });
    }
};

function renderNecForm(report) {
    // Get the report data
    const reportData = report.data || [];
    const filters = report.get_values();
    const currency = filters.currency || 'USD';
    
    if (!reportData.length) {
        frappe.msgprint(__("No data to display"));
        return;
    }
    
    // Calculate totals (excluding the last row which is already a total)
    const dataWithoutTotals = reportData.length > 1 ? reportData.slice(0, -1) : reportData;
    
    let totalNecEarnings = 0;
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;
    let totalNec = 0;
    
    dataWithoutTotals.forEach(row => {
        totalNecEarnings += flt(row.nec_earnings || 0);
        totalEmployeeContribution += flt(row.employee_contribution || 0);
        totalEmployerContribution += flt(row.employer_contribution || 0);
        totalNec += flt(row.total_nec || 0);
    });
    
    // Format currency function
    const formatCurrency = (value) => {
        return format_currency(flt(value || 0), currency);
    };
    
    // Format the HTML content
    let htmlContent = `
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
                padding: 20px 0px;
            }

            /* Header Section */
            .header {
                display: flex;
                justify-content: space-between;
                /* align-items: center; */
                margin-bottom: 20px;
                margin-top: 10px;
                width: 100%;
                /* border: 1px solid; */
            }

            .logo {
                /* flex: 1; */
                /* height: 80px; */
                text-align: right;
                /* border: 1px solid; */
                width: 20%;
            }

            .logo img {
                height: auto;
                width: auto;
                max-width: 200px;
                /* display: inline-block;  */
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
                /* flex: 0 30%; */
                width: 70%;
                text-align: left;
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
            <div class="contact-info">
                <h3>APOINT</h3>
                <h3>NEC SUMMARY BY GRADE - ${currency} COMPONENT</h3>
            </div>
            <div class="logo">
                <img src="/files/payview.png" alt="NSSA Logo">
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
                        <th>Grade</th>
                        <th>NEC Earnings</th>
                        <th>Employee</th>
                        <th>Employer</th>
                        <th>Total NEC</th>
                    </tr>
                </thead>
                <thead>
                    <tr>
                        <th></th>
                        <th class="text-primary" style="border-bottom: 1px solid blue;" colspan="2">NEC Commercial</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add employee rows
    dataWithoutTotals.forEach((row, index) => {
        htmlContent += `
            <tr>
                <td>${index + 1}.</td>
                <td>${frappe.utils.escape_html(row.first_names || '')}</td>
                <td>${frappe.utils.escape_html(row.surname || '')}</td>
                <td class="text-primary">${frappe.format(row.start_date, {fieldtype: 'Date'})}</td>
                <td class="text-primary">${frappe.format(row.end_date, {fieldtype: 'Date'})}</td>
                <td>${frappe.utils.escape_html(row.grade || 'N/A')}</td>
                <td>${formatCurrency(row.nec_earnings)}</td>
                <td>${formatCurrency(row.employee_contribution)}</td>
                <td>${formatCurrency(row.employer_contribution)}</td>
                <td>${formatCurrency(row.total_nec)}</td>
            </tr>
        `;
    });
    
    // Add industry total row
    htmlContent += `
        <tr style="border-top: 1px double blue; border-bottom: 1px double blue; margin-bottom: 40px;">
            <td colspan="6" style="text-align: left; font-weight: bold;">
                INDUSTRY TOTAL
            </td>
            <td class="text-primary">${formatCurrency(totalNecEarnings)}</td>
            <td class="text-primary">${formatCurrency(totalEmployeeContribution)}</td>
            <td class="text-primary">${formatCurrency(totalEmployerContribution)}</td>
            <td class="text-primary">${formatCurrency(totalNec)}</td>
        </tr>
        <tr style="border-top: 1px double; border-bottom: 1px double black; margin-bottom: 40px;">
            <td colspan="6" style="text-align: left; font-weight: bold;">
                PERIOD TOTALS IN ${currency}
            </td>
            <td class="text-primary">${formatCurrency(totalNecEarnings)}</td>
            <td class="text-primary">${formatCurrency(totalEmployeeContribution)}</td>
            <td class="text-primary">${formatCurrency(totalEmployerContribution)}</td>
            <td class="text-primary">${formatCurrency(totalNec)}</td>
        </tr>
    `;
    
    // Close the HTML
    htmlContent += `
                </tbody>
            </table>
        </div>
    </div>
    </body>
    </html>
    `;
    
    // Open the report in a new window
    const w = window.open();
    if (!w) {
        frappe.msgprint(__("Please allow pop-ups to view the NEC Report"));
        return;
    }
    
    w.document.write(htmlContent);
    w.document.close();
    
    // Add print functionality
    setTimeout(() => {
        w.print();
    }, 1000);
}

// Helper function to safely handle floating point numbers
function flt(value, precision) {
    precision = precision || frappe.defaults.get_default("float_precision") || 2;
    return parseFloat((value || 0).toFixed(precision));
}
