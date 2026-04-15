import frappe

def before_validate(doc, method):
    # Store the current currency value before standard validation overwrites it
    doc._original_currency = doc.currency

def validate(doc, method):
    # Store the user-selected currency before it was changed by standard validation
    original_currency = None
    if hasattr(doc, '_original_currency') and doc._original_currency:
        original_currency = doc._original_currency
    elif 'currency' in doc.as_dict() and doc.as_dict()['currency']:
        original_currency = doc.as_dict()['currency']
    
    # If we have a valid original currency, restore it
    if original_currency:
        doc.currency = original_currency

