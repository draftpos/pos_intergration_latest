frappe.ui.form.on("Income Tax Slab", {
    refresh: function(frm) {
        // Make currency field editable
        frm.set_df_property("currency", "read_only", 0);
        
        // Add create buttons only for submitted documents
        if (frm.doc.docstatus === 1) {
            add_create_buttons(frm);
        }
    },
    
    // No validate function that forces currency to a specific value
    // This allows users to keep their selected currency
});

/**
 * Adds create buttons to the form
 * @param {object} frm - The form object
 */
function add_create_buttons(frm) {
    frm.add_custom_button(
        __("Salary Structure Assignment"),
        () => {
            frappe.model.with_doctype("Salary Structure Assignment", () => {
                const doc = frappe.model.get_new_doc("Salary Structure Assignment");
                doc.income_tax_slab = frm.doc.name;
                frappe.set_route("Form", "Salary Structure Assignment", doc.name);
            });
        },
        __("Create")
    );
    
    frm.page.set_inner_btn_group_as_primary(__("Create"));
}