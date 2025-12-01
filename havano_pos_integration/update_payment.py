import frappe
from frappe.utils import getdate

@frappe.whitelist()
def reprocess_payment_entries(start_date, end_date, paid_to):
    # Get all payment entries for February
    payment_entries = frappe.get_all("Payment Entry",
        filters={
            "posting_date": ["between", [start_date, end_date]],
            "paid_to": paid_to,
            "docstatus": 1
        },
        pluck="name"
    )
    
    for entry in payment_entries:
        doc = frappe.get_doc("Payment Entry", entry)
        doc.cancel()
        frappe.db.commit()
        
        amended_doc = frappe.copy_doc(doc)
        amended_doc.amended_from = doc.name
        amended_doc.docstatus = 0
        amended_doc.save()
        amended_doc.submit()
        frappe.db.commit()
    
    return "Successfully processed {} payment entries".format(len(payment_entries))