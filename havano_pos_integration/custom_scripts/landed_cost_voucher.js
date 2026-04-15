frappe.ui.form.on('Landed Cost Voucher', {
    on_submit: function(frm){
        // let me = this;
        let taxes = frm.doc.taxes || [];
    
        taxes.forEach(tax_row => {
                if (!tax_row.expense_account || !tax_row.amount) return;
    
                frappe.call({
                        method: "frappe.client.insert",
                        args: {
                                doc: {
                                        doctype: "Purchase Invoice",
                                        supplier: tax_row.custom_supplier,  // Using expense_account as supplier
                                        company: frm.doc.company,
                                        posting_date: frm.doc.posting_date,
                                        due_date: frm.doc.posting_date,  // Setting due_date same as posting_date
                                        bill_no: "LCV-" + frm.doc.name,  // Adding a bill number
                                        bill_date: frm.doc.posting_date,
                                        currency: frappe.defaults.get_global_default('currency'),
                                        conversion_rate: 1,
                                        buying_price_list: frappe.defaults.get_global_default('buying_price_list'),
                                        payment_terms_template: frappe.defaults.get_global_default('payment_terms'),
                                        tc_name: frappe.defaults.get_global_default('terms'),
                                        items: [{
                                                item_code: tax_row.custom_item,
                                                qty: 1,
                                                rate: tax_row.amount,
                                                amount: tax_row.amount,
                                                uom: "Nos",
                                                landed_cost_voucher_amount: tax_row.amount,
                                                expense_account: tax_row.expense_account,
                                                cost_center: frappe.defaults.get_global_default('cost_center')
                                        }],
                                        // landed_cost_voucher_reference: me.frm.doc.name,
                                        update_stock: 0,  // Since this is a service/expense invoice
                                        is_paid: 0,
                                        status: "Draft"
                                }
                        },
                        callback: function(r) {
                                if (!r.exc) {
                                        // Submit the Purchase Invoice
                                        frappe.call({
                                                method: "frappe.client.submit",
                                                args: {
                                                        doc: r.message
                                                },
                                                callback: function(s) {
                                                        if (!s.exc) {
                                                                frappe.msgprint(__(`Purchase Invoice ${r.message.name} created and submitted`));
                                                        } else {
                                                                frappe.msgprint(__(`Error submitting Purchase Invoice: ${s.exc}`));
                                                        }
                                                }
                                        });
                                } else {
                                        frappe.msgprint(__(`Error creating Purchase Invoice: ${r.exc}`));
                                }
                        }
                });
        });
    }
})
