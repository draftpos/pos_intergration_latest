# Copyright (c) 2025, Alphazen Technologies and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import flt, getdate, formatdate

def execute(filters=None):
    if not filters:
        filters = {}
        
    columns = get_columns()
    data = get_data(filters)
    
    return columns, data

def get_columns():
    columns = [
        {
            "label": _("Employee"),
            "fieldname": "employee",
            "fieldtype": "Link",
            "options": "Employee",
            "width": 150
        },
        {
            "label": _("Employee Name"),
            "fieldname": "employee_name",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("Department"),
            "fieldname": "department",
            "fieldtype": "Link",
            "options": "Department",
            "width": 120
        },
        {
            "label": _("Designation"),
            "fieldname": "designation",
            "fieldtype": "Link",
            "options": "Designation",
            "width": 120
        },
        {
            "label": _("Month"),
            "fieldname": "month",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Year"),
            "fieldname": "year",
            "fieldtype": "Data",
            "width": 80
        },
        {
            "label": _("Basic Salary"),
            "fieldname": "basic_salary",
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "label": _("Gross Pay"),
            "fieldname": "gross_pay",
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "label": _("Total Deduction"),
            "fieldname": "total_deduction",
            "fieldtype": "Currency",
            "width": 140
        },
        {
            "label": _("Net Pay"),
            "fieldname": "net_pay",
            "fieldtype": "Currency",
            "width": 120
        }
    ]
    
    return columns

def get_data(filters):
    conditions = get_conditions(filters)
    
    salary_slips = frappe.db.sql("""
        SELECT 
            ss.employee, ss.employee_name, e.department, e.designation,
            ss.start_date, ss.end_date, ss.posting_date, ss.gross_pay,
            ss.total_deduction, ss.net_pay, MONTH(ss.posting_date) as month,
            YEAR(ss.posting_date) as year
        FROM 
            `tabSalary Slip` ss
        LEFT JOIN 
            `tabEmployee` e ON ss.employee = e.name
        WHERE 
            ss.docstatus = 1 %s
        ORDER BY 
            e.department, ss.employee_name, ss.posting_date
    """ % conditions, filters, as_dict=1)
    
    data = []
    for ss in salary_slips:
        # Get basic salary from earnings
        basic_salary = frappe.db.sql("""
            SELECT amount FROM `tabSalary Detail`
            WHERE parent=%s AND salary_component='Basic' AND parentfield='earnings'
        """, ss.name)
        
        basic_salary = basic_salary[0][0] if basic_salary else 0
        
        row = {
            "employee": ss.employee,
            "employee_name": ss.employee_name,
            "department": ss.department,
            "designation": ss.designation,
            "month": formatdate(ss.posting_date, "MMM"),
            "year": ss.year,
            "basic_salary": basic_salary,
            "gross_pay": ss.gross_pay,
            "total_deduction": ss.total_deduction,
            "net_pay": ss.net_pay
        }
        
        data.append(row)
    
    return data

def get_conditions(filters):
    conditions = ""
    
    if filters.get("from_date"):
        conditions += " AND ss.posting_date >= %(from_date)s"
    if filters.get("to_date"):
        conditions += " AND ss.posting_date <= %(to_date)s"
    if filters.get("employee"):
        conditions += " AND ss.employee = %(employee)s"
    if filters.get("department"):
        conditions += " AND e.department = %(department)s"
        
    return conditions

