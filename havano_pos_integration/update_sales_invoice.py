import frappe
from frappe import _

@frappe.whitelist()
def validate_warehouses():
    sales_invoice = frappe.get_all("Sales Invoice",
        filters={
            "docstatus": 1
        },
        pluck="name"
    )
    
    processed = 0
    for inv in sales_invoice:
        doc = frappe.get_doc('Sales Invoice', inv)
        
        if doc.docstatus == 1:  # Only run for submitted documents
            customer_warehouse = frappe.db.get_value('Customer', doc.customer, 'custom_warehouse')

            # If no customer warehouse, use first item's warehouse
            if not customer_warehouse and doc.items:
                customer_warehouse = doc.items[0].warehouse
            
            # If both warehouses are missing, raise error
            if not customer_warehouse and (not doc.items or not doc.items[0].warehouse):
                frappe.throw(_("No warehouse found. Please set either customer default warehouse or item warehouse for Sales Invoice: {0}").format(doc.name))

            has_mismatch = False
            
            for item in doc.items:
                if item.warehouse != doc.set_warehouse:
                    has_mismatch = True
                    break
                    
            if has_mismatch:
                # Cancel the document
                doc.cancel()
                new_doc = frappe.copy_doc(doc)
                new_doc.docstatus = 0
                new_doc.amended_from = doc.name
                new_doc.set_warehouse = customer_warehouse
                
                # Update warehouses in the new document
                for item in new_doc.items:
                    item.warehouse = customer_warehouse
                
                new_doc.save()
                new_doc.submit()
                processed += 1
                
    return processed