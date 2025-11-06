import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "user"
    },
    channel: {
        type: Schema.Types.ObjectId, // one who  'subscriber' is subscribing 
        ref: "user"
    }
},{timestamps: true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);