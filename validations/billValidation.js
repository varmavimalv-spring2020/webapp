const BaseJoi = require('joi');
const Extension = require('joi-date-extensions');
const joi = BaseJoi.extend(Extension);

function validate(req) {
    res = {status: "", message: "", description: ""}

    const data = req.body
    
    const validate_bill_date = joi.date().format('YYYY-MM-DD')
    const validate_due_date = joi.date().format('YYYY-MM-DD')
    const validate_paymentStatus = joi.string().valid("paid", "due", "past_due", "no_payment_required")
    const validate_amount_due = joi.number().min(0.01)

    if(Object.keys(data).length == 0){
        res.status = 400
        res.message = "Please enter billing details"
        return res
    }

    joi.validate(data.amount_due, validate_amount_due, (err, value) => {
        if(err){
            res.status = 400
            res.message = "Please enter a valid number. The minimum amount due is 0.01"
            return res
        }
        else{
            res.status = 200
        }
    });
    if(res.status == 400){
        return res
    }

    if(!data.vendor ||!data.categories ||!data.bill_date || !data.due_date || !data.amount_due || !data.paymentStatus){
        res.status = 400
        res.message = "Please enter all the billing details : vendor, bill date, due date, amount due, categories, payment status"
        return res
    }

    else if(data.id || data.created_ts || data.updated_ts || data.owner_id){
        res.status = 400
        res.message = "User cannot enter id, created_ts, updated_ts or owner_id"
        return res
    }

    const uniqueCategories = new Set(data.categories)
    if(data.categories && ((Object.keys(data.categories).length) != uniqueCategories.size)){
        res.status = 400
        res.message = "Please enter unique values for categories"
        return res
    }

    joi.validate(data.bill_date, validate_bill_date, (err, value) => {
        if(err){
            res.status = 400
            res.message = "Please enter bill_date in 'YYYY-MM-DD' format."
        }
        else{
            res.status = 200
        }
    });
    if(res.status == 400){
        return res
    }
    joi.validate(data.due_date, validate_due_date, (err, value) => {
        if(err){
            res.status = 400
            res.message = "Please enter due_date in 'YYYY-MM-DD' format."
        }
        else{
            res.status = 200
        } 
    });
    if(res.status == 400){
        return res
    }
    joi.validate(data.paymentStatus, validate_paymentStatus, (err, value) => {
        if(err){
            res.status = 400
            res.message = "Payment Status must be one of 'paid', 'due', 'past_due', 'no_payment_required'"
        }
        else{
            res.status = 200
        }
    });
    if(res.status == 400){
        return res
    }

    return res
}

module.exports = validate