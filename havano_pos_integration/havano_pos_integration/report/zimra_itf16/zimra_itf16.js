// Copyright (c) 2025, Alphazen Technologies and contributors
// For license information, please see license.txt

frappe.query_reports["ZIMRA ITF16"] = {
	"filters": [
		{
			fieldname: "currency",
			label: __("Currency"),
			fieldtype: "Link",
			options: "Currency",
		},
		{
			fieldname: "payroll_period",
			fieldtype: "DateRange",
			label: __("Payroll Period"),
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
        report.page.add_inner_button(__("Print Zimra ITF16"), function() {
            // Get the latest data from the report
            const latestData = report.get_values();
            
            // Run the report again to get fresh data
            frappe.query_report.refresh()
                .then(() => {
                    // After refresh, render the report with the latest data
                    renderZimraForm(report);
                });
        });
    }
};

function renderZimraForm(report) {
    // Get the report data and filters
    const filters = report.get_values();
    const data = frappe.query_report.data;
    
    if (!data || data.length === 0) {
        frappe.msgprint(__("No data available for the selected filters."));
        return;
    }
	const reportData = data.length > 1 ? data.slice(0, -1) : data;
    
    // Get company information
    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Company",
            filters: { is_group: 0, name: frappe.defaults.get_user_default("Company") },
            fieldname: [
                "company_name",
            ]
        },
        callback: function(company_data) {
            if (!company_data.message) {
                frappe.msgprint(__("Company information not found."));
                return;
            }
            
            const company = company_data.message;
            
            // Calculate totals
            let totals = {
                gross_pay: 0,
                basic_pension: 0,
                paye: 0,
                aids_levy: 0
            };
            
            // Process employee data and calculate totals
            const employeeRows = reportData.map(emp => {
                // Update totals
                totals.gross_pay += flt(emp.gross_pay);
                totals.basic_pension += flt(emp.basic_pension);
                totals.paye += flt(emp.paye);
                totals.aids_levy += flt(emp.aids_levy);
                
                // Format dates
                const dob = emp.dob ? frappe.datetime.str_to_user(emp.dob) : '';
                const startDate = emp.start_date ? frappe.datetime.str_to_user(emp.start_date) : '';
                const endDate = emp.end_date ? frappe.datetime.str_to_user(emp.end_date) : '';
                
                return `
                    <tr>
                        <td></td>
                        <td>${emp.surname || ''}</td>
                        <td>${emp.first_names || ''}</td>
                        <td>${emp.employee_id || ''}</td>
                        <td>${dob}</td>
                        <td>${startDate}</td>
                        <td>${endDate}</td>
                        <td>${format_currency(emp.gross_pay || 0, emp.currency)}</td>
                        <td>${format_currency(emp.gross_pay || 0, emp.currency)}</td>
                        <td>${format_currency(0, emp.currency)}</td>
                        <td>${format_currency(0, emp.currency)}</td>
                        <td>${format_currency(emp.basic_pension || 0, emp.currency)}</td>
                        <td>${format_currency(0, emp.currency)}</td>
                        <td>${format_currency(0, emp.currency)}</td>
                        <td>${format_currency(0, emp.currency)}</td>
                        <td>${format_currency(0, emp.currency)}</td>
                        <td>${format_currency(emp.paye || 0, emp.currency)}</td>
                        <td>${format_currency(emp.aids_levy || 0, emp.currency)}</td>
                    </tr>
                `;
            }).join('');
            
            // Get the date range for the report title
            const fromDate = filters.payroll_period && filters.payroll_period[0] 
                ? frappe.datetime.str_to_user(filters.payroll_period[0]) 
                : '';
            const toDate = filters.payroll_period && filters.payroll_period[1] 
                ? frappe.datetime.str_to_user(filters.payroll_period[1]) 
                : '';
            
            // Get the year from the end date for ITF16 year
            const itf16Year = toDate ? new Date(filters.payroll_period[1]).getFullYear() : new Date().getFullYear();
            
            // Currency
            const currency = reportData[0].currency || 'USD';
            
            // Create the HTML content with modern CSS
            let html = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ITF16 Form - ZIMRA</title>
    <style>
        /* Modern CSS Reset */
        *, *::before, *::after {
            box-sizing: border-box;
        }
        
        /* General Styles */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            color: #333;
            background-color: #fff;
        }

        .page {
            width: 95%;
            min-height: 29.7cm;
            margin: 0 auto;
            padding: 0.5cm 1cm;
            position: relative;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background-color: white;
        }

        /* Header Section */
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        
        .zimra-logo {
            max-height: 60px;
            width: auto;
        }
        
        .itf16-badge {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            position: absolute;
            right: 35px;
            top: 90px;
        }
        
        .itf16-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .itf16-logo-container {
            border: 1px solid #333;
            padding: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 120px;
            height: 60px;
        }
        
        .itf16-logo {
            max-width: 100%;
            max-height: 100%;
        }

        /* Company Info Section */
        .company-info-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            width: 80%;
        }
        
        .company-info-table {
            width: 48%;
        }
        
        .company-info-table table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .company-info-table td {
            padding: 4px 8px;
        }
        
        .company-info-table td:first-child {
            font-weight: bold;
            width: 40%;
        }

        /* Form Details */
        .form-details-table {
            margin-bottom: 15px;
            width: 100%;
        }
        
        .form-details-table table {
            width: 70%;
            border-collapse: collapse;
            background-color: #f9f9f9;
        }
        
        .form-details-table th {
            padding: 6px 0px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
        }

        /* Employee Table */
        .employee-table {
            width: 100%;
            overflow-x: auto;
            margin-bottom: 20px;
        }
        
        .employee-table table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        
        .employee-table th {
            background-color: #f2f2f2;
            padding: 8px 5px;
            text-align: left;
            font-weight: 600;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            position: sticky;
            top: 0;
        }
        
        .employee-table td {
            padding: 6px 5px;
            text-align: right;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .employee-table th:nth-child(1),
        .employee-table th:nth-child(2),
        .employee-table th:nth-child(3),
        .employee-table th:nth-child(4),
        .employee-table th:nth-child(5),
        .employee-table th:nth-child(6),
        .employee-table th:nth-child(7),
        .employee-table td:nth-child(1),
        .employee-table td:nth-child(2),
        .employee-table td:nth-child(3),
        .employee-table td:nth-child(4),
        .employee-table td:nth-child(5),
        .employee-table td:nth-child(6),
        .employee-table td:nth-child(7) {
            text-align: left;
        }
        
        .totals-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        
        .totals-row td {
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            padding: 8px 5px;
        }

        /* Page Number */
        .page-number {
            position: absolute;
            bottom: 1cm;
            right: 1cm;
            font-size: 10px;
            color: #666;
        }
        
        /* Responsive adjustments */
        @media print {
            body {
                background: none;
            }
            
            .page {
                width: 100%;
                box-shadow: none;
                margin: 0;
                padding: 0.5cm;
            }
            
            .employee-table th {
                background-color: #f2f2f2 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .totals-row {
                background-color: #f9f9f9 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>

<body>
    <div class="page">
        <!-- Header with logo and ITF16 badge -->
        <div class="header-section">
            <img src="/files/payview.png" alt="ZIMRA Logo" class="zimra-logo">
            
            <div class="itf16-badge">
                <div class="itf16-title">ITF16 FORM</div>
                <div class="itf16-logo-container">
                    <img src="/files/zimra.png" alt="ITF16" class="itf16-logo">
                </div>
            </div>
        </div>

        <!-- Company Information -->
        <div class="company-info-container">
            <div class="company-info-table">
                <table>
                    <tr>
                        <td>COMPANY NAME:</td>
                        <td>${company.company_name || 'APOINT'}</td>
                    </tr>
                    <tr>
                        <td>ITF16 YEAR:</td>
                        <td>${itf16Year}</td>
                    </tr>
                    <tr>
                        <td>CONTACT ADDRESS:</td>
                        <td>${'ZIMBABWE'}</td>
                    </tr>
                </table>
            </div>
            <div class="company-info-table">
                <table>
                    <tr>
                        <td>BP NUMBER:</td>
                        <td>${'1234000'}</td>
                    </tr>
                    <tr>
                        <td>FDS METHOD:</td>
                        <td>None</td>
                    </tr>
                    <tr>
                        <td>CONTACT PHONE:</td>
                        <td>${'0773 100 715'}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Form Details -->
        <div class="form-details-table">
            <table>
                <tr>
                    <th></th>
                    <th>NO OF PAY PERIODS: ${reportData.length}</th>
                    <th>CURRENT PERIOD:</th>
                    <th>${toDate}</th>
                    <th>PAYROLL CODE: 01</th>
                    <th>CURRENCY:</th>
                    <th>${currency}</th>
                </tr>
            </table>
        </div>

        <!-- Employee Table -->
        <div class="employee-table">
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>SURNAME</th>
                        <th>FIRST NAMES</th>
                        <th>ID NUMBER</th>
                        <th>DOB</th>
                        <th>EMP/FROM</th>
                        <th>EMPL/TO</th>
                        <th>GROSS PAY</th>
                        <th>BASIC</th>
                        <th>BONUS</th>
                        <th>BENEFITS</th>
                        <th>PENSION</th>
                        <th>NSSA</th>
                        <th>NEC</th>
                        <th>T/UNION</th>
                        <th>TAX CREDITS</th>
                        <th>P.A.Y.E.</th>
                        <th>AIDS Levy</th>
                    </tr>
                </thead>
                <tbody>
                    ${employeeRows}
                                        <tr class="totals-row">
                        <td colspan="6" style="text-align: right;">PERIOD TOTALS ARE IN ${currency}</td>
                        <td></td>
                        <td>${format_currency(totals.gross_pay, currency)}</td>
                        <td>${format_currency(totals.gross_pay, currency)}</td>
                        <td>${format_currency(0, currency)}</td>
                        <td>${format_currency(0, currency)}</td>
                        <td>${format_currency(totals.basic_pension, currency)}</td>
                        <td>${format_currency(0, currency)}</td>
                        <td>${format_currency(0, currency)}</td>
                        <td>${format_currency(0, currency)}</td>
                        <td>${format_currency(0, currency)}</td>
                        <td>${format_currency(totals.paye, currency)}</td>
                        <td>${format_currency(totals.aids_levy, currency)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="page-number">
            <p>Page: 1 of 1</p>
        </div>
    </div>
</body>
</html>`;
            
            // Open the HTML in a new window for printing
            const w = window.open();
            w.document.write(html);
            w.document.close();
            
            // Add print functionality
            setTimeout(() => {
                w.print();
                // Close the window after printing (optional)
                // w.close();
            }, 1000);
        }
    });
}

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
