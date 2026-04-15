frappe.query_reports["NSSA P4 Report"] = {
    "filters": [
        {
            "fieldname": "currency",
            "label": __("Currency"),
            "fieldtype": "Select",
            "options": ["USD", "ZWL"],
            "default": "USD",
            "reqd": 1
        },
        {
            "fieldname": "payroll_period",
            "label": __("Payroll Period"),
            "fieldtype": "DateRange",
            "reqd": 0
        }
    ],
    "onload": function(report) {
        // Add a custom button to render the report
        report.page.add_inner_button(__("Print P4 Form"), function() {
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
    const data = report.data;
    const filters = report.get_values();
    
    // Helper function to parse float values safely
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
    
    // Get the currency from filters
    const currency = filters.currency || "USD";
    
    // Get date range from filters
    const fromDate = filters.payroll_period ? filters.payroll_period[0] : '';
    const toDate = filters.payroll_period ? filters.payroll_period[1] : '';
    const formattedDateRange = `${fromDate} to ${toDate}`;
    
    // Calculate totals - EXCLUDE the last row which is a total row
    let totalEarnings = 0;
    let totalContributions = 0;
    let totalArrears = 0;
    let totalPrepayments = 0;
    let totalSurcharge = 0;
    let totalPayment = 0;
    
    // Use data.slice(0, -1) to exclude the last row
    const dataWithoutTotalRow = data.length > 1 ? data.slice(0, -1) : data;
    
    // Count unique employees (excluding the total row)
    const employeeCount = dataWithoutTotalRow.length;
    
    // Calculate totals based on currency - ensure we don't double count
    const processedEmployees = new Set();
    
    dataWithoutTotalRow.forEach(item => {
        // Only process each employee once to avoid double-counting
        const employeeId = item.employee || (item.surname + '-' + item.first_names);
        
        if (!processedEmployees.has(employeeId)) {
            processedEmployees.add(employeeId);
            
            if (currency === "USD") {
                totalEarnings += flt(item.total_insurable_earnings_usd || 0);
                totalContributions += flt(item.current_contributions_usd || 0);
                totalArrears += flt(item.arrears_usd || 0);
                totalPrepayments += flt(item.prepayments_usd || 0);
                totalSurcharge += flt(item.surcharge_usd || 0);
                totalPayment += flt(item.total_payment_usd || 0);
            } else {
                totalEarnings += flt(item.total_insurable_earnings_zwl || 0);
                totalContributions += flt(item.current_contributions_zwl || 0);
                totalArrears += flt(item.arrears_zwl || 0);
                totalPrepayments += flt(item.prepayments_zwl || 0);
                totalSurcharge += flt(item.surcharge_zwl || 0);
                totalPayment += flt(item.total_payment_zwl || 0);
            }
        }
    });
    
    // Calculate WCIF contribution (1.25% of total earnings)
    const wcifContribution = totalEarnings * 0.0125;
    
    // Calculate grand total - NPS payment + WCIF contribution
    const grandTotal = totalPayment + wcifContribution;
    
    // Format currency values
    const formattedTotalEarnings = format_currency(totalEarnings, currency);
    const formattedTotalContributions = format_currency(totalContributions, currency);
    const formattedTotalArrears = format_currency(totalArrears, currency);
    const formattedTotalPrepayments = format_currency(totalPrepayments, currency);
    const formattedTotalSurcharge = format_currency(totalSurcharge, currency);
    const formattedTotalPayment = format_currency(totalPayment, currency);
    const formattedWcifContribution = format_currency(wcifContribution, currency);
    const formattedGrandTotal = format_currency(grandTotal, currency);
    
    // Get company information
    const company = frappe.defaults.get_user_default("Company");
    
    // Create a new window for the report
    const w = window.open();
    
    // Generate HTML content
    let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NSSA P4 Form</title>
            <style>
                /* General Styles */
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 10px;
                    margin: 0px auto;
                    padding: 0;
                    width: 100%;
                    min-height: 29.7cm;
                    background-color: #000;
                }
                .print-format-gutter{
                    padding: 0px !important;
                }
                .page {
                    width: 21cm;
                    min-height: 29.7cm;
                    padding:0.3cm 1cm;
                    position: relative;
                    font-weight: bold;
                    margin: 0px auto;
					background-color: #fff;
                }
                /* NSSA Branding */
                .nssa-branding {
                    text-align: center;
                    margin-bottom: 5px;
                }
                .ssr-no {
                    text-align: left;
                    font-size: 10px;
                }
                /* Document Information */
                .doc-info {
                    display: grid;
                    grid-template-columns: 1fr 2fr 1fr;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .doc-info-left {
                    text-align: left;
                }
                .doc-info-center {
                    text-align: center;
                }
                .doc-info-right {
                    text-align: right;
                }
                .doc-header{
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                }
                /* Employer Details Table */
                .employer-details table {
                    width: 70%;
                }
                .employer-details td {
                    padding: 5px;
                }
                .employer-details td:first-child {
                    font-weight: bold;
                    width: 30%;
                }
                /* Contribution Payable Table */
                .contribution-table table {
                    width: 100%;
                }
                .contribution-table th,
                .contribution-table td {
                    padding: 5px;
                    text-align: center;
                }
                .contribution-table th {
                    font-weight: bold;
                }
                .contribution-table th:nth-child(1),
                .contribution-table td:nth-child(1) {
                    text-align: left;
                }
                .cell-content {
                    border-radius: 7px;
                    padding: 10px;
                    border: 1px solid;
                    margin: -5px;
                }
                /* Important Notes */
                .notes {
                    margin-top: 10px;
                    font-size: 12px;
                }
                /* Declaration Section */
                .declaration {
                    margin-top: 20px;
                }
                .declaration p {
                    margin-bottom: 5px;
                }
                .signature-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    align-items: start;
                    gap: 10px;
                }
                .signature-section>div {
                    display: flex;
                    flex-direction: column;
                }
                .page-number {
                    position: absolute;
                    bottom: 2cm;
                    left: 1cm;
                    font-size: 10px;
                }
                .logo img {
                    height: 150px;
                    width: auto;
                    max-width: 200px;
                }
                .logo2 img {
                    height: auto;
                    width: auto;
                    max-width: 200px;
                    margin-top: -20px;
                    margin-bottom: 30px;
                    margin-right: -40px;
                }
                .text-primary{
                    color: blue !important;
                    border-color: #000;
                }
                .text-danger{
                    color: red !important;
                    border-color: #000;
                }
                @media print {
                    body {
                        background-color: #fff;
                    }
                    .page {
                        box-shadow: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="doc-header">
                    <div class="nssa-branding doc-info-left">
                        <div class="logo">
                            <img src="/files/nsaa-logo.jpeg" alt="NSSA Logo">
                        </div>
                    </div>
            
                    <div class="doc-info-right">
                        <div class="logo2">
                            <img src="/files/payview.png" alt="NSSA Logo">
                        </div>
                        <p>REMITTANCE ADVICE: FORM P4 A</p>
                        <h1>NATIONAL SOCIAL SECURITY AUTHORITY</h1>
                    </div>
                </div>
                
                <div class="doc-info">
                    <div class="doc-info-left">
                        <p>SSR No:</p>
                    </div>
                    <div class="doc-info-center">
                        <p>Industry Code (IC):</p>
                    </div>
                    <div class="doc-info-right">
                        <p>WCIF Rate: 1.25%</p>
                    </div>
                </div>

                <div class="employer-details">
                    <table>
                        <tr>
                            <td>Contribution Month:</td>
                            <td>${formattedDateRange}</td>
                        </tr>
                        <tr>
                            <td>Employer's Name:</td>
                            <td>${company}</td>
                        </tr>
                        <tr>
                            <td>Address:</td>
                            <td>ZIMBABWE</td>
                        </tr>
                        <tr>
                            <td>Tel:</td>
                            <td>N/A</td>
                        </tr>
                        <tr>
                            <td colspan="2">Cash/RTGS/Cheque Number:</td>
                        </tr>
                    </table>
                </div>

                <div class="contribution-table">
                    <table>
                        <thead>
                            <tr>
                                <th><div class="cell-content">CONTRIBUTION PAYABLE FOR:</div></th>
                                <th><div class="cell-content">NPS (${currency} COMPONENT)</div></th>
                                <th><div class="cell-content">WCIF (${currency} COMPONENT)</div></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th><div class="cell-content">Number of employees</div></th>
                                <th><div class="cell-content text-primary">${employeeCount}</div></th>
                                <th><div class="cell-content text-primary">${employeeCount}</div></th>
                            </tr>
                            <tr>
                                <th><div class="cell-content" style="margin-bottom: 15px">Total Insurable Earnings</div></th>
                                <th><div class="cell-content text-danger">${formattedTotalEarnings}</div></th>
                                <th><div class="cell-content text-danger">${formattedTotalEarnings}</div></th>
                            </tr>
                            <tr>
                                <th><div class="cell-content">Current contributions:</div></th>
                                <th><div class="cell-content text-danger">${formattedTotalContributions}</div></th>
                                                                <th><div class="cell-content text-danger">${formattedWcifContribution}</div></th>
                            </tr>
                            <tr>
                                <th><div class="cell-content">Arrears:</div></th>
                                <th><div class="cell-content text-danger">${formattedTotalArrears}</div></th>
                                <th><div class="cell-content text-danger">${format_currency(0, currency)}</div></th>
                            </tr>
                            <tr>
                                <th><div class="cell-content">Prepayments:</div></th>
                                <th><div class="cell-content text-danger">${formattedTotalPrepayments}</div></th>
                                <th><div class="cell-content text-danger">${format_currency(0, currency)}</div></th>
                            </tr>
                            <tr>
                                <th><div class="cell-content">Surcharge:</div></th>
                                <th><div class="cell-content text-danger">${formattedTotalSurcharge}</div></th>
                                <th><div class="cell-content text-danger">${format_currency(0, currency)}</div></th>
                            </tr>
                            <tr>
                                <th><div class="cell-content">Total Payment:</div></th>
                                <th><div class="cell-content text-danger">${formattedTotalPayment}</div></th>
                                <th><div class="cell-content text-danger">${formattedWcifContribution}</div></th>
                            </tr>
                            <tr>
                                <td>GRAND TOTALS (${currency} COMPONENT)</td>
                                <th colspan="2"><div class="cell-content text-danger">${formattedGrandTotal}</div></th>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="notes">
                    <p>In terms of SI 393 of 1993 as amended, the employer must remit contributions by the 10th day of the month following deduction, whether or not an invoice has been received.</p>
                    <p>**Failure to pay contributions by the 10th of the month will result in surcharges and interest being levied on your account.</p>
                    <p>**In the event of WCIF payment not being made by the due date, you are considered uninsured.</p>
                    <p>In case of any queries, please contact the Collections Enquiry Office at your nearest Regional Office.</p>
                </div>

                <div class="declaration">
                    <p>DECLARATION: I declare that the above information is a true reflection of the contribution due in respect of all insured employees for the month.</p>
                    <div class="signature-section">
                        <div>
                            <p>Signed: _______________________________</p>
                            <p>Name: ${frappe.session.user_fullname}</p>
                        </div>
                        <div>
                            <p>Date: ${frappe.datetime.get_today()}</p>
                            <p>Position Held: ADMINISTRATOR</p>
                        </div>
                        <div style="border: 1px solid; padding: 0.9cm; border-radius: 5px; text-align: center;">
                            <p>Company Stamp</p>
                        </div>
                    </div>
                </div>

                <div class="page-number">
                    <p>Page: 1 of 1</p>
                </div>
            </div>
            <script>
                // Auto-print when the page loads
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `;
    
    // Write to the new window
    w.document.write(html);
    w.document.close();
}



