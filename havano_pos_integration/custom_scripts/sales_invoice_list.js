// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

// render
frappe.listview_settings["Sales Invoice"] = {
	add_fields: [
		"customer",
		"customer_name",
		"base_grand_total",
		"outstanding_amount",
		"due_date",
		"company",
		"currency",
		"is_return",
        "posting_date",
        // "invoices",
        // "total_amount"
	],
	get_indicator: function (doc) {
		const status_colors = {
			Draft: "grey",
			Unpaid: "orange",
			Paid: "green",
			Return: "gray",
			"Credit Note Issued": "gray",
			"Unpaid and Discounted": "orange",
			"Partly Paid and Discounted": "yellow",
			"Overdue and Discounted": "red",
			Overdue: "red",
			"Partly Paid": "yellow",
			"Internal Transfer": "darkgrey",
		};
		return [__(doc.status), status_colors[doc.status], "status,=," + doc.status];
	},
	right_column: "grand_total",
   
	onload: function (listview) {
        let isGrouped = false;

        const groupButton = listview.page.add_inner_button(__('Group by Date & Customer'), function() {
            if (!isGrouped) {
                groupByDateAndCustomer(listview);
                isGrouped = true;
                groupButton.text(__('Ungroup'));
            } else {
                listview.refresh();
                isGrouped = false;
                groupButton.text(__('Group by Date & Customer'));
            }
        });
        const updateWarehouse = listview.page.add_inner_button(__('Update Warehouse'), function() {
            frappe.call({
                method: 'havano_pos_integration.update_sales_invoice.validate_warehouses',
                freeze: true,
                freeze_message: __('Syncing Warehouses...'),
                callback: function(r) {
                    listview.refresh();
                    frappe.msgprint(`${r.message} Warehouse sync completed for sales invoices`);
                }
            });
        });

		listview.page.add_action_item(__("Delivery Note"), () => {
			erpnext.bulk_transaction_processing.create(listview, "Sales Invoice", "Delivery Note");
		});

		listview.page.add_action_item(__("Payment"), () => {
			erpnext.bulk_transaction_processing.create(listview, "Sales Invoice", "Payment Entry");
		});
	},
};




function groupByDateAndCustomer(listview) {
    const groupedData = {};
    
    listview.data.forEach(doc => {
        const pdate = doc.posting_date;
        const customer = doc.customer;
        const key = `${pdate}-${customer}`;
        
        if (!groupedData[key]) {
            groupedData[key] = [];
        }
        groupedData[key].push(doc);
    });

    const groupedList = [];
    for (const key in groupedData) {
        const group = groupedData[key];
        const firstDoc = group[0];
        
        // Calculate the totals
        const totalAmount = group.reduce((sum, doc) => sum + doc.grand_total, 0);
        const baseGrandTotal = group.reduce((sum, doc) => sum + doc.base_grand_total, 0);
        
        // Create new document with forced values
        const groupedDoc = {
            ...firstDoc,
            invoices: group.map(doc => doc.name).join(', '),
            total_amount: totalAmount,
            grand_total: totalAmount,  // Force override the grand_total
            base_grand_total: baseGrandTotal,
            formatted_total_amount: format_currency(totalAmount, firstDoc.currency),
            formatted_grand_total: format_currency(totalAmount, firstDoc.currency),
            formatted_base_grand_total: format_currency(baseGrandTotal, firstDoc.currency)
        };

        groupedList.push(groupedDoc);
    }
    // console.log(groupedList[0].base_grand_total);

    listview.data = groupedList;
    listview.start = 0;
    listview.page.length = groupedList.length;
    listview.setup_columns();
    listview.$result.empty();
    listview.render_list();
    // listview.update_paging();
}


