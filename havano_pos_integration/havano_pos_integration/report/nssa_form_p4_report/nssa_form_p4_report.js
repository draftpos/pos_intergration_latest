// Copyright (c) 2025, Alphazen Technologies and contributors
// For license information, please see license.txt

frappe.query_reports["NSSA Form P4 Report"] = {
	"filters": [
		{
			fieldname: "currency",
			label: __("Currency"),
			fieldtype: "Link",
			options: "Currency",
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
        report.page.add_inner_button(__("Print Form P4"), function() {
            // Get the latest data from the report
            const latestData = report.get_values();
            
            // Run the report again to get fresh data
            frappe.query_report.refresh()
                .then(() => {
                    // After refresh, render the report with the latest data
                    renderNSSAP4Form(report);
                });
        });
    }
};

function renderNSSAP4Form(report) {
    // Get the report data
    const data = report.data || [];
    const filters = report.get_values();

	// Helper function to parse float values safely
    function flt(value) {
        return parseFloat(value) || 0;
    }
    const reportData = data.length > 1 ? data.slice(0, -1) : data;
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
    
    // Get company information
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Company",
            name: frappe.defaults.get_default("company")
        },
        callback: function(response) {
            const company = response.message || {};
            
            // Format the date for display
            let paymentMonth = "";
            if (filters.payroll_period && filters.payroll_period.length === 2) {
                const endDate = frappe.datetime.str_to_obj(filters.payroll_period[1]);
                paymentMonth = frappe.datetime.str_to_user(endDate);
            } else {
                paymentMonth = frappe.datetime.str_to_user(frappe.datetime.get_today());
            }
            
            // Calculate totals
            let totalNpsEarnings = 0;
            let totalNpsContribution = 0;
            let totalBasicSalary = 0;
            let totalInsurableEarnings = 0;
            
            // Process employee data
            const employeeRows = reportData.map((row, index) => {
                // Update totals
                totalNpsEarnings += flt(row.nps_insurable_earnings_zig);
                totalNpsContribution += flt(row.total_nps_contribution);
                totalBasicSalary += flt(row.basic_salary_wcif);
                totalInsurableEarnings += flt(row.actual_insurable_earnings); // Same as NPS earnings
                
                // Format dates
                const commencementDate = row.commencement_date ? 
                    frappe.datetime.str_to_user(row.commencement_date) : "";
                const cessationDate = row.cessation_date ? 
                    frappe.datetime.str_to_user(row.cessation_date) : "";
                const dob = ""; // Date of birth not in the data, would need to fetch from employee
                const period = row.period ? 
                    frappe.datetime.str_to_user(row.period).substring(3) : ""; // Get month and year only
                
                return `
                <tr>
                    <th>${index + 1}.</th>
                    <td class="text-primary">${row.ssn || "N/A"}</td>
                    <td>${row.staff_no || ""}</td>
                    <td class="text-danger">${row.national_id || ""}</td>
                    <td class="text-primary" colspan="2">${period || ""}</td>
                    <td class="text-primary">${dob || ""}</td>
                    <td class="text-primary">${row.surname || ""}</td>
                    <td class="text-primary">${row.first_names || ""}</td>
                    <td class="text-primary">${commencementDate}</td>
                    <td>${cessationDate}</td>
                    <td>${row.reason_for_cessation || ""}</td>
                    <td>${row.nature_of_employment || ""}</td>
                    <td class="text-danger">${format_currency(row.nps_insurable_earnings_zig, "ZWL")}</td>
                    <td class="text-danger">${format_currency(row.total_nps_contribution, row.currency)}</td>
                    <td class="text-danger">${format_currency(row.basic_salary_wcif, row.currency)}</td>
                    <td class="text-danger">${format_currency(row.actual_insurable_earnings, row.currency)}</td>
                </tr>
                `;
            }).join("");
            
            // Get current user info for representative
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "User",
                    name: frappe.session.user
                },
                callback: function(user_response) {
                    const user = user_response.message || {};
                    const currentDate = frappe.datetime.str_to_user(frappe.datetime.get_today());
                    
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
                                padding: 20px 0px;
                            }

                            /* Header Section */
                            .header {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 20px;
                                margin-top: 10px;
                            }

                            .logo {
                                flex: 1;
                                text-align: center; 
                            }

                            .logo img {
                                height: 150px;
                                width: auto;
                                max-width: 200px;
                                display: inline-block; 
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
                                flex: 0 0 30%;
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
                            }

                            .employee-table thead th {
                                font-weight: normal;
                                height: 50px;
                                vertical-align: bottom;
                                border-bottom: 1px solid black;
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
                            <div class="title">
                                <h3>FORM P4</h3>
                                <h4>Monthly Payment Schedule of Employees</h4>
                            </div>
                            <div class="logo">
                                <img src="/files/nsaa-logo.jpeg" alt="NSSA Logo">
                            </div>
                            <div class="contact-info">
                                <p>National Social Security Authority</p>
                                <p>Selous Avenue/Sam Nujoma</p>
                                <p>P.O. Box CY1387</p>
                                <p>Causeway, Harare</p>
                                <p>Telephone (04) 706523-5</p>
                                <p>Fax (04) 796320</p>
                                <p>Payment Month and Year: <b class="text-primary">${paymentMonth}</b></p>
                                <p>Sector: </p>
                                <p>Email Address: <b class="text-primary">${company.email || ""}</b></p>
                                <p>Contact Telephone Number: <b class="text-primary">${company.phone_no || ""}</b></p>
                            </div>
                        </div>

                        <div class="employer-details">
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Employer SSR No:</td>
                                    </tr>
                                    <tr>
                                        <td>Employer EC:</td>
                                    </tr>
                                    <tr>
                                        <td>Employers Name: <b class="text-primary">${company.name || ""}</b></td>
                                    </tr>
                                    <tr>
                                        <td>Employers Physical Address: <b class="text-primary">${company.address || ""}</b></td>
                                    </tr>
                                    <tr>
                                        <td>Reason for Cessation: - Insert C for Casual Employee, R for Retirement, D for Death, O for any other reason for cessation</td>
                                    </tr>
                                    <tr>
                                        <td>Nature of Employment: - Insert A if Arduous employment, and N for Normal Employment</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="employee-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>SSN</th>
                                        <th>Employee
                                            Staff No</th>
                                        <th>
                                            National ID No
                                        </th>
                                        <th colspan="2">
                                            Period
                                        </th>
                                        <th>Date of</th>
                                        <th>Surname</th>
                                        <th>First Names</th>
                                         
                                        <th>Commencement Date</th>
                                        <th>Cessation Date</th>
                                        <th>
                                            Reason for
                                            Cessa
                                        </th>
                                        <th>
                                            Nature of
                                            Employment
                                        </th>
                                        <th>NPS Insurable Earnings (ZIG)</th>
                                        <th>Total NPS (9%) Contribution</th>
                                        <th>Basic Salary (WCIF) excluding</th>
                                        <th>Actual Insurable Earnings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${employeeRows}
                                    <tr style="border-top: 1px double; border-bottom: 1px double black; margin-bottom: 40px;">
                                        <td colspan="6" style="text-align: right; font-weight: bold;">
                                            PERIOD TOTALS (${filters.currency || "USD"} COMPONENT)
                                        </td>
                                        <td colspan="7"></td>
                                        <td class="text-danger">${format_currency(totalNpsEarnings, "ZWL")}</td>
                                        <td class="text-danger">${format_currency(totalNpsContribution, filters.currency || "USD")}</td>
                                        <td class="text-danger">${format_currency(totalBasicSalary, filters.currency || "USD")}</td>
                                        <td class="text-danger">${format_currency(totalInsurableEarnings, filters.currency || "USD")}</td>
                                    </tr>
                                    <tr style="font-size: 13px; margin-bottom: 20px;">
                                        <td></td>
                                        <td colspan="4">
                                            Employers Representative: 
                                        </td>
                                        <td class="text-primary">${user.full_name || frappe.session.user}</td>
                                        <td colspan="3">
                                            Designation: : 
                                        </td>
                                        <td colspan="2" class="text-primary">${user.role_profile_name || "ADMINISTRATOR"}</td>
                                    </tr>
                                    <tr style="font-size: 12px; margin-bottom: 20px;">
                                        <td></td>
                                        <td><b>Note: </b></td>
                                        <td colspan="10">Use the National I.D. to identify employees pending the issue of
                                            Social Security Numbers.<br> The information given in this form may be used for the purposes of other
                                            Schemes administered by NSSA.</td>
                                        <td colspan="4" rowspan="2" style="border: 1px dotted; text-align: center; padding-top: 50px; padding-bottom: 50px;"> Official Stamp</td>
                                    </tr>
                                    
                                </tbody>
                            </table>
                        </div>

                       
                        <div class="footer">
                            <p>Page: 1 of 1</p>
                            <p>Date: ${currentDate}</p>
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
                }
            });
        }
    });
}

// // Helper function to format currency values
// function format_currency(value, currency) {
//     if (!value) return "0.00";
//     return frappe.format(value, {
//         fieldtype: 'Currency',
//         currency: currency || frappe.defaults.get_default("currency")
//     });
// }

// // Helper function for float operations
// function flt(value) {
//     if (!value) return 0;
//     return parseFloat(value);
// }
