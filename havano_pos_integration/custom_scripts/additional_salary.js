// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("Additional Salary", {
	setup: function (frm) {
		frm.add_fetch(
			"salary_component",
			"deduct_full_tax_on_selected_payroll_date",
			"deduct_full_tax_on_selected_payroll_date",
		);

		frm.set_query("employee", function () {
			return {
				filters: {
					company: frm.doc.company,
					status: ["!=", "Inactive"],
				},
			};
		});
	},
	validate: function (frm) {
		if (frm.doc.custom_amount_currency && frm.doc.currency) {
            frappe.call({
                method: "erpnext.setup.utils.get_exchange_rate",
                args: {
                    from_currency: frm.doc.currency,
                    to_currency: frm.doc.custom_company_currency,
                    transaction_date: frm.doc.posting_date || frappe.datetime.nowdate(),
                },
                callback: function (r) {
                    if (r.message) {
						
                        let exchange_rate = r.message;
                        if (frm.doc.currency !== frm.doc.company_currency) {
                            let calculated_amount = frm.doc.custom_amount_currency * exchange_rate;
							frm.doc.amount = parseInt(calculated_amount.toFixed(2));
                            frm.set_value("amount", parseInt(calculated_amount.toFixed(2)));
                        } else {
                            frm.set_value("amount", parseInt(frm.doc.custom_amount_currency));
							frm.doc.amount = parseInt(frm.doc.custom_amount_currency);
                        }
                    } else {
                        frappe.msgprint(__("Unable to fetch exchange rate."));
                    }
                },
            });
        } else {
            frappe.msgprint(__("Please ensure 'Custom Amount Currency' and 'Currency' are set."));
        }

		// 
		console.log(frm.doc.amount)
	},
	

	onload: function (frm) {
		if (frm.doc.type) {
			frm.trigger("set_component_query");
		}
		if (frm.doc.company) {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Company",
                    fieldname: "default_currency",
                    filters: { name: frm.doc.company },
                },
                callback: function (data) {
                    if (data.message) {
						frm.set_value("custom_company_currency", data.message.default_currency);
                        // frm.doc.custom_company_currency = data.message.default_currency;
                    }
                },
            });
        }
		
	},

	employee: function (frm) {
		if (frm.doc.employee) {
			frappe.run_serially([
				() => frm.trigger("get_employee_currency"),
				() => frm.trigger("set_company"),
			]);
		} else {
			frm.set_value("company", null);
		}
	},

	set_company: function (frm) {
		frappe.call({
			method: "frappe.client.get_value",
			args: {
				doctype: "Employee",
				fieldname: ["company", "salary_currency"],
				filters: {
					name: frm.doc.employee,
				},
			},
			callback: function (data) {
				if (data.message) {
					frm.set_value("company", data.message.company);
				}
			},
		});
	},

	company: function (frm) {
		frm.set_value("type", "");
		frm.trigger("set_component_query");
	},

	set_component_query: function (frm) {
		if (!frm.doc.company) return;
		
		let filters = { company: frm.doc.company };
		if (frm.doc.type) {
			filters.type = frm.doc.type;
		}
		frm.set_query("salary_component", function () {
			return {
				filters: filters,
			};
		});
	},

	get_employee_currency: function (frm) {
		frappe.call({
			method: "hrms.payroll.doctype.salary_structure_assignment.salary_structure_assignment.get_employee_currency",
			args: {
				employee: frm.doc.employee,
			},
			callback: function (r) {
				if (r.message) {
					frm.set_df_property("currency", "read_only", 0)
					frm.set_value("currency", r.message);
                    frm.set_dfield_property("currency", "read_only", 0);
					frm.refresh_fields();
				}
			},
		});
	},
});
