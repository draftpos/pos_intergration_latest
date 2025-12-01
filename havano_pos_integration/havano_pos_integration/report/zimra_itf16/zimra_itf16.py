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
        {"label": "Surname", "fieldname": "surname", "fieldtype": "Data", "width": 150},
        {"label": "First Names", "fieldname": "first_names", "fieldtype": "Data", "width": 200},
        {"label": "Employee ID", "fieldname": "employee_id", "fieldtype": "Data", "width": 150},
        {"label": "DOB", "fieldname": "dob", "fieldtype": "Data", "width": 150},
        {"label": "Start Date", "fieldname": "start_date", "fieldtype": "Date", "width": 150},
        {"label": "End Date", "fieldname": "end_date", "fieldtype": "Date", "width": 150},
        {"label": "Gross Pay", "fieldname": "gross_pay", "fieldtype": "Currency", "width": 150},
        {"label": "Basic Pension", "fieldname": "basic_pension", "fieldtype": "Currency", "width": 150},
        {"label": "PAYE", "fieldname": "paye", "fieldtype": "Currency", "width": 150},
        {"label": "AIDS Levy", "fieldname": "aids_levy", "fieldtype": "Currency", "width": 150},
        {"label": "Currency", "fieldname": "currency", "fieldtype": "Data", "width": 100}
    ]

def get_data(filters):
    conditions = ""
    if filters.get("currency"):
        conditions += f" AND ss.currency = '{filters.get('currency')}'"
    if filters.get("employee"):
        conditions += f" AND ss.employee = '{filters.get('employee')}'"
    if filters.get("payroll_period"):
        from_date = filters.get("payroll_period")[0]
        to_date = filters.get("payroll_period")[1]
        conditions += f" AND ss.start_date >= '{from_date}' AND ss.end_date <= '{to_date}'"
    
    query = f"""
        SELECT
            emp.last_name AS surname,
            emp.first_name AS first_names,
            emp.name AS employee_id,
            emp.date_of_birth as dob,
            ss.start_date,
            ss.end_date,
            ss.gross_pay,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='Pension' AND parentfield='deductions') AS basic_pension,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='Payee' AND parentfield='deductions') AS paye,
            (SELECT amount * 0.03 FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='Payee' AND parentfield='deductions') AS aids_levy,
            ss.currency
        FROM `tabSalary Slip` ss
        JOIN `tabEmployee` emp ON ss.employee = emp.name
        WHERE ss.docstatus = 1 {conditions}
    """
    
    return frappe.db.sql(query, as_dict=True)
