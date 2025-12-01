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
        {"label": "NSSA (ZIG) Employee", "fieldname": "nssa_zig_employee", "fieldtype": "Currency", "options": "ZWL","width": 150},
        {"label": "NSSA (ZIG) Employer", "fieldname": "nssa_zig_employer", "fieldtype": "Currency", "options": "ZWL","width": 150},
        {"label": "NSSA (USD) Employee", "fieldname": "nssa_usd_employee", "fieldtype": "Currency", "options": "USD","width": 150},
        {"label": "NSSA (USD) Employer", "fieldname": "nssa_usd_employer", "fieldtype": "Currency", "options": "USD","width": 150},
        {"label": "Payroll Period", "fieldname": "payroll_period", "fieldtype": "Data", "width": 180}
    ]

def get_data(filters):
    # Build conditions list
    conditions = []
    values = {}
    
    if filters.get("employee"):
        conditions.append("ss.employee = %(employee)s")
        values["employee"] = filters.get("employee")
    
    if filters.get("currency"):
        conditions.append("ss.currency = %(currency)s")
        values["currency"] = filters.get("currency")
    
    # Handle payroll frequency as a date range
    if filters.get("payroll_frequency"):
        try:
            # Check if it's a list/tuple with two dates
            if isinstance(filters.get("payroll_frequency"), (list, tuple)) and len(filters.get("payroll_frequency")) == 2:
                from_date = filters.get("payroll_frequency")[0]
                to_date = filters.get("payroll_frequency")[1]
                
                conditions.append("ss.start_date >= %(from_date)s")
                values["from_date"] = from_date
                
                conditions.append("ss.end_date <= %(to_date)s")
                values["to_date"] = to_date
            else:
                # If it's a string, it might be a specific payroll frequency value
                conditions.append("ss.payroll_frequency = %(payroll_frequency)s")
                values["payroll_frequency"] = filters.get("payroll_frequency")
        except (IndexError, TypeError):
            frappe.msgprint("Invalid payroll frequency filter format")
    
    # Construct WHERE clause
    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    
    query = """
        SELECT
            emp.first_name, 
            emp.last_name AS surname,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA' AND parentfield='deductions' AND ss.currency='ZWL') AS nssa_zig_employee,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Employer' AND parentfield='earnings' AND ss.currency='ZWL') AS nssa_zig_employer,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA' AND parentfield='deductions' AND ss.currency='USD') AS nssa_usd_employee,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Employer' AND parentfield='earnings' AND ss.currency='USD') AS nssa_usd_employer,
            CONCAT(ss.start_date, ' to ', ss.end_date) AS payroll_period
        FROM `tabSalary Slip` ss
        JOIN `tabEmployee` emp ON ss.employee = emp.name
        {0}
    """.format(where_clause)
    
    return frappe.db.sql(query, values=values, as_dict=True)
