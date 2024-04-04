const asynchandler = (requesthandler)=>{
    (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next)).catch((err)=>next())
    }
}

export {asynchandler}


/* other methods to do same

const asynchandler = (fn) => async(req,res,next) =>{
    try{
        await=fn(req,res,next)
    }
    catch(error){
        res.status(error.code||500).json({
            success:false,
            messsage :error.message
        })
    }
}


*/