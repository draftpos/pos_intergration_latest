frappe.ui.form.on('Salary Slip', {
    // validate: function(frm) {
    //     frm.doc.deductions.forEach(row => {
    //         console.log(row)
    //         if(row.salary_component === 'NSSA') {
    //             let gross_pay = frm.doc.gross_pay || 0;
    //             frappe.model.set_value(row.doctype, row.name, 'amount', gross_pay * 0.045);
    //         }
    //     });
    //     frm.refresh_field('deductions');
    //     frm.trigger('calculate_total_deductions');

    //     let medical_amount = 0;
    //     let nssa_amount = 0;
        
    //     // Get both Medical and NSSA amounts
    //     frm.doc.deductions.forEach(row => {
    //         if(row.salary_component === 'Medical') {
    //             medical_amount = row.amount;
    //         }
    //         if(row.salary_component === 'NSSA') {
    //             nssa_amount = row.amount;
    //         }
    //     });
        
    //     // Calculate 50% of combined amounts
    //     let total_allowable = (medical_amount * 0.5) + nssa_amount;
    //     frm.set_value('custom_total_allowable_deductions', total_allowable);

    //     let taxable_income = frm.doc.gross_pay - total_allowable;
    //     frm.set_value('custom_total_taxable_income', taxable_income);
    // }
});
