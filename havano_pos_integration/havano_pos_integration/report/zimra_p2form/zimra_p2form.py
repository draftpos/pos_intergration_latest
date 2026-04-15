# Copyright (c) 2025, Alphazen Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {"label": "Employer's Name", "fieldname": "employer_name", "fieldtype": "Data", "width": 200},
        {"label": "Trade Name", "fieldname": "name", "fieldtype": "Data", "width": 200},
        {"label": "TIN Number", "fieldname": "tin_number", "fieldtype": "Data", "width": 150},
        {"label": "Tax Period", "fieldname": "tax_period", "fieldtype": "Data", "width": 150},
        {"label": "Total Remuneration", "fieldname": "total_remuneration", "fieldtype": "Currency", "width": 200},
        {"label": "Gross PAYE", "fieldname": "gross_paye", "fieldtype": "Currency", "width": 200},
        {"label": "AIDS Levy (3%)", "fieldname": "aids_levy", "fieldtype": "Currency", "width": 200},
        {"label": "Total Tax Due", "fieldname": "total_tax_due", "fieldtype": "Currency", "width": 200},
        {"label": "Currency", "fieldname": "currency", "fieldtype": "Data", "width": 150}
    ]

def get_data(filters):
    conditions = ""
    if filters.get("currency"):
        conditions += f" AND ss.currency = '{filters.get('currency')}'"
    if filters.get("payroll_period"):
        conditions += f" AND CONCAT(ss.start_date, ' to ', ss.end_date) = '{filters.get('payroll_period')}'"
    
    query = f"""
        SELECT
            comp.company_name AS employer_name,
            comp.name,
            comp.tax_id AS tin_number,
            CONCAT(ss.start_date, ' to ', ss.end_date) AS tax_period,
            SUM(ss.gross_pay) AS total_remuneration,
            SUM(sd.amount) AS gross_paye,
            SUM(sd.amount * 0.03) AS aids_levy,
            SUM(sd.amount + (sd.amount * 0.03)) AS total_tax_due,
            ss.currency
        FROM `tabSalary Slip` ss
        JOIN `tabSalary Detail` sd ON ss.name = sd.parent
        JOIN `tabCompany` comp ON ss.company = comp.name
        WHERE ss.docstatus = 1 AND sd.salary_component = 'PAYEE' {conditions}
        GROUP BY ss.currency, ss.start_date, ss.end_date
    """
    
    return frappe.db.sql(query, as_dict=True)