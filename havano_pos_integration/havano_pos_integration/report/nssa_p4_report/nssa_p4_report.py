# Copyright (c) 2025, Alphazen Technologies and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import flt, formatdate, format_date
from frappe import _

def execute(filters=None):
    columns = get_columns(filters)
    data = get_data(filters)
    
    return columns, data

def get_columns(filters):
    # Your existing get_columns code remains the same
    currency_label = filters.get("currency", "Currency")
    
    columns = [
        {"label": "Surname", "fieldname": "surname", "fieldtype": "Data", "width": 150},
        {"label": "First Names", "fieldname": "first_names", "fieldtype": "Data", "width": 200},
        {"label": "Start Date", "fieldname": "start_date", "fieldtype": "Date", "width": 150},
        {"label": "End Date", "fieldname": "end_date", "fieldtype": "Date", "width": 150},
    ]
    
    if currency_label == "USD":
        columns.extend([
            {"label": "Total Insurable Earnings (USD)", "fieldname": "total_insurable_earnings_usd", "fieldtype": "Currency", "width": 180},
            {"label": "Current Contributions (USD)", "fieldname": "current_contributions_usd", "fieldtype": "Currency", "width": 180},
            {"label": "Arrears (USD)", "fieldname": "arrears_usd", "fieldtype": "Currency", "width": 150},
            {"label": "Prepayments (USD)", "fieldname": "prepayments_usd", "fieldtype": "Currency", "width": 150},
            {"label": "Surcharge (USD)", "fieldname": "surcharge_usd", "fieldtype": "Currency", "width": 150},
            {"label": "Total Payment (USD)", "fieldname": "total_payment_usd", "fieldtype": "Currency", "width": 180}
        ])
    elif currency_label == "ZWL":
        columns.extend([
            {"label": "Total Insurable Earnings (ZWL)", "fieldname": "total_insurable_earnings_zwl", "fieldtype": "Currency", "width": 180},
            {"label": "Current Contributions (ZWL)", "fieldname": "current_contributions_zwl", "fieldtype": "Currency", "width": 180},
            {"label": "Arrears (ZWL)", "fieldname": "arrears_zwl", "fieldtype": "Currency", "width": 150},
            {"label": "Prepayments (ZWL)", "fieldname": "prepayments_zwl", "fieldtype": "Currency", "width": 150},
            {"label": "Surcharge (ZWL)", "fieldname": "surcharge_zwl", "fieldtype": "Currency", "width": 150},
            {"label": "Total Payment (ZWL)", "fieldname": "total_payment_zwl", "fieldtype": "Currency", "width": 180}
        ])
    
    return columns

def get_data(filters):
    conditions = ""
    if filters.get("currency"):
        conditions += f" AND ss.currency = '{filters.get('currency')}'"
    
    # Handle the date range filter
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
            CASE WHEN ss.currency = 'USD' THEN ss.gross_pay END AS total_insurable_earnings_usd,
            CASE WHEN ss.currency = 'USD' THEN (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA') END AS current_contributions_usd,
            CASE WHEN ss.currency = 'USD' THEN (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Arrears') END AS arrears_usd,
            CASE WHEN ss.currency = 'USD' THEN (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Prepayments') END AS prepayments_usd,
            CASE WHEN ss.currency = 'USD' THEN (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Surcharge') END AS surcharge_usd,
            CASE WHEN ss.currency = 'USD' THEN (
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA'), 0) +
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Arrears'), 0) +
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Prepayments'), 0) +
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Surcharge'), 0)
            ) END AS total_payment_usd,
            CASE WHEN ss.currency = 'ZWL' THEN ss.gross_pay END AS total_insurable_earnings_zwl,
            CASE WHEN ss.currency = 'ZWL' THEN (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA') END AS current_contributions_zwl,
            CASE WHEN ss.currency = 'ZWL' THEN (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Arrears') END AS arrears_zwl,
            CASE WHEN ss.currency = 'ZWL' THEN (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Prepayments') END AS prepayments_zwl,
            CASE WHEN ss.currency = 'ZWL' THEN (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Surcharge') END AS surcharge_zwl,
            CASE WHEN ss.currency = 'ZWL' THEN (
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA'), 0) +
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Arrears'), 0) +
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Prepayments'), 0) +
                COALESCE((SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='NSSA Surcharge'), 0)
            ) END AS total_payment_zwl
        FROM `tabSalary Slip` ss
        JOIN `tabEmployee` emp ON ss.employee = emp.name
        WHERE ss.docstatus = 1 {conditions}
    """
    
    return frappe.db.sql(query, as_dict=True)
