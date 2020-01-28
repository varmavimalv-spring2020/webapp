//const joi = require('joi')
const BaseJoi = require('joi');
const Extension = require('joi-date-extensions');
const joi = BaseJoi.extend(Extension);

function validate(req) {
    res = {status: "", message: "", description: ""}

    const data = req.body
    const uniqueCategories = new Set(data.categories)
    console.log(Object.keys(data.categories).length);
    console.log(uniqueCategories.size);
    const validate_bill_date = joi.date().format('YYYY-MM-DD')
    const validate_due_date = joi.date().format('YYYY-MM-DD')
    const validate_paymentStatus = joi.string().valid("paid", "due", "past_due", "no_payment_required")
    const validate_amount_due = joi.number().min(0.01)

    if(!data){
        res.status = 204
        res.message = "Please enter billing details"
        return res
    }

    else if((Object.keys(data.categories).size) != uniqueCategories.size){
        res.status = 400
        res.message = "Please enter unique values for categories"
        return res
    }

    else if(!data.vendor || !data.bill_date || !data.due_date || !data.amount_due || !data.paymentStatus){
        res.status = 204
        res.message = "Please enter all the billing details : vendor, bill date, due date, amount due, payment status"
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
    console.log(res)
    return res
}

module.exports = validate