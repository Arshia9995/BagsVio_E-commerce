const generateOtp = ()=>{
    try{
        const otp=`${Math.floor(1000+Math.random()*9000)}`;
        // console.log(otp)
        return otp

    }catch(err){
        throw err
    }
}
module.exports=generateOtp;