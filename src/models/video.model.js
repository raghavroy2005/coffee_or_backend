import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({   
    videoFile:{
        type: String, // cloudinary url
        required: true,
    },
    thumvnail:{
        type: String, // cloudinary url
        required: true,
    },
    title:{
        type: String, 
        required: true,
    },
    desctiption:{
        type:String,
        required: true,
    },
    duration:{
        type:Number,
        required:true,
    },
    viwes:{
        type: Number,
        default: 0 
    },
    isPublished:{
        type: Boolean,
        default:true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)