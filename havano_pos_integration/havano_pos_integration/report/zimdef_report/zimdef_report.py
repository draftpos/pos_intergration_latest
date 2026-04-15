# Copyright (c) 2025, Alphazen Technologies and contributors
# For license information, please see license.txt

# import frappe


#def execute(filters=None):
#	columns, data = [], []
#	return columns, data
import frappe
from frappe.utils import flt

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {"label": "First Name", "fieldname": "first_name", "fieldtype": "Data", "width": 150},
        {"label": "Surname", "fieldname": "surname", "fieldtype": "Data", "width": 150},
        {"label": "Start Date", "fieldname": "start_date", "fieldtype": "Date", "width": 150},
        {"label": "End Date", "fieldname": "end_date", "fieldtype": "Date", "width": 150},
        {"label": "Gross ZWD", "fieldname": "gross_zwd", "fieldtype": "Currency", "width": 150},
        {"label": "Standard Levy ZWD", "fieldname": "standard_levy_zwd", "fieldtype": "Currency", "width": 150},
        {"label": "Gross USD", "fieldname": "gross_usd", "fieldtype": "Currency", "width": 180},
        {"label": "Standard Levy USD", "fieldname": "standard_levy_usd", "fieldtype": "Currency", "width": 180}
    ]

def get_data(filters):
    conditions = ""
    if filters.get("employee"):
        conditions += f" AND ss.employee = '{filters.get('employee')}'"
    if filters.get("currency"):
        conditions += f" AND ss.currency = '{filters.get('currency')}'"
    if filters.get("payroll_frequency"):
        from_date = filters.get("payroll_frequency")[0]
        to_date = filters.get("payroll_frequency")[1]
        conditions += f" AND ss.start_date >= '{from_date}' AND ss.end_date <= '{to_date}'"   
    
    query = f"""
        SELECT
            emp.first_name, emp.last_name AS surname,
            ss.start_date, ss.end_date,
            (SELECT gross_pay FROM `tabSalary Slip` WHERE currency='ZWL' AND name=ss.name) AS gross_zwd,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='Standard Levy' AND parentfield='deductions' AND ss.currency='ZWL') AS standard_levy_zwd,
            (SELECT gross_pay FROM `tabSalary Slip` WHERE currency='USD' AND name=ss.name) AS gross_usd,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='Standard Levy' AND parentfield='deductions' AND ss.currency='USD') AS standard_levy_usd
        FROM `tabSalary Slip` ss
        JOIN `tabEmployee` emp ON ss.employee = emp.name
        WHERE ss.docstatus = 1 {conditions}
    """
    
    return frappe.db.sql(query, as_dict=True)
