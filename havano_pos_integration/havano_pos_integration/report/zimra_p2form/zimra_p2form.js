// Copyright (c) 2025, Alphazen Technologies and contributors
// For license information, please see license.txt

frappe.query_reports["ZIMRA P2FORM"] = {
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
		}
	],
	"onload": function(report) {
        // Add a custom button to render the report
        report.page.add_inner_button(__("Print Zimra P2 Form"), function() {
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
    // Get the report data
    const data = frappe.query_report.data;
    
    if (!data || data.length === 0) {
        frappe.msgprint(__("No data found for the selected filters."));
        return;
    }
    
    // Get the first row of data (assuming we're generating one form)
    // If the last row is a totals row, exclude it
    let row;
    if (data.length > 1 && (!data[data.length-1].employer_name || data[data.length-1].employer_name === "Total")) {
        // Use the first non-total row
        row = data[0];
    } else {
        row = data[0];
    }
    
    // Parse tax period to extract month and year
    let taxPeriodMonth = "";
    let taxPeriodYear = "";
    let dueDate = "";
    
    if (row.tax_period) {
        const periodParts = row.tax_period.split(" to ");
        if (periodParts.length > 0) {
            const startDate = moment(periodParts[0]);
            const endDate = periodParts.length > 1 ? moment(periodParts[1]) : startDate;
            
            taxPeriodMonth = startDate.format('MMMM');
            taxPeriodYear = endDate.format('YYYY');
            dueDate = endDate.add(10, 'days').format('DD-MMM-YY');
        }
    }
    
    // Count employees - we can get this from the report data
    // Assuming each row represents one employee's data
    const employeeCount = data.length;
    
    // Format currency values
    const formatCurrency = (value) => {
        return row.currency + '$' + frappe.format(value, {fieldtype: 'Currency'});
    };
    
    // Get user designation - safely check for user roles
    let userDesignation = "ACCOUNTANT";
    try {
        if (frappe.session && frappe.session.user_roles && 
            Array.isArray(frappe.session.user_roles) && 
            frappe.session.user_roles.includes("Administrator")) {
            userDesignation = "ADMINISTRATOR";
        }
    } catch (e) {
        console.log("Could not determine user role, defaulting to ACCOUNTANT");
    }
    
    // Create HTML content from template
    const htmlContent = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZIMRA P.A.Y.E. Return Form P2</title>
    <style>
        /* General Styles */
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            margin: 0px auto;
            padding: 0;
			width: 21cm;
			background-color: #000;
        }

        .page {
            width: 100%;
            /* A4 width */
            min-height: 29.7cm;
            /* A4 height */
            padding: 2cm;
            position: relative;
            margin: 0px auto;
			background-color: #fff;
        }

        /* ZIMRA Header */
        .zimra-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            width: 100%;
        }

        .zimra-header>div {
            padding: 5px;
        }

        .zimra-text {
            width: 80%;
            /* Span both columns */
            text-align: center;
        }
        .zimra-logo{
            width: 20%;
            text-align: right;
        }
        .zimra-logo > img{
            height: 70px;
        }

        .form-details {
            text-align: center;
            display: flex;
            width: 100%;
            font-size: 18px;
        }
        td{
            border: 1px solid;
            padding: 10px;
			font-size: 14px;
        }
        table{
            margin: 0px auto;
        }

        /* Employer Information Table */
        .employer-info-table table {
            width: 100%;
            border-collapse: collapse;
        }

        .employer-info-table td {
            padding: 5px;
        }

        .employer-info-table td:first-child {
            font-weight: bold;
            width: 30%;
        }

        /* Declaration */
        .declaration {
            margin-top: 10px;
            margin-bottom: 10px;
            font-size: 16px;
        }

        /* Payment Details Table */
        .payment-details-table table {
            width: 100%;
            /* Adjust width as needed */
            border-collapse: collapse;
        }

        .payment-details-table td {
            padding: 5px;
        }

        .payment-details-table td:first-child {
            font-weight: bold;
            width: 70%;
        }

        /* Signature Section */
        .signature-section {
            display: flex;
            margin-top: 20px;
            width: 100%;
            justify-content: space-between;
			font-size: 16px;
        }

        .signature-section>div {
            margin-bottom: 10px;
        }

        /* Important Notes */
        .notes {
            margin-top: 20px;
            font-size: 16px;
        }
        .text-right{
            text-align: right;
        }
        .stamp{
            border: 1px solid;
            padding: 100px;
        }
        .grid{
            display: block;
        }
    </style>
</head>

<body>

    <div class="page">
        <div class="zimra-header">
            <div class="zimra-text">
                <h1>ZIMBABWE REVENUE AUTHORITY</h1>
                <h3>Return For The Remittance of P.A.Y.E.</h3>
            </div>
            <div class="zimra-logo">
                <img src="/files/zimra.png">
                <h4>Form P2</h4>
            </div>
            
        </div>
        <div class="form-details">
            <p>Region:</p>
            <p>Station: ZIMBABWE For The Month of: ${taxPeriodMonth} ${taxPeriodYear}</p>
        </div>
        <h1>Part A</h1>

        <div class="employer-info-table">
            <table>
                <tr>
                    <td>1. Employer's Name</td>
                    <td>${row.employer_name || ''}</td>
                </tr>
                <tr>
                    <td>2. Trade Name</td>
                    <td>${row.name || ''}</td>
                </tr>
                <tr>
                    <td>3. TIN Number:</td>
                    <td>${row.tin_number || ''}</td>
                </tr>
                <tr>
                    <td>4. Physical Address</td>
                    <td>ZIMBABWE</td>
                </tr>
                <tr>
                    <td>5. Postal Address</td>
                    <td>ZIMBABWE</td>
                </tr>
                <tr>
                    <td>6. Tax Period</td>
                    <td>${taxPeriodMonth || ''}</td>
                </tr>
                <tr>
                    <td>7. Due Date:</td>
                    <td>${dueDate || ''}</td>
                </tr>
                <tr>
                    <td>8. E-mail address:</td>
                    <td>payviewpayroll@gmail.com</td>
                </tr>
                <tr>
                    <td>9. Cell number</td>
                    <td>0773 100 715</td>
                </tr>
            </table>
        </div>

      
        <h1>Part B</h1>

        <div class="payment-details-table">
            <table>
                <tr>
                    <td>1. Total Remuneration</td>
                    <td class="text-right">${formatCurrency(row.total_remuneration)}</td>
                </tr>
                <tr>
                    <td>2. Number of Employees (including contract employees)</td>
                    <td class="text-right">${employeeCount}</td>
                </tr>
                <tr>
                    <td>3. Gross P.A.Y.E.</td>
                    <td class="text-right">${formatCurrency(row.gross_paye)}</td>
                </tr>
                <tr>
                    <td>4. AIDS Levy @3%</td>
                    <td class="text-right">${formatCurrency(row.aids_levy)}</td>
                </tr>
                <tr>
                    <td>5. Total Tax Due</td>
                    <td class="text-right">${formatCurrency(row.total_tax_due)}</td>
                </tr>
            </table>
        </div>
        <div class="declaration">
            <p>I declare that the information I have given on this form is correct and complete.</p>
        </div>
        <div class="signature-section">
            <div class="grid">
                <h3>${frappe.session.user_fullname || 'ADMIN'}</h3>
                <h5>Name:</h5>
                
            </div>
            <div class="grid">
                <h3>${userDesignation}</h3>
                <h5>Designation:</h5>
                
            </div>
            <div class="grid">
                <h3>................................................................</h3>
                <h5>Signature:</h5>
            </div>
        </div>
        <div class="signature-section">
            <div style="margin-top: 50px;">
                <h4>Date of submission: ${moment().format('DD-MMM-YYYY')}</h4>
            </div>
            <div class="stamp">
                <p>OFFICIAL DATE STAMP</p>
            </div>
        </div>

        <div class="notes">
            <p>Please note that:</p>
            <p>1. Interest is charged at 10% per annum for late remittance of PAYE</p>
            <p>2. Late payments may attract penalties</p>
        </div>
    </div>

</body>

</html>`;

    // Open the report in a new window
    const w = window.open();
    w.document.write(htmlContent);
    w.document.close();
    
    // Add print functionality
    setTimeout(() => {
        w.print();
    }, 1000);
}
