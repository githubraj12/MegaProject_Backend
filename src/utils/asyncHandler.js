const asyncHandler= (fn) => async(req,res,next ) =>{
try {
    await fn(req,res,next)
    
} catch (error) {
    res.status(error.code || 500).json({
        success:false,
        message: error.message
    })
}
}

export default asyncHandler;

// const asyncHandler =(requestHander)=>{
//     (req,res,next)=>{
//         Promise.resolve(requestHander(req,res,next)).catch((error)=>next(error) )
//     }
// }