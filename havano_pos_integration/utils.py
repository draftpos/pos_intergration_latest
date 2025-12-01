import frappe

def create_response(status,message,data=None):
    frappe.local.response.http_status_code = status
    frappe.local.response.message = message
    if data is not None:
        frappe.local.response.data = data
        
        