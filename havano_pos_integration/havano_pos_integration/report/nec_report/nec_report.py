# Copyright (c) 2025, Alphazen Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt

def execute(filters=None):
    columns = get_columns(filters)
    data = get_data(filters)
    return columns, data

def get_columns(filters):
    currency = filters.get('currency', 'USD')
    return [
        {"label": "Surname", "fieldname": "surname", "fieldtype": "Data", "width": 150},
        {"label": "First Names", "fieldname": "first_names", "fieldtype": "Data", "width": 200},
        {"label": "Start Date", "fieldname": "start_date", "fieldtype": "Date", "width": 150},
        {"label": "End Date", "fieldname": "end_date", "fieldtype": "Date", "width": 150},
        {"label": "Grade", "fieldname": "grade", "fieldtype": "Data", "width": 150},
        {"label": f"NEC Earnings ({currency})", "fieldname": "nec_earnings", "fieldtype": "Currency", "width": 150},
        {"label": f"Employee Contribution ({currency})", "fieldname": "employee_contribution", "fieldtype": "Currency", "width": 150},
        {"label": f"Employer Contribution ({currency})", "fieldname": "employer_contribution", "fieldtype": "Currency", "width": 150},
        {"label": f"Total NEC ({currency})", "fieldname": "total_nec", "fieldtype": "Currency", "width": 150}
    ]

def get_data(filters):
    conditions = ""
    if filters.get("currency"):
        conditions += f" AND ss.currency = '{filters.get('currency')}'"
    if filters.get("payroll_period"):
        from_date = filters.get("payroll_period")[0]
        to_date = filters.get("payroll_period")[1]
        conditions += f" AND ss.start_date >= '{from_date}' AND ss.end_date <= '{to_date}'"
        
    query = f"""
        SELECT
            emp.last_name AS surname,
            emp.first_name AS first_names,
            ss.start_date,
            ss.end_date,
            emp.grade,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NEC Commercial') AS nec_earnings,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NEC Employee Contribution') AS employee_contribution,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NEC Employer Contribution') AS employer_contribution,
            (SELECT 
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NEC Commercial'), 0) +
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NEC Employee Contribution'), 0) +
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NEC Employer Contribution'), 0)
            ) AS total_nec        
        FROM `tabSalary Slip` ss
        JOIN `tabEmployee` emp ON ss.employee = emp.name
        WHERE ss.docstatus = 1 {conditions}
    """
    
    return frappe.db.sql(query, as_dict=True)

