import frappe
from frappe.utils import escape_html,cstr
from frappe.auth import LoginManager
from frappe import throw, msgprint, _
from frappe.utils.background_jobs import enqueue
import requests
import random
import json
import base64
from havano_pos_integration.utils import create_response
from tzlocal import get_localzone
import pytz


@frappe.whitelist(allow_guest=True)
def login(usr,pwd, timezone):

    local_tz = str(get_localzone())
    erpnext_tz = frappe.utils.get_system_timezone()

    if timezone != erpnext_tz:
        frappe.local.response.http_status_code = 400
        frappe.local.response["message"] = f"Timezone mismatch. Your timezone is {timezone}, but system requires {erpnext_tz}"
        return

    try:
        login_manager = frappe.auth.LoginManager()
        login_manager.authenticate(user=usr,pwd=pwd)
        login_manager.post_login()
    except frappe.exceptions.AuthenticationError:
        frappe.clear_messages()
        frappe.local.response.http_status_code = 422
        frappe.local.response["message"] =  "Invalid Email or Password"
        return
    
    user = frappe.get_doc('User',frappe.session.user)

    api_generate=generate_keys(user)
       
    token_string = str(api_generate['api_key']) +":"+ str(api_generate['api_secret'])

    # Get user permissions for warehouse and cost center
    warehouses = frappe.get_list("User Permission", 
        filters={
            "user": user.name,
            "allow": "Warehouse"
        },
        pluck="for_value"
    )
    
    cost_centers = frappe.get_list("User Permission",
        filters={
            "user": user.name, 
            "allow": "Cost Center"
        },
        pluck="for_value"
    )
    default_warehouse = frappe.db.get_value("User Permission", 
        {"user": user.name, "allow": "Warehouse", "is_default": 1}, "for_value")
    
    default_cost_center = frappe.db.get_value("User Permission",
        {"user": user.name, "allow": "Cost Center", "is_default": 1}, "for_value")

    default_customer = frappe.db.get_value("User Permission",
        {"user": user.name, "allow": "Customer", "is_default": 1}, "for_value") 

    # Get items and their quantities from default warehouse
    warehouse_items = []
    if default_warehouse:
        warehouse_items = frappe.db.sql("""
            SELECT 
                item.item_code,
                item.item_name,
                item.description,
                item.stock_uom,
                bin.actual_qty,
                bin.projected_qty
            FROM `tabItem` item
            LEFT JOIN `tabBin` bin ON bin.item_code = item.item_code 
            WHERE bin.warehouse = %s
        """, default_warehouse, as_dict=1)

    # Get customers with the same cost center as the default cost center
    customers = []
    if default_cost_center:
        customers = frappe.get_list("Customer",
            filters={
                "custom_cost_center": default_cost_center
            },
            fields=["name", "customer_name", "customer_group", "territory", "custom_cost_center"]
        )

    default_company = frappe.db.get_single_value('Global Defaults','default_company')
    if default_company:
        default_company_doc = frappe.get_doc("Company" , default_company) 

    frappe.response["user"] =   {
        "first_name": escape_html(user.first_name or ""),
        "last_name": escape_html(user.last_name or ""),
        "gender": escape_html(user.gender or "") or "",
        "birth_date": user.birth_date or "",       
        "mobile_no": user.mobile_no or "",
        "username":user.username or "",
        "full_name":user.full_name or "",
        "email":user.email or "",
        "warehouse": default_warehouse,
        "cost_center": default_cost_center,
        "default_customer": default_customer,
        "customers": customers,
        "warehouse_items": warehouse_items,
        "time_zone": f"{local_tz}{erpnext_tz}",
        "company" : {
            "name" : default_company_doc.name or "",
            "email" : default_company_doc.email or "",
            "website" : default_company_doc.website or ""
        },
    }
    frappe.response["token_string"] = token_string
    frappe.response["token"] =  base64.b64encode(token_string.encode("ascii")).decode("utf-8")

    return


def generate_keys(user):
    api_secret = api_key = ''
    if not user.api_key and not user.api_secret:
        api_secret = frappe.generate_hash(length=15)
        # if api key is not set generate api key
        api_key = frappe.generate_hash(length=15)
        user.api_key = api_key
        user.api_secret = api_secret
        user.save(ignore_permissions=True)
    else:
        api_secret = user.get_password('api_secret')
        api_key = user.get('api_key')
    return {"api_secret": api_secret, "api_key": api_key}

# For Verfiy OTP Function
@frappe.whitelist(allow_guest=True)
def logout(user):
    try:
        user = frappe.get_doc("User",user)
        user.api_key = None
        user.api_secret = None
        user.save(ignore_permissions = True)
        
        frappe.local.login_manager.logout()
        create_response(200, "Logged Out Successfully")
        return
    except frappe.DoesNotExistError:
        # Handle case where user document is not found
        frappe.log_error(f"User '{user}' does not exist.", "Logout Failed")
        create_response(404, "User not found")
        return
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Logout Failed")
        create_response(417, "Something went wrong", str(e))
        return