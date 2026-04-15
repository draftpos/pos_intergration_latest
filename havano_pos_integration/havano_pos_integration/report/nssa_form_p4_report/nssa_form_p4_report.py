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
        {"label": "SSN", "fieldname": "ssn", "fieldtype": "Data", "width": 150},
        {"label": "National ID No", "fieldname": "national_id", "fieldtype": "Data", "width": 150},
        {"label": "Period", "fieldname": "period", "fieldtype": "Data", "width": 150},
        {"label": "Employee Staff No", "fieldname": "staff_no", "fieldtype": "Data", "width": 150},
        {"label": "Commencement Date", "fieldname": "commencement_date", "fieldtype": "Date", "width": 150},
        {"label": "First Names", "fieldname": "first_names", "fieldtype": "Data", "width": 200},
        {"label": "Surname", "fieldname": "surname", "fieldtype": "Data", "width": 150},
        {"label": "Date of Cessation", "fieldname": "cessation_date", "fieldtype": "Date", "width": 150},
        {"label": "Reason for Cessation", "fieldname": "reason_for_cessation", "fieldtype": "Data", "width": 150},
        {"label": "Nature of Employment", "fieldname": "nature_of_employment", "fieldtype": "Data", "width": 150},
        {"label": "NPS Insurable Earnings (ZIG)", "fieldname": "nps_insurable_earnings_zig", "fieldtype": "Currency", "width": 180,"options": "ZWL"},
        {"label": "Total NPS (9%) Contribution", "fieldname": "total_nps_contribution", "fieldtype": "Currency", "width": 180},
        {"label": "Basic Salary (WCIF)", "fieldname": "basic_salary_wcif", "fieldtype": "Currency", "width": 180},
        {"label": "Currency", "fieldname": "currency", "fieldtype": "Data", "width": 100},
        {"label": "Actual Insurable Earnings", "fieldname": "actual_insurable_earnings", "fieldtype": "currency", "width": 100}
    ]

def get_data(filters):
    conditions = ""
    if filters.get("payroll_period"):
        from_date = filters.get("payroll_period")[0]
        to_date = filters.get("payroll_period")[1]
        conditions += f" AND ss.start_date >= '{from_date}' AND ss.end_date <= '{to_date}'"
    if filters.get("currency"):
        conditions += f" AND ss.currency = '{filters.get('currency')}'"
    
    query = f"""
        SELECT
            emp.date_of_joining AS commencement_date,
            emp.first_name AS first_names,
            emp.last_name AS surname,
            emp.custom_ssn as ssn,
            emp.name as staff_no,
            emp.custom_national_id_no as national_id,
            ss.start_date as period,
            emp.relieving_date AS cessation_date,
            emp.reason_for_leaving as reason_for_cessation,
            emp.employment_type as nature_of_employment,
            CASE WHEN ss.currency = 'ZWL' THEN ss.custom_total_taxable_earnings_after_medical ELSE 0 END AS nps_insurable_earnings_zig,
            (ss.custom_total_taxable_earnings_after_medical * 0.09) AS total_nps_contribution,
            ss.custom_total_taxable_earnings_after_medical AS actual_insurable_earnings,
            (SELECT amount FROM `tabSalary Detail` WHERE parent=ss.name AND salary_component='Basic Salary') AS basic_salary_wcif,
            ss.currency
        FROM `tabSalary Slip` ss
        JOIN `tabEmployee` emp ON ss.employee = emp.name
        WHERE ss.docstatus = 1 {conditions}
    """
    
    return frappe.db.sql(query, as_dict=True)


